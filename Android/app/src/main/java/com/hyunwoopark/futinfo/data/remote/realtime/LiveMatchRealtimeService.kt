package com.hyunwoopark.futinfo.data.remote.realtime

import android.util.Log
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.realtime.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
data class LiveMatch(
    val fixture_id: Int,
    val league_id: Int,
    val league_name: String,
    val home_team_id: Int,
    val home_team_name: String,
    val home_team_logo: String?,
    val away_team_id: Int,
    val away_team_name: String,
    val away_team_logo: String?,
    val status: String,
    val status_short: String,
    val elapsed: Int?,
    val home_score: Int,
    val away_score: Int,
    val match_date: String,
    val venue_name: String?,
    val venue_city: String?,
    val referee: String?,
    val round: String,
    val last_updated: String,
    val created_at: String
)

@Serializable
data class LiveMatchEvent(
    val id: Int,
    val fixture_id: Int,
    val time_elapsed: Int,
    val time_extra: Int?,
    val team_id: Int,
    val team_name: String,
    val player_id: Int?,
    val player_name: String?,
    val assist_id: Int?,
    val assist_name: String?,
    val type: String,
    val detail: String?,
    val comments: String?
)

@Singleton
class LiveMatchRealtimeService @Inject constructor(
    private val supabaseClient: SupabaseClient
) {
    private val _liveMatches = MutableStateFlow<List<LiveMatch>>(emptyList())
    val liveMatches: StateFlow<List<LiveMatch>> = _liveMatches.asStateFlow()
    
    private val _matchEvents = MutableStateFlow<Map<Int, List<LiveMatchEvent>>>(emptyMap())
    val matchEvents: StateFlow<Map<Int, List<LiveMatchEvent>>> = _matchEvents.asStateFlow()
    
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()
    
    private var channel: RealtimeChannel? = null
    private val json = Json { ignoreUnknownKeys = true }
    
    companion object {
        private const val TAG = "LiveMatchRealtimeService"
        private const val CHANNEL_NAME = "live-matches-channel"
    }
    
    suspend fun startRealtimeSubscription() {
        try {
            Log.d(TAG, "Starting realtime subscription...")
            
            // 채널 생성
            channel = supabaseClient.realtime.channel(CHANNEL_NAME)
            
            // live_matches 테이블 변경 감지
            channel?.postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "live_matches"
            }?.collect { change ->
                when (change) {
                    is PostgresAction.Insert -> handleMatchInsert(change)
                    is PostgresAction.Update -> handleMatchUpdate(change)
                    is PostgresAction.Delete -> handleMatchDelete(change)
                    else -> {}
                }
            }
            
            // live_match_events 테이블 변경 감지
            channel?.postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "live_match_events"
                filter = PostgresChangeFilter()
            }?.collect { change ->
                when (change) {
                    is PostgresAction.Insert -> handleEventInsert(change)
                    else -> {}
                }
            }
            
            // 채널 구독
            channel?.subscribe()
            
            // 초기 데이터 로드
            loadInitialData()
            
            _isConnected.value = true
            Log.d(TAG, "Realtime subscription started successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start realtime subscription", e)
            _isConnected.value = false
        }
    }
    
    suspend fun stopRealtimeSubscription() {
        try {
            channel?.unsubscribe()
            channel = null
            _isConnected.value = false
            Log.d(TAG, "Realtime subscription stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop realtime subscription", e)
        }
    }
    
    private suspend fun loadInitialData() {
        try {
            // 현재 라이브 경기 로드
            val matches = supabaseClient.postgrest
                .from("live_matches")
                .select()
                .decodeList<LiveMatch>()
            
            _liveMatches.value = matches
            Log.d(TAG, "Loaded ${matches.size} live matches")
            
            // 각 경기의 이벤트 로드
            matches.forEach { match ->
                loadMatchEvents(match.fixture_id)
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load initial data", e)
        }
    }
    
    private suspend fun loadMatchEvents(fixtureId: Int) {
        try {
            val events = supabaseClient.postgrest
                .from("live_match_events")
                .select()
                .filter {
                    eq("fixture_id", fixtureId)
                }
                .decodeList<LiveMatchEvent>()
            
            val currentEvents = _matchEvents.value.toMutableMap()
            currentEvents[fixtureId] = events.sortedBy { it.time_elapsed }
            _matchEvents.value = currentEvents
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load events for fixture $fixtureId", e)
        }
    }
    
    private fun handleMatchInsert(action: PostgresAction.Insert) {
        try {
            val match = json.decodeFromString<LiveMatch>(action.record.toString())
            val currentMatches = _liveMatches.value.toMutableList()
            currentMatches.add(match)
            _liveMatches.value = currentMatches.sortedBy { it.match_date }
            
            Log.d(TAG, "New live match: ${match.home_team_name} vs ${match.away_team_name}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle match insert", e)
        }
    }
    
    private fun handleMatchUpdate(action: PostgresAction.Update) {
        try {
            val match = json.decodeFromString<LiveMatch>(action.record.toString())
            val currentMatches = _liveMatches.value.toMutableList()
            val index = currentMatches.indexOfFirst { it.fixture_id == match.fixture_id }
            
            if (index != -1) {
                currentMatches[index] = match
                _liveMatches.value = currentMatches
                
                Log.d(TAG, "Match updated: ${match.home_team_name} ${match.home_score}-${match.away_score} ${match.away_team_name}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle match update", e)
        }
    }
    
    private fun handleMatchDelete(action: PostgresAction.Delete) {
        try {
            val oldRecord = action.oldRecord
            val fixtureId = oldRecord["fixture_id"]?.toString()?.toIntOrNull() ?: return
            
            val currentMatches = _liveMatches.value.toMutableList()
            currentMatches.removeAll { it.fixture_id == fixtureId }
            _liveMatches.value = currentMatches
            
            // 이벤트도 제거
            val currentEvents = _matchEvents.value.toMutableMap()
            currentEvents.remove(fixtureId)
            _matchEvents.value = currentEvents
            
            Log.d(TAG, "Match ended: ID $fixtureId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle match delete", e)
        }
    }
    
    private fun handleEventInsert(action: PostgresAction.Insert) {
        try {
            val event = json.decodeFromString<LiveMatchEvent>(action.record.toString())
            val currentEvents = _matchEvents.value.toMutableMap()
            val fixtureEvents = currentEvents[event.fixture_id]?.toMutableList() ?: mutableListOf()
            
            fixtureEvents.add(event)
            currentEvents[event.fixture_id] = fixtureEvents.sortedBy { it.time_elapsed }
            _matchEvents.value = currentEvents
            
            Log.d(TAG, "New event: ${event.type} - ${event.player_name} (${event.time_elapsed}')")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle event insert", e)
        }
    }
}