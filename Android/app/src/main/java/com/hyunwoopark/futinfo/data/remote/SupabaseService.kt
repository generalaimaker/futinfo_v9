package com.hyunwoopark.futinfo.data.remote

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.functions.functions
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.datetime.Instant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseService @Inject constructor() {
    
    private val supabaseUrl = "https://uutmymaxkkytibuiiaax.supabase.co"
    private val supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
    
    val client: SupabaseClient = createSupabaseClient(
        supabaseUrl = supabaseUrl,
        supabaseKey = supabaseKey
    ) {
        install(Auth)
        install(Postgrest)
        install(Functions)
    }
    
    // Authentication
    suspend fun signUp(email: String, password: String, nickname: String) {
        client.auth.signUpWith(Email) {
            this.email = email
            this.password = password
            data = buildJsonObject {
                put("nickname", nickname)
            }
        }
    }
    
    suspend fun signIn(email: String, password: String) {
        client.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }
    
    suspend fun signOut() {
        client.auth.signOut()
    }
    
    suspend fun getCurrentUser() = client.auth.currentUserOrNull()
    
    // Profile Management
    suspend fun getProfile(userId: String): Profile? {
        return try {
            client.from("profiles")
                .select() {
                    filter {
                        eq("user_id", userId)
                    }
                }
                .decodeSingleOrNull<Profile>()
        } catch (e: Exception) {
            null
        }
    }
    
    suspend fun updateProfile(userId: String, updates: Map<String, Any>) {
        client.from("profiles")
            .update(updates) {
                filter {
                    eq("user_id", userId)
                }
            }
    }
    
    // Fixtures Caching
    suspend fun getCachedFixtures(date: String, leagueId: Int? = null): FixturesCacheData? {
        return try {
            val query = client.from("fixtures_cache").select() {
                filter {
                    eq("date", date)
                    leagueId?.let { eq("league_id", it) }
                }
            }
            
            val result = query.decodeSingleOrNull<FixturesCacheResponse>()
            
            // Check if cache is still valid
            result?.let {
                val expiresAt = Instant.parse(it.expiresAt)
                if (expiresAt > kotlinx.datetime.Clock.System.now()) {
                    it.data
                } else {
                    null
                }
            }
        } catch (e: Exception) {
            null
        }
    }
    
    // Community Functions
    suspend fun getPosts(
        boardId: String? = null,
        category: String? = null,
        limit: Int = 20,
        offset: Int = 0
    ): List<Post> {
        return try {
            client.from("posts")
                .select(Columns.raw("*, author:profiles(*), board:boards(*)")) {
                    filter {
                        eq("is_deleted", false)
                        boardId?.let { eq("board_id", it) }
                        category?.takeIf { it != "all" }?.let { eq("category", it) }
                    }
                    order("created_at", ascending = false)
                    limit(limit.toLong())
                    range(offset.toLong(), (offset + limit - 1).toLong())
                }
                .decodeList<Post>()
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    suspend fun createPost(
        boardId: String,
        title: String,
        content: String,
        category: String = "general",
        tags: List<String> = emptyList(),
        imageUrls: List<String> = emptyList()
    ): Post {
        val token = client.auth.currentAccessTokenOrNull() 
            ?: throw Exception("Not authenticated")
            
        val response = client.functions.invoke(
            function = "community-api/create-post",
            body = buildJsonObject {
                put("boardId", boardId)
                put("title", title)
                put("content", content)
                put("category", category)
                put("tags", Json.encodeToJsonElement(List.serializer(String.serializer()), tags))
                put("imageUrls", Json.encodeToJsonElement(List.serializer(String.serializer()), imageUrls))
            }
        )
        
        return Json.decodeFromString(CreatePostResponse.serializer(), response.data).data
    }
    
    suspend fun toggleLike(targetType: String, targetId: String): Boolean {
        val token = client.auth.currentAccessTokenOrNull() 
            ?: throw Exception("Not authenticated")
            
        val response = client.functions.invoke(
            function = "community-api/toggle-like",
            body = buildJsonObject {
                put("targetType", targetType)
                put("targetId", targetId)
            }
        )
        
        return Json.decodeFromString(LikeResponse.serializer(), response.data).liked
    }
    
    // Follow Management
    suspend fun followTeam(teamId: Int, teamName: String, teamImageUrl: String?) {
        val userId = getCurrentUser()?.id ?: throw Exception("Not authenticated")
        val profile = getProfile(userId) ?: throw Exception("Profile not found")
        
        client.from("follows")
            .insert(
                mapOf(
                    "user_id" to profile.id,
                    "follow_type" to "team",
                    "follow_id" to teamId,
                    "follow_name" to teamName,
                    "follow_image_url" to (teamImageUrl ?: "")
                )
            )
    }
    
    suspend fun unfollowTeam(teamId: Int) {
        val userId = getCurrentUser()?.id ?: throw Exception("Not authenticated")
        val profile = getProfile(userId) ?: throw Exception("Profile not found")
        
        client.from("follows")
            .delete {
                filter {
                    eq("user_id", profile.id)
                    eq("follow_type", "team")
                    eq("follow_id", teamId)
                }
            }
    }
    
    suspend fun getFollowedTeams(): List<Follow> {
        val userId = getCurrentUser()?.id ?: throw Exception("Not authenticated")
        val profile = getProfile(userId) ?: throw Exception("Profile not found")
        
        return client.from("follows")
            .select {
                filter {
                    eq("user_id", profile.id)
                    eq("follow_type", "team")
                }
            }
            .decodeList<Follow>()
    }
}

// Data Models
@Serializable
data class Profile(
    val id: String,
    @SerialName("user_id") val userId: String,
    val nickname: String,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("favorite_team_id") val favoriteTeamId: Int? = null,
    @SerialName("favorite_team_name") val favoriteTeamName: String? = null,
    val language: String = "ko",
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String
)

@Serializable
data class Post(
    val id: String,
    @SerialName("board_id") val boardId: String,
    @SerialName("author_id") val authorId: String,
    val title: String,
    val content: String,
    val category: String,
    val tags: List<String>,
    @SerialName("image_urls") val imageUrls: List<String>,
    @SerialName("view_count") val viewCount: Int,
    @SerialName("like_count") val likeCount: Int,
    @SerialName("comment_count") val commentCount: Int,
    @SerialName("is_pinned") val isPinned: Boolean,
    @SerialName("is_notice") val isNotice: Boolean,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    val author: Profile? = null,
    val board: Board? = null
)

@Serializable
data class Board(
    val id: String,
    val type: String,
    val name: String,
    val description: String? = null,
    @SerialName("team_id") val teamId: Int? = null,
    @SerialName("league_id") val leagueId: Int? = null,
    @SerialName("icon_url") val iconUrl: String? = null,
    @SerialName("post_count") val postCount: Int,
    @SerialName("member_count") val memberCount: Int
)

@Serializable
data class Follow(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("follow_type") val followType: String,
    @SerialName("follow_id") val followId: Int,
    @SerialName("follow_name") val followName: String,
    @SerialName("follow_image_url") val followImageUrl: String? = null,
    @SerialName("created_at") val createdAt: String
)

@Serializable
data class FixturesCacheResponse(
    val data: FixturesCacheData,
    @SerialName("expires_at") val expiresAt: String
)

@Serializable
data class FixturesCacheData(
    val response: List<Fixture>
)

@Serializable
data class Fixture(
    val fixture: FixtureInfo,
    val league: League,
    val teams: Teams,
    val goals: Goals,
    val score: Score
)

@Serializable
data class FixtureInfo(
    val id: Int,
    val referee: String? = null,
    val timezone: String,
    val date: String,
    val timestamp: Long,
    val periods: Periods,
    val venue: Venue,
    val status: Status
)

@Serializable
data class League(
    val id: Int,
    val name: String,
    val country: String,
    val logo: String,
    val flag: String? = null,
    val season: Int,
    val round: String? = null
)

@Serializable
data class Teams(
    val home: Team,
    val away: Team
)

@Serializable
data class Team(
    val id: Int,
    val name: String,
    val logo: String,
    val winner: Boolean? = null
)

@Serializable
data class Goals(
    val home: Int? = null,
    val away: Int? = null
)

@Serializable
data class Score(
    val halftime: Goals,
    val fulltime: Goals,
    val extratime: Goals? = null,
    val penalty: Goals? = null
)

@Serializable
data class Periods(
    val first: Long? = null,
    val second: Long? = null
)

@Serializable
data class Venue(
    val id: Int? = null,
    val name: String? = null,
    val city: String? = null
)

@Serializable
data class Status(
    val long: String,
    val short: String,
    val elapsed: Int? = null
)

// Response Models
@Serializable
data class CreatePostResponse(
    val data: Post
)

@Serializable
data class LikeResponse(
    val liked: Boolean
)