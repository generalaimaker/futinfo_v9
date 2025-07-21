package com.hyunwoopark.futinfo.data.repository

import com.hyunwoopark.futinfo.data.remote.FootballApiService
import com.hyunwoopark.futinfo.data.remote.dto.FixturesResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.LeaguesResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamProfileResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamStatisticsResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.SquadResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.LineupResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.FixtureStatsResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.FixtureEventResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamSearchResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.PlayerSearchResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.PlayersResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.PlayerProfileResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.NewsArticleDto
import com.hyunwoopark.futinfo.data.remote.dto.NewsCategoryDto
import com.hyunwoopark.futinfo.data.remote.dto.NewsImportanceDto
import com.hyunwoopark.futinfo.data.remote.dto.NewsCredibilityDto
import com.hyunwoopark.futinfo.data.remote.dto.NewsInterestLevelDto
import com.hyunwoopark.futinfo.data.remote.dto.LeagueStandingDto
import com.hyunwoopark.futinfo.data.remote.dto.TransferResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.SimpleTransferDto
import com.hyunwoopark.futinfo.data.remote.dto.BracketResponseDto
import com.hyunwoopark.futinfo.data.local.dao.LeagueDao
import com.hyunwoopark.futinfo.data.local.dao.StandingDao
import com.hyunwoopark.futinfo.data.local.dao.FixtureDao
import com.hyunwoopark.futinfo.data.local.dao.TeamProfileDao
import com.hyunwoopark.futinfo.data.local.dao.FavoriteDao
import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity
import com.hyunwoopark.futinfo.data.local.entity.toEntity
import com.hyunwoopark.futinfo.data.local.entity.toDto
import com.hyunwoopark.futinfo.data.local.FutInfoDatabase
import com.hyunwoopark.futinfo.domain.model.NewsArticle
import com.hyunwoopark.futinfo.domain.model.NewsCategory
import com.hyunwoopark.futinfo.domain.model.NewsImportance
import com.hyunwoopark.futinfo.domain.model.NewsCredibility
import com.hyunwoopark.futinfo.domain.model.NewsInterestLevel
import com.hyunwoopark.futinfo.domain.model.Board
import com.hyunwoopark.futinfo.domain.model.UserProfile
import com.hyunwoopark.futinfo.domain.model.PlayerProfile
import com.hyunwoopark.futinfo.domain.model.PlayerInfo
import com.hyunwoopark.futinfo.domain.model.PlayerBirth
import com.hyunwoopark.futinfo.domain.model.PlayerSeasonStats
import com.hyunwoopark.futinfo.domain.model.PlayerLeagueInfo
import com.hyunwoopark.futinfo.domain.model.PlayerGameStats
import com.hyunwoopark.futinfo.domain.model.PlayerSubstitutes
import com.hyunwoopark.futinfo.domain.model.PlayerShots
import com.hyunwoopark.futinfo.domain.model.PlayerGoals
import com.hyunwoopark.futinfo.domain.model.PlayerPasses
import com.hyunwoopark.futinfo.domain.model.PlayerTackles
import com.hyunwoopark.futinfo.domain.model.PlayerDuels
import com.hyunwoopark.futinfo.domain.model.PlayerDribbles
import com.hyunwoopark.futinfo.domain.model.PlayerFouls
import com.hyunwoopark.futinfo.domain.model.PlayerCards
import com.hyunwoopark.futinfo.domain.model.PlayerPenalty
import com.hyunwoopark.futinfo.data.remote.dto.TeamDto
import com.hyunwoopark.futinfo.domain.model.Team
import com.hyunwoopark.futinfo.domain.model.Transfer
import com.hyunwoopark.futinfo.domain.model.TransferStatus
import com.hyunwoopark.futinfo.domain.model.Post
import com.hyunwoopark.futinfo.domain.model.PostCategory
import com.hyunwoopark.futinfo.data.remote.dto.PostDto
import com.hyunwoopark.futinfo.data.remote.dto.BoardDto
import com.hyunwoopark.futinfo.data.remote.dto.toBoard
import com.hyunwoopark.futinfo.data.remote.dto.toPost
import com.hyunwoopark.futinfo.data.remote.dto.CommentDto
import com.hyunwoopark.futinfo.data.remote.dto.toComment
import com.hyunwoopark.futinfo.data.remote.dto.UserProfileDto
import com.hyunwoopark.futinfo.data.remote.dto.toUserProfile
import com.hyunwoopark.futinfo.data.remote.dto.LikeDto
import com.hyunwoopark.futinfo.domain.model.Bracket
import com.hyunwoopark.futinfo.domain.model.BracketRound
import com.hyunwoopark.futinfo.domain.model.BracketFixture
import com.hyunwoopark.futinfo.domain.model.BracketTeam
import com.hyunwoopark.futinfo.domain.model.BracketFixtureStatus
import com.hyunwoopark.futinfo.domain.model.BracketVenue
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.rpc
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import java.net.URLEncoder
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * FootballRepository의 구현체
 * FootballApiService를 사용하여 실제 API 호출을 수행합니다.
 */
@Singleton
class FootballRepositoryImpl @Inject constructor(
    private val footballApiService: FootballApiService,
    private val leagueDao: LeagueDao,
    private val standingDao: StandingDao,
    private val fixtureDao: FixtureDao,
    private val teamProfileDao: TeamProfileDao,
    private val favoriteDao: FavoriteDao,
    private val supabaseClient: SupabaseClient
) : FootballRepository {
    
    /**
     * 리그 목록을 가져옵니다.
     *
     * @param id 특정 리그 ID (선택사항)
     * @param name 리그 이름으로 검색 (선택사항)
     * @param country 국가별 리그 검색 (선택사항)
     * @param code 국가 코드로 검색 (선택사항)
     * @param season 시즌별 검색 (선택사항)
     * @param type 리그 타입 (League, Cup) (선택사항)
     * @param current 현재 시즌만 조회 (선택사항)
     * @param search 검색어 (선택사항)
     * @param last 최근 N개 결과 (선택사항)
     *
     * @return 리그 목록 응답
     */
    override suspend fun getLeagues(
        id: Int?,
        name: String?,
        country: String?,
        code: String?,
        season: Int?,
        type: String?,
        current: Boolean?,
        search: String?,
        last: Int?
    ): LeaguesResponseDto {
        return footballApiService.getLeagues(
            id = id,
            name = name,
            country = country,
            code = code,
            season = season,
            type = type,
            current = current,
            search = search,
            last = last
        )
    }
    
    /**
     * 경기 목록을 가져옵니다.
     *
     * @param id 특정 경기 ID (선택사항)
     * @param live 라이브 경기만 조회 (선택사항)
     * @param date 특정 날짜의 경기 (YYYY-MM-DD 형식) (선택사항)
     * @param league 리그 ID (선택사항)
     * @param season 시즌 (선택사항)
     * @param team 팀 ID (선택사항)
     * @param last 최근 N개 경기 (선택사항)
     * @param next 다음 N개 경기 (선택사항)
     * @param from 시작 날짜 (YYYY-MM-DD 형식) (선택사항)
     * @param to 종료 날짜 (YYYY-MM-DD 형식) (선택사항)
     * @param round 라운드 (선택사항)
     * @param status 경기 상태 (선택사항)
     * @param venue 경기장 ID (선택사항)
     * @param timezone 시간대 (선택사항)
     *
     * @return 경기 목록 응답
     */
    override suspend fun getFixtures(
        id: Int?,
        live: String?,
        date: String?,
        league: Int?,
        season: Int?,
        team: Int?,
        last: Int?,
        next: Int?,
        from: String?,
        to: String?,
        round: String?,
        status: String?,
        venue: Int?,
        timezone: String?
    ): FixturesResponseDto {
        android.util.Log.d("FutInfo_Repository", "🔄 Calling getFixtures with league: $league, season: $season, team: $team")
        
        try {
            // 1. 먼저 캐시된 데이터 확인 (특정 조건에서만)
            if (league != null && season != null && from != null && to != null) {
                val cachedFixtures = fixtureDao.getFixturesByLeague(league)
                    .filter { fixture ->
                        fixture.season == season &&
                        fixture.date >= from &&
                        fixture.date <= to
                    }
                val cacheExpiryTime = System.currentTimeMillis() - (24 * 60 * 60 * 1000) // 24시간 전
                
                // 캐시가 유효한 경우
                if (cachedFixtures.isNotEmpty() &&
                    cachedFixtures.all { it.lastUpdated > cacheExpiryTime }) {
                    
                    android.util.Log.d("FutInfo_Repository", "✅ 캐시된 경기 일정 데이터 사용 (${cachedFixtures.size}개)")
                    
                    // 추가 필터링 적용
                    val filteredFixtures = cachedFixtures.filter { fixture ->
                        (team == null || fixture.homeTeamId == team || fixture.awayTeamId == team) &&
                        (round == null || fixture.round == round) &&
                        (status == null || fixture.statusShort == status)
                    }
                    
                    // Entity를 DTO로 변환하여 반환
                    return FixturesResponseDto(
                        get = "fixtures",
                        parameters = com.hyunwoopark.futinfo.data.remote.dto.ParametersDto(),
                        errors = emptyList(),
                        results = filteredFixtures.size,
                        paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                        response = filteredFixtures.map { it.toDto() }
                    )
                }
            }
            
            android.util.Log.d("FutInfo_Repository", "🌐 API에서 새로운 경기 일정 데이터 가져오기")
            
            // 2. API에서 새로운 데이터 가져오기
            val response = if (id != null) {
                footballApiService.getFixtures(id = id)
            } else {
                footballApiService.getFixtures(
                    id = id,
                    live = live,
                    date = date,
                    league = league,
                    season = season ?: java.time.LocalDate.now().year,
                    team = team,
                    last = last,
                    next = next,
                    from = from,
                    to = to,
                    round = round,
                    status = status,
                    venue = venue,
                    timezone = timezone
                )
            }
            
            // 3. 새로운 데이터를 캐시에 저장 (특정 조건에서만)
            if (league != null && season != null && response.response.isNotEmpty()) {
                val fixtureEntities = response.response.map { it.toEntity() }
                fixtureDao.insertFixtures(fixtureEntities)
                android.util.Log.d("FutInfo_Repository", "💾 ${fixtureEntities.size}개 경기 일정 데이터 캐시에 저장")
            }
            
            return response
            
        } catch (e: Exception) {
            android.util.Log.e("FutInfo_Repository", "❌ API 호출 실패: ${e.message}")
            
            // API 실패 시 캐시된 데이터라도 반환
            if (league != null) {
                val cachedFixtures = fixtureDao.getFixturesByLeague(league)
                if (cachedFixtures.isNotEmpty()) {
                    android.util.Log.w("FutInfo_Repository", "⚠️ API 실패, 오래된 캐시 데이터 사용 (${cachedFixtures.size}개)")
                    
                    val filteredFixtures = cachedFixtures.filter { fixture ->
                        (season == null || fixture.season == season) &&
                        (team == null || fixture.homeTeamId == team || fixture.awayTeamId == team) &&
                        (from == null || fixture.date >= from) &&
                        (to == null || fixture.date <= to) &&
                        (round == null || fixture.round == round) &&
                        (status == null || fixture.statusShort == status)
                    }
                    
                    return FixturesResponseDto(
                        get = "fixtures",
                        parameters = com.hyunwoopark.futinfo.data.remote.dto.ParametersDto(),
                        errors = listOf("API 호출 실패, 캐시된 데이터 사용"),
                        results = filteredFixtures.size,
                        paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                        response = filteredFixtures.map { it.toDto() }
                    )
                }
            }
            
            throw e
        }
    }
    
    /**
     * 여러 리그의 특정 날짜 경기 목록을 병렬로 가져옵니다.
     * 일정 기능 개선을 위한 새로운 함수
     *
     * @param date 특정 날짜 (YYYY-MM-DD 형식) (필수)
     * @param leagueIds 여러 리그 ID 목록 (필수)
     * @param season 시즌 (선택사항)
     *
     * @return 여러 리그의 경기 목록을 종합한 응답
     */
    override suspend fun getFixtures(
        date: String,
        leagueIds: List<Int>,
        season: Int?
    ): FixturesResponseDto {
        android.util.Log.d("FutInfo_Repository", "🔄 여러 리그 병렬 호출: date=$date, leagues=${leagueIds.joinToString()}")
        
        return try {
            // coroutineScope를 사용하여 병렬 API 호출 실행
            coroutineScope {
                // 각 리그에 대해 async로 병렬 호출
                val deferredResults = leagueIds.map { leagueId ->
                    async {
                        try {
                            android.util.Log.d("FutInfo_Repository", "📡 리그 $leagueId API 호출 시작")
                            val result = footballApiService.getFixtures(
                                date = date,
                                league = leagueId,
                                season = season ?: java.time.LocalDate.now().year
                            )
                            android.util.Log.d("FutInfo_Repository", "✅ 리그 $leagueId: ${result.response.size}개 경기")
                            result
                        } catch (e: Exception) {
                            android.util.Log.e("FutInfo_Repository", "❌ 리그 $leagueId API 호출 실패: ${e.message}")
                            // 실패한 리그는 빈 응답 반환
                            FixturesResponseDto(
                                get = "fixtures",
                                parameters = com.hyunwoopark.futinfo.data.remote.dto.ParametersDto(),
                                errors = listOf("리그 $leagueId 호출 실패: ${e.message}"),
                                results = 0,
                                paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                                response = emptyList()
                            )
                        }
                    }
                }
                
                // 모든 병렬 호출 완료 대기
                val results = deferredResults.awaitAll()
                
                // 결과 종합
                val allFixtures = mutableListOf<com.hyunwoopark.futinfo.data.remote.dto.FixtureDto>()
                val allErrors = mutableListOf<String>()
                
                results.forEach { result ->
                    allFixtures.addAll(result.response)
                    allErrors.addAll(result.errors)
                }
                
                android.util.Log.d("FutInfo_Repository", "🎯 병렬 호출 완료: 총 ${allFixtures.size}개 경기, ${allErrors.size}개 오류")
                
                // 캐시에 저장 (성공한 결과만)
                if (allFixtures.isNotEmpty()) {
                    val fixtureEntities = allFixtures.map { it.toEntity() }
                    fixtureDao.insertFixtures(fixtureEntities)
                    android.util.Log.d("FutInfo_Repository", "💾 ${fixtureEntities.size}개 경기 데이터 캐시에 저장")
                }
                
                // 종합된 응답 반환
                FixturesResponseDto(
                    get = "fixtures",
                    parameters = com.hyunwoopark.futinfo.data.remote.dto.ParametersDto(),
                    errors = allErrors,
                    results = allFixtures.size,
                    paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                    response = allFixtures
                )
            }
            
        } catch (e: Exception) {
            android.util.Log.e("FutInfo_Repository", "❌ 병렬 API 호출 전체 실패: ${e.message}")
            
            // 전체 실패 시 캐시된 데이터라도 반환 시도
            val cachedFixtures = mutableListOf<com.hyunwoopark.futinfo.data.local.entity.FixtureEntity>()
            leagueIds.forEach { leagueId ->
                val leagueFixtures = fixtureDao.getFixturesByLeague(leagueId)
                    .filter { fixture -> fixture.date == date }
                cachedFixtures.addAll(leagueFixtures)
            }
            
            if (cachedFixtures.isNotEmpty()) {
                android.util.Log.w("FutInfo_Repository", "⚠️ 전체 API 실패, 캐시 데이터 사용 (${cachedFixtures.size}개)")
                return FixturesResponseDto(
                    get = "fixtures",
                    parameters = com.hyunwoopark.futinfo.data.remote.dto.ParametersDto(),
                    errors = listOf("API 호출 실패, 캐시된 데이터 사용"),
                    results = cachedFixtures.size,
                    paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                    response = cachedFixtures.map { it.toDto() }
                )
            }
            
            throw e
        }
    }
    
    /**
     * 지원되는 주요 리그들만 가져옵니다.
     * Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League
     *
     * @param season 시즌 (기본값: 현재 시즌)
     * @return 주요 리그 목록 응답
     */
    override suspend fun getSupportedLeagues(season: Int?): LeaguesResponseDto {
        android.util.Log.d("FutInfo_Repository", "🔄 Calling getSupportedLeagues with season: $season")
        
        try {
            // 1. 먼저 캐시된 데이터 확인
            val supportedLeagueIds = listOf(39, 140, 135, 78, 2, 3) // Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League
            val cachedLeagues = leagueDao.getSupportedLeagues(supportedLeagueIds)
            val cacheExpiryTime = System.currentTimeMillis() - (24 * 60 * 60 * 1000) // 24시간 전
            
            // 캐시가 유효하고 모든 리그가 있는 경우
            if (cachedLeagues.isNotEmpty() &&
                cachedLeagues.size == supportedLeagueIds.size &&
                cachedLeagues.all { it.lastUpdated > cacheExpiryTime }) {
                
                android.util.Log.d("FutInfo_Repository", "✅ 캐시된 리그 데이터 사용 (${cachedLeagues.size}개)")
                
                // Entity를 DTO로 변환하여 반환
                return LeaguesResponseDto(
                    get = "leagues",
                    parameters = com.hyunwoopark.futinfo.data.remote.dto.ParametersDto(),
                    errors = emptyList(),
                    results = cachedLeagues.size,
                    paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                    response = cachedLeagues.map { it.toDto() }
                )
            }
            
            android.util.Log.d("FutInfo_Repository", "🌐 API에서 새로운 리그 데이터 가져오기")
            
            // 2. API에서 새로운 데이터 가져오기
            var lastException: Exception? = null
            val maxRetries = 3
            val retryDelayMs = 2000L
            
            repeat(maxRetries) { attempt ->
                try {
                    android.util.Log.d("FutInfo_Repository", "🔄 시도 ${attempt + 1}/$maxRetries")
                    val response = footballApiService.getSupportedLeagues(season)
                    android.util.Log.d("FutInfo_Repository", "✅ Repository: Successfully got response")
                    android.util.Log.d("FutInfo_Repository", "📊 Response data: get=${response.get}, results=${response.results}")
                    
                    // 3. 새로운 데이터를 캐시에 저장
                    if (response.response.isNotEmpty()) {
                        val leagueEntities = response.response.map { it.toEntity() }
                        leagueDao.insertLeagues(leagueEntities)
                        android.util.Log.d("FutInfo_Repository", "💾 ${leagueEntities.size}개 리그 데이터 캐시에 저장")
                    }
                    
                    return response
                } catch (e: retrofit2.HttpException) {
                    lastException = e
                    when (e.code()) {
                        429 -> {
                            android.util.Log.w("FutInfo_Repository", "⏰ 요청 제한 (429) - ${retryDelayMs}ms 대기 후 재시도")
                            if (attempt < maxRetries - 1) {
                                delay(retryDelayMs * (attempt + 1))
                            }
                        }
                        403 -> {
                            android.util.Log.e("FutInfo_Repository", "🚫 접근 거부 (403) - API 구독 필요")
                            throw e // 403은 재시도해도 소용없으므로 즉시 실패
                        }
                        else -> {
                            android.util.Log.w("FutInfo_Repository", "❌ HTTP ${e.code()} 에러 - 재시도")
                            if (attempt < maxRetries - 1) {
                                delay(retryDelayMs)
                            }
                        }
                    }
                } catch (e: Exception) {
                    lastException = e
                    android.util.Log.e("FutInfo_Repository", "❌ Repository Exception: ${e.message}", e)
                    if (attempt < maxRetries - 1) {
                        delay(retryDelayMs)
                    }
                }
            }
            
            // 4. API 호출이 모두 실패한 경우, 캐시된 데이터라도 반환
            if (cachedLeagues.isNotEmpty()) {
                android.util.Log.w("FutInfo_Repository", "⚠️ API 실패, 오래된 캐시 데이터 사용 (${cachedLeagues.size}개)")
                return LeaguesResponseDto(
                    get = "leagues",
                    parameters = com.hyunwoopark.futinfo.data.remote.dto.ParametersDto(),
                    errors = listOf("API 호출 실패, 캐시된 데이터 사용"),
                    results = cachedLeagues.size,
                    paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                    response = cachedLeagues.map { it.toDto() }
                )
            }
            
            // 모든 재시도 실패
            throw lastException ?: Exception("알 수 없는 에러")
            
        } catch (e: Exception) {
            android.util.Log.e("FutInfo_Repository", "❌ getSupportedLeagues 전체 실패: ${e.message}", e)
            throw e
        }
    }
    
    /**
     * 팀 프로필 정보를 가져옵니다.
     *
     * @param id 팀 ID (필수)
     * @param name 팀 이름으로 검색 (선택사항)
     * @param league 리그 ID (선택사항)
     * @param season 시즌 (선택사항)
     * @param country 국가 (선택사항)
     * @param code 국가 코드 (선택사항)
     * @param venue 경기장 ID (선택사항)
     * @param search 검색어 (선택사항)
     *
     * @return 팀 프로필 응답
     */
    override suspend fun getTeamProfile(
        id: Int,
        name: String?,
        league: Int?,
        season: Int?,
        country: String?,
        code: String?,
        venue: Int?,
        search: String?
    ): TeamProfileResponseDto {
        android.util.Log.d("FutInfo_Repository", "🔄 Calling getTeamProfile for team: $id")
        
        try {
            // 1. 먼저 캐시된 데이터 확인
            val cachedTeamProfile = teamProfileDao.getTeamProfileById(id)
            val cacheExpiryTime = System.currentTimeMillis() - (24 * 60 * 60 * 1000) // 24시간 전
            
            // 캐시가 유효한 경우
            if (cachedTeamProfile != null && cachedTeamProfile.lastUpdated > cacheExpiryTime) {
                android.util.Log.d("FutInfo_Repository", "✅ 캐시된 팀 프로필 데이터 사용")
                
                // Entity를 DTO로 변환하여 반환
                return TeamProfileResponseDto(
                    get = "teams",
                    parameters = com.hyunwoopark.futinfo.data.remote.dto.TeamParametersDto(
                        id = id.toString(),
                        name = name,
                        league = league?.toString(),
                        season = season?.toString(),
                        country = country,
                        code = code,
                        venue = venue?.toString(),
                        search = search
                    ),
                    errors = emptyList(),
                    results = 1,
                    paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                    response = listOf(cachedTeamProfile.toDto())
                )
            }
            
            android.util.Log.d("FutInfo_Repository", "🌐 API에서 새로운 팀 프로필 데이터 가져오기")
            
            // 2. API에서 새로운 데이터 가져오기
            val response = footballApiService.getTeamProfile(
                id = id,
                name = name,
                league = league,
                season = season,
                country = country,
                code = code,
                venue = venue,
                search = search
            )
            
            // 3. 새로운 데이터를 캐시에 저장
            if (response.response.isNotEmpty()) {
                val teamProfileEntity = response.response.first().toEntity()
                teamProfileDao.insertTeamProfile(teamProfileEntity)
                android.util.Log.d("FutInfo_Repository", "💾 팀 프로필 데이터 캐시에 저장")
            }
            
            return response
            
        } catch (e: Exception) {
            android.util.Log.e("FutInfo_Repository", "❌ API 호출 실패: ${e.message}")
            
            // API 실패 시 캐시된 데이터라도 반환
            val cachedTeamProfile = teamProfileDao.getTeamProfileById(id)
            if (cachedTeamProfile != null) {
                android.util.Log.w("FutInfo_Repository", "⚠️ API 실패, 오래된 캐시 데이터 사용")
                
                return TeamProfileResponseDto(
                    get = "teams",
                    parameters = com.hyunwoopark.futinfo.data.remote.dto.TeamParametersDto(
                        id = id.toString(),
                        name = name,
                        league = league?.toString(),
                        season = season?.toString(),
                        country = country,
                        code = code,
                        venue = venue?.toString(),
                        search = search
                    ),
                    errors = listOf("API 호출 실패, 캐시된 데이터 사용"),
                    results = 1,
                    paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                    response = listOf(cachedTeamProfile.toDto())
                )
            }
            
            throw e
        }
    }
    
    /**
     * 팀 통계 정보를 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     * @param team 팀 ID (필수)
     * @param date 특정 날짜 (YYYY-MM-DD 형식) (선택사항)
     *
     * @return 팀 통계 응답
     */
    override suspend fun getTeamStatistics(
        league: Int,
        season: Int,
        team: Int,
        date: String?
    ): TeamStatisticsResponseDto {
        return footballApiService.getTeamStatistics(
            league = league,
            season = season,
            team = team,
            date = date
        )
    }
    
    /**
     * 팀 선수단 정보를 가져옵니다.
     *
     * @param team 팀 ID (필수)
     * @param season 시즌 (선택사항)
     *
     * @return 선수단 응답
     */
    override suspend fun getTeamSquad(
        team: Int,
        season: Int?
    ): SquadResponseDto {
        println("FootballRepository - getTeamSquad called with team: $team, season: $season")
        val result = footballApiService.getTeamSquad(
            team = team,
            season = null  // API가 2025 season을 인식하지 못하므로 null 사용
        )
        println("FootballRepository - Squad response: ${result.response.size} teams")
        result.response.firstOrNull()?.let {
            println("FootballRepository - First team players: ${it.players.size}")
        }
        return result
    }
    
    /**
     * 경기 라인업 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     *
     * @return 라인업 응답
     */
    override suspend fun getFixtureLineups(
        fixture: Int
    ): LineupResponseDto {
        return footballApiService.getFixtureLineups(fixture)
    }
    
    /**
     * 경기 통계 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     * @param team 팀 ID (선택사항, 특정 팀의 통계만 조회)
     *
     * @return 경기 통계 응답
     */
    override suspend fun getFixtureStatistics(
        fixture: Int,
        team: Int?
    ): FixtureStatsResponseDto {
        return footballApiService.getFixtureStatistics(fixture, team)
    }
    
    /**
     * 경기 이벤트 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     *
     * @return 경기 이벤트 응답
     */
    override suspend fun getFixtureEvents(
        fixture: Int
    ): FixtureEventResponseDto {
        return footballApiService.getFixtureEvents(fixture)
    }
    
    /**
     * 팀을 검색합니다.
     *
     * @param search 검색어 (필수)
     * @param country 국가별 필터링 (선택사항)
     * @param league 리그별 필터링 (선택사항)
     * @param season 시즌별 필터링 (선택사항)
     *
     * @return 팀 검색 결과 응답
     */
    override suspend fun searchTeams(
        search: String,
        country: String?,
        league: Int?,
        season: Int?
    ): TeamSearchResponseDto {
        return footballApiService.searchTeams(
            search = search,
            country = country,
            league = league,
            season = season
        )
    }
    
    /**
     * 선수를 검색합니다.
     *
     * @param search 검색어 (필수)
     * @param team 팀별 필터링 (선택사항)
     * @param league 리그별 필터링 (선택사항)
     * @param season 시즌별 필터링 (선택사항)
     *
     * @return 선수 검색 결과
     */
    override suspend fun searchPlayers(
        search: String,
        team: Int?,
        league: Int?,
        season: Int?
    ): PlayerSearchResponseDto {
        return footballApiService.searchPlayers(
            search = search,
            team = team,
            league = league,
            season = season
        )
    }
    
    /**
     * 리그 순위표를 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     * @param team 특정 팀 ID (선택사항)
     *
     * @return 순위표 응답
     */
    override suspend fun getStandings(
        league: Int,
        season: Int,
        team: Int?
    ): StandingsResponseDto {
        android.util.Log.d("FutInfo_Repository", "🔄 Calling getStandings for league: $league, season: $season, team: $team")
        
        try {
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] API 호출 전 - 파라미터 검증 완료")
            // 1. 먼저 캐시된 데이터 확인
            val cachedStandings = standingDao.getStandingsOnce(league, season)
            val cacheExpiryTime = System.currentTimeMillis() - (24 * 60 * 60 * 1000) // 24시간 전
            
            // 캐시가 유효한 경우
            if (cachedStandings.isNotEmpty() &&
                cachedStandings.all { it.lastUpdated > cacheExpiryTime }) {
                
                android.util.Log.d("FutInfo_Repository", "✅ 캐시된 순위표 데이터 사용 (${cachedStandings.size}개)")
                
                // 특정 팀만 요청된 경우 필터링
                val filteredStandings = if (team != null) {
                    cachedStandings.filter { it.teamId == team }
                } else {
                    cachedStandings
                }
                
                // Entity를 DTO로 변환하여 반환
                return StandingsResponseDto(
                    response = listOf(
                        LeagueStandingDto(
                            league = com.hyunwoopark.futinfo.data.remote.dto.StandingLeagueInfoDto(
                                id = league,
                                name = "League $league",
                                country = "",
                                logo = "",
                                flag = null,
                                season = season,
                                standings = listOf(filteredStandings.map { it.toDto() })
                            )
                        )
                    )
                )
            }
            
            android.util.Log.d("FutInfo_Repository", "🌐 API에서 새로운 순위표 데이터 가져오기")
            
            // 2. API에서 새로운 데이터 가져오기
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] API 호출 시작 - footballApiService.getStandings")
            val response = try {
                footballApiService.getStandings(
                    league = league,
                    season = season,
                    team = team
                )
            } catch (e: Exception) {
                android.util.Log.e("FutInfo_Repository", "🔍 [DEBUG] API 호출 실패 - 원본 예외: ${e.javaClass.simpleName}: ${e.message}")
                android.util.Log.e("FutInfo_Repository", "🔍 [DEBUG] 스택 트레이스: ${e.stackTrace.take(5).joinToString("\n")}")
                throw e
            }
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] API 응답 수신 완료 - response.response.size: ${response.response.size}")
            
            // 3. 새로운 데이터를 캐시에 저장 (특정 팀 요청이 아닌 경우에만)
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] 응답 데이터 분석 시작")
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] team == null: ${team == null}")
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] response.response.isNotEmpty(): ${response.response.isNotEmpty()}")
            
            if (team == null && response.response.isNotEmpty()) {
                val leagueStanding = response.response.first()
                android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] leagueStanding.league.standings == null: ${leagueStanding.league.standings == null}")
                android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] leagueStanding.league.standings?.isEmpty(): ${leagueStanding.league.standings?.isEmpty()}")
                
                // 안전한 nullable 처리
                leagueStanding.league.standings?.let { standingsGroups ->
                    if (standingsGroups.isNotEmpty()) {
                        android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] standings 그룹 수: ${standingsGroups.size}")
                        
                        val firstGroup = standingsGroups.firstOrNull()
                        if (firstGroup != null && firstGroup.isNotEmpty()) {
                            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] 첫 번째 그룹 팀 수: ${firstGroup.size}")
                            
                            val standingEntities = firstGroup.map { standingDto ->
                                standingDto.toEntity(league, season)
                            }
                            
                            // 기존 데이터 삭제 후 새 데이터 삽입
                            standingDao.deleteStandingsByLeagueAndSeason(league, season)
                            standingDao.insertStandings(standingEntities)
                            android.util.Log.d("FutInfo_Repository", "💾 ${standingEntities.size}개 순위표 데이터 캐시에 저장")
                        } else {
                            android.util.Log.w("FutInfo_Repository", "⚠️ [DEBUG] 첫 번째 standings 그룹이 비어있습니다")
                        }
                    } else {
                        android.util.Log.w("FutInfo_Repository", "⚠️ [DEBUG] standings 그룹이 비어있습니다")
                    }
                } ?: run {
                    android.util.Log.w("FutInfo_Repository", "⚠️ [DEBUG] standings가 null입니다 - 컵 대회일 가능성")
                }
            }
            
            return response
            
        } catch (e: Exception) {
            android.util.Log.e("FutInfo_Repository", "❌ API 호출 실패: ${e.message}")
            
            // API 실패 시 캐시된 데이터라도 반환
            val cachedStandings = standingDao.getStandingsOnce(league, season)
            if (cachedStandings.isNotEmpty()) {
                android.util.Log.w("FutInfo_Repository", "⚠️ API 실패, 오래된 캐시 데이터 사용 (${cachedStandings.size}개)")
                
                val filteredStandings = if (team != null) {
                    cachedStandings.filter { it.teamId == team }
                } else {
                    cachedStandings
                }
                
                return StandingsResponseDto(
                    response = listOf(
                        LeagueStandingDto(
                            league = com.hyunwoopark.futinfo.data.remote.dto.StandingLeagueInfoDto(
                                id = league,
                                name = "League $league",
                                country = "",
                                logo = "",
                                flag = null,
                                season = season,
                                standings = if (filteredStandings.isNotEmpty()) {
                                    listOf(filteredStandings.map { it.toDto() })
                                } else {
                                    null // 캐시된 데이터가 없으면 null 반환
                                }
                            )
                        )
                    )
                )
            }
            
            throw e
        }
    }
    
    /**
     * 리그별 선수 통계를 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     * @param page 페이지 번호 (선택사항)
     *
     * @return 선수 통계 응답
     */
    override suspend fun getPlayersByLeague(
        league: Int,
        season: Int,
        page: Int?
    ): PlayersResponseDto {
        return footballApiService.getPlayersByLeague(
            league = league,
            season = season,
            page = page
        )
    }
    
    /**
     * 리그 득점왕을 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     *
     * @return 득점왕 응답
     */
    override suspend fun getTopScorers(
        league: Int,
        season: Int
    ): PlayersResponseDto {
        android.util.Log.d("FootballRepository", "🔍 득점왕 API 호출 - league: $league, season: $season")
        try {
            val response = footballApiService.getTopScorers(
                league = league,
                season = season
            )
            android.util.Log.d("FootballRepository", "✅ 득점왕 API 응답 성공 - results: ${response.results}")
            return response
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "❌ 득점왕 API 호출 실패", e)
            throw e
        }
    }
    
    /**
     * 리그 도움왕을 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     *
     * @return 도움왕 응답
     */
    override suspend fun getTopAssists(
        league: Int,
        season: Int
    ): PlayersResponseDto {
        android.util.Log.d("FootballRepository", "🔍 도움왕 API 호출 - league: $league, season: $season")
        try {
            val response = footballApiService.getTopAssists(
                league = league,
                season = season
            )
            android.util.Log.d("FootballRepository", "✅ 도움왕 API 응답 성공 - results: ${response.results}")
            return response
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "❌ 도움왕 API 호출 실패", e)
            throw e
        }
    }
    
    /**
     * 축구 뉴스를 가져옵니다.
     * News API를 사용하여 실제 뉴스를 가져오거나, 실패 시 샘플 뉴스를 반환합니다.
     *
     * @param query 검색 쿼리 (선택사항, 기본값: "football")
     * @param maxResults 최대 결과 수 (선택사항, 기본값: 20)
     * @param startDate 시작 날짜 (YYYY-MM-DD 형식, 선택사항)
     * @param endDate 종료 날짜 (YYYY-MM-DD 형식, 선택사항)
     * @param category 카테고리 필터 (선택사항)
     *
     * @return 뉴스 기사 목록
     */
    override suspend fun getNews(
        query: String,
        maxResults: Int,
        startDate: String?,
        endDate: String?,
        category: String?
    ): List<NewsArticle> {
        return try {
            // News API URL 구성
            val newsApiUrl = buildNewsApiUrl(query, maxResults, startDate, endDate, category)
            
            // News API 호출
            val response = footballApiService.getNews(newsApiUrl)
            
            // DTO를 도메인 모델로 변환
            response.articles.take(maxResults).map { dto ->
                convertToNewsArticle(dto)
            }
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "뉴스 API 호출 실패: ${e.message}")
            // API 실패 시 샘플 뉴스 반환
            generateSampleNews().take(maxResults)
        }
    }
    
    /**
     * News API URL을 구성합니다.
     */
    private fun buildNewsApiUrl(
        query: String,
        maxResults: Int,
        startDate: String? = null,
        endDate: String? = null,
        category: String? = null
    ): String {
        val baseUrl = "https://newsapi.org/v2/everything"
        val apiKey = "YOUR_NEWS_API_KEY" // 실제 구현 시 BuildConfig나 환경변수에서 가져와야 함
        val params = mutableListOf<String>()
        
        // 축구 관련 검색 쿼리 구성
        val footballQuery = when {
            query.isNotBlank() && !category.isNullOrBlank() -> {
                "($query) AND ($category) AND (football OR soccer)"
            }
            query.isNotBlank() -> {
                "($query) AND (football OR soccer)"
            }
            !category.isNullOrBlank() -> {
                "($category) AND (football OR soccer)"
            }
            else -> {
                "(football OR soccer) AND (\"Premier League\" OR \"La Liga\" OR \"Serie A\" OR \"Bundesliga\" OR \"Ligue 1\" OR \"Champions League\" OR transfer OR goal)"
            }
        }
        
        params.add("q=${URLEncoder.encode(footballQuery, "UTF-8")}")
        params.add("language=en")
        params.add("sortBy=publishedAt")
        params.add("pageSize=$maxResults")
        
        // 날짜 필터 추가
        startDate?.let { params.add("from=$it") }
        endDate?.let { params.add("to=$it") }
        
        params.add("apiKey=$apiKey")
        
        return "$baseUrl?${params.joinToString("&")}"
    }
    
    /**
     * NewsArticleDto를 NewsArticle 도메인 모델로 변환합니다.
     */
    private fun convertToNewsArticle(dto: NewsArticleDto): NewsArticle {
        val publishedAt = try {
            LocalDateTime.parse(dto.publishedAt, DateTimeFormatter.ISO_DATE_TIME)
        } catch (e: Exception) {
            LocalDateTime.now()
        }
        
        return NewsArticle(
            id = UUID.randomUUID().toString(),
            title = dto.title,
            source = dto.source.name,
            url = dto.url,
            publishedAt = publishedAt,
            summary = dto.description ?: "요약이 없습니다.",
            credibility = determineCredibility(dto.source.name),
            importance = determineImportance(dto.title),
            category = determineCategory(dto.title, dto.description),
            interestLevel = determineInterestLevel(dto.title, dto.description),
            imageUrl = dto.urlToImage,
            tags = extractTags(dto.title, dto.description)
        )
    }
    
    /**
     * 소스 이름을 기반으로 신뢰도를 결정합니다.
     */
    private fun determineCredibility(sourceName: String): NewsCredibility {
        return when {
            sourceName.contains("BBC", ignoreCase = true) ||
            sourceName.contains("ESPN", ignoreCase = true) ||
            sourceName.contains("Sky Sports", ignoreCase = true) -> NewsCredibility.HIGH
            sourceName.contains("Goal", ignoreCase = true) ||
            sourceName.contains("Guardian", ignoreCase = true) -> NewsCredibility.MEDIUM
            else -> NewsCredibility.MEDIUM
        }
    }
    
    /**
     * 제목을 기반으로 중요도를 결정합니다.
     */
    private fun determineImportance(title: String): NewsImportance {
        val titleLower = title.lowercase()
        return when {
            titleLower.contains("confirmed") ||
            titleLower.contains("official") ||
            titleLower.contains("breaking") -> NewsImportance.BREAKING
            titleLower.contains("rumour") ||
            titleLower.contains("rumor") ||
            titleLower.contains("linked") -> NewsImportance.NORMAL
            else -> NewsImportance.IMPORTANT
        }
    }
    
    /**
     * 제목과 설명을 기반으로 카테고리를 결정합니다.
     */
    private fun determineCategory(title: String, description: String?): NewsCategory {
        val content = "$title ${description ?: ""}".lowercase()
        return when {
            content.contains("transfer") ||
            content.contains("signing") ||
            content.contains("joins") -> NewsCategory.TRANSFER
            content.contains("match") ||
            content.contains("goal") ||
            content.contains("score") -> NewsCategory.MATCH
            content.contains("injury") ||
            content.contains("injured") -> NewsCategory.INJURY
            content.contains("international") ||
            content.contains("national") -> NewsCategory.INTERNATIONAL
            else -> NewsCategory.GENERAL
        }
    }
    
    /**
     * 제목과 설명을 기반으로 관심도를 결정합니다.
     */
    private fun determineInterestLevel(title: String, description: String?): NewsInterestLevel {
        val content = "$title ${description ?: ""}".lowercase()
        
        // 매우 높은 관심도
        val veryHighKeywords = listOf(
            "mbappe", "haaland", "champions league", "final", "world cup"
        )
        
        // 높은 관심도
        val highKeywords = listOf(
            "premier league", "la liga", "serie a", "bundesliga", "ligue 1",
            "manchester city", "real madrid", "barcelona", "bayern munich"
        )
        
        return when {
            veryHighKeywords.any { content.contains(it) } -> NewsInterestLevel.VERY_HIGH
            highKeywords.any { content.contains(it) } -> NewsInterestLevel.HIGH
            content.contains("football") || content.contains("soccer") -> NewsInterestLevel.MEDIUM
            else -> NewsInterestLevel.LOW
        }
    }
    
    /**
     * 제목과 설명에서 태그를 추출합니다.
     */
    private fun extractTags(title: String, description: String?): List<String> {
        val content = "$title ${description ?: ""}".lowercase()
        val tags = mutableListOf<String>()
        
        // 팀 이름 태그
        val teams = listOf(
            "arsenal", "manchester united", "manchester city", "liverpool", "chelsea",
            "real madrid", "barcelona", "bayern munich", "psg"
        )
        
        teams.forEach { team ->
            if (content.contains(team)) {
                tags.add(team.split(" ").joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } })
            }
        }
        
        // 리그 태그
        if (content.contains("premier league")) tags.add("Premier League")
        if (content.contains("la liga")) tags.add("La Liga")
        if (content.contains("serie a")) tags.add("Serie A")
        if (content.contains("bundesliga")) tags.add("Bundesliga")
        if (content.contains("ligue 1")) tags.add("Ligue 1")
        if (content.contains("champions league")) tags.add("Champions League")
        
        return tags.distinct()
    }
    
    /**
     * 샘플 뉴스를 생성합니다 (API 실패 시 사용).
     */
    private fun generateSampleNews(): List<NewsArticle> {
        val currentTime = LocalDateTime.now()
        
        return listOf(
            NewsArticle(
                id = UUID.randomUUID().toString(),
                title = "Manchester City complete signing of top midfielder",
                source = "BBC Sport",
                url = "https://www.bbc.com/sport/football",
                publishedAt = currentTime.minusHours(1),
                summary = "Manchester City have completed the signing of a world-class midfielder in a deal worth £80 million.",
                credibility = NewsCredibility.HIGH,
                importance = NewsImportance.BREAKING,
                category = NewsCategory.TRANSFER,
                interestLevel = NewsInterestLevel.VERY_HIGH,
                imageUrl = null,
                tags = listOf("Manchester City", "Premier League", "Transfer")
            ),
            NewsArticle(
                id = UUID.randomUUID().toString(),
                title = "Real Madrid announce new galactico signing",
                source = "Marca",
                url = "https://www.marca.com/en/football/",
                publishedAt = currentTime.minusHours(2),
                summary = "Real Madrid have announced the signing of a world-class player in a deal that could reach €120 million.",
                credibility = NewsCredibility.HIGH,
                importance = NewsImportance.BREAKING,
                category = NewsCategory.TRANSFER,
                interestLevel = NewsInterestLevel.VERY_HIGH,
                imageUrl = null,
                tags = listOf("Real Madrid", "La Liga", "Transfer")
            ),
            NewsArticle(
                id = UUID.randomUUID().toString(),
                title = "Champions League final set for epic showdown",
                source = "UEFA.com",
                url = "https://www.uefa.com/",
                publishedAt = currentTime.minusHours(3),
                summary = "The Champions League final promises to be an epic encounter between two of Europe's finest teams.",
                credibility = NewsCredibility.HIGH,
                importance = NewsImportance.BREAKING,
                category = NewsCategory.MATCH,
                interestLevel = NewsInterestLevel.VERY_HIGH,
                imageUrl = null,
                tags = listOf("Champions League", "Final", "UEFA")
            ),
            NewsArticle(
                id = UUID.randomUUID().toString(),
                title = "Liverpool target new striker ahead of new season",
                source = "ESPN",
                url = "https://www.espn.com/soccer/",
                publishedAt = currentTime.minusHours(4),
                summary = "Liverpool are actively pursuing a new striker to strengthen their attacking options for the upcoming season.",
                credibility = NewsCredibility.MEDIUM,
                importance = NewsImportance.IMPORTANT,
                category = NewsCategory.TRANSFER,
                interestLevel = NewsInterestLevel.HIGH,
                imageUrl = null,
                tags = listOf("Liverpool", "Premier League", "Transfer")
            ),
            NewsArticle(
                id = UUID.randomUUID().toString(),
                title = "Barcelona prepare for El Clasico showdown",
                source = "Sport",
                url = "https://www.sport.es/en/",
                publishedAt = currentTime.minusHours(5),
                summary = "Barcelona are making final preparations for the highly anticipated El Clasico against Real Madrid.",
                credibility = NewsCredibility.MEDIUM,
                importance = NewsImportance.IMPORTANT,
                category = NewsCategory.MATCH,
                interestLevel = NewsInterestLevel.VERY_HIGH,
                imageUrl = null,
                tags = listOf("Barcelona", "La Liga", "El Clasico")
            )
        )
    }
    
    /**
     * 선수 프로필 정보를 가져옵니다.
     *
     * @param id 선수 ID (필수)
     * @param season 시즌 (선택사항)
     * @param team 팀 ID (선택사항)
     *
     * @return 선수 프로필
     */
    override suspend fun getPlayerProfile(
        id: Int,
        season: Int?,
        team: Int?
    ): PlayerProfile {
        println("FootballRepositoryImpl - getPlayerProfile called: id=$id, season=$season, team=$team")
        
        try {
            val response = footballApiService.getPlayerProfile(
                id = id,
                season = 2024,  // API에서 season이 필수이므로 2024로 설정
                team = team
            )
            
            println("FootballRepositoryImpl - API response received: ${response.response.size} players")
            
            // API 응답에서 첫 번째 선수 프로필을 가져옴
            val playerProfileDto = response.response.firstOrNull()
                ?: throw Exception("선수 정보를 찾을 수 없습니다. ID: $id")
            
            println("FootballRepositoryImpl - Converting player: ${playerProfileDto.player?.name}")
            return convertToPlayerProfile(playerProfileDto)
        } catch (e: Exception) {
            println("FootballRepositoryImpl - Error getting player profile: ${e.message}")
            throw e
        }
    }
    
    /**
     * PlayerProfileDto를 PlayerProfile 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerProfile(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerProfileDto): PlayerProfile {
        return PlayerProfile(
            player = convertToPlayerInfo(dto.player),
            statistics = dto.statistics?.map { convertToPlayerSeasonStats(it) } ?: emptyList()
        )
    }
    
    /**
     * PlayerInfoDto를 PlayerInfo 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerInfo(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerInfoDto): PlayerInfo {
        return PlayerInfo(
            id = dto.id ?: 0,
            name = dto.name ?: "",
            firstname = dto.firstname,
            lastname = dto.lastname,
            age = dto.age,
            nationality = dto.nationality,
            height = dto.height,
            weight = dto.weight,
            photo = dto.photo,
            injured = dto.injured ?: false,
            birth = dto.birth?.let { convertToPlayerBirth(it) }
        )
    }
    
    /**
     * PlayerBirthDto를 PlayerBirth 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerBirth(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerBirthDto): PlayerBirth {
        return PlayerBirth(
            date = dto.date,
            place = dto.place,
            country = dto.country
        )
    }
    
    /**
     * PlayerSeasonStatsDto를 PlayerSeasonStats 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerSeasonStats(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerSeasonStatsDto): PlayerSeasonStats {
        return PlayerSeasonStats(
            team = dto.team?.let { convertToTeam(it) },
            league = dto.league?.let { convertToPlayerLeagueInfo(it) },
            games = dto.games?.let { convertToPlayerGameStats(it) },
            substitutes = dto.substitutes?.let { convertToPlayerSubstitutes(it) },
            shots = dto.shots?.let { convertToPlayerShots(it) },
            goals = dto.goals?.let { convertToPlayerGoals(it) },
            passes = dto.passes?.let { convertToPlayerPasses(it) },
            tackles = dto.tackles?.let { convertToPlayerTackles(it) },
            duels = dto.duels?.let { convertToPlayerDuels(it) },
            dribbles = dto.dribbles?.let { convertToPlayerDribbles(it) },
            fouls = dto.fouls?.let { convertToPlayerFouls(it) },
            cards = dto.cards?.let { convertToPlayerCards(it) },
            penalty = dto.penalty?.let { convertToPlayerPenalty(it) }
        )
    }
    
    /**
     * TeamDto를 Team 도메인 모델로 변환합니다.
     */
    private fun convertToTeam(dto: com.hyunwoopark.futinfo.data.remote.dto.TeamDto): Team {
        return Team(
            id = dto.id,
            name = dto.name,
            code = null, // TeamDto에 code 속성이 없음
            country = null, // TeamDto에 country 속성이 없음
            founded = null, // TeamDto에 founded 속성이 없음
            national = null, // TeamDto에 national 속성이 없음
            logo = dto.logo
        )
    }
    
    /**
     * PlayerLeagueInfoDto를 PlayerLeagueInfo 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerLeagueInfo(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerLeagueInfoDto): PlayerLeagueInfo {
        return PlayerLeagueInfo(
            id = dto.id ?: 0,
            name = dto.name ?: "",
            country = dto.country,
            logo = dto.logo,
            season = dto.season ?: 0,
            flag = dto.flag
        )
    }
    
    /**
     * PlayerGameStatsDto를 PlayerGameStats 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerGameStats(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerGameStatsDto): PlayerGameStats {
        return PlayerGameStats(
            minutes = dto.minutes ?: 0,
            number = dto.number,
            position = dto.position,
            rating = dto.rating,
            captain = dto.captain ?: false,
            substitute = false, // DTO에 없는 필드이므로 기본값
            appearances = dto.appearances ?: 0,
            lineups = dto.lineups ?: 0
        )
    }
    
    /**
     * PlayerSubstitutesDto를 PlayerSubstitutes 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerSubstitutes(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerSubstitutesDto): PlayerSubstitutes {
        return PlayerSubstitutes(
            `in` = dto.`in` ?: 0,
            out = dto.out ?: 0,
            bench = dto.bench ?: 0
        )
    }
    
    /**
     * PlayerShotsDto를 PlayerShots 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerShots(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerShotsDto): PlayerShots {
        return PlayerShots(
            total = dto.total ?: 0,
            on = dto.on ?: 0
        )
    }
    
    /**
     * PlayerGoalsDto를 PlayerGoals 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerGoals(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerGoalsDto): PlayerGoals {
        return PlayerGoals(
            total = dto.total ?: 0,
            conceded = dto.conceded ?: 0,
            assists = dto.assists ?: 0,
            saves = dto.saves ?: 0
        )
    }
    
    /**
     * ProfilePlayerGoalsDto를 PlayerGoals 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerGoals(dto: com.hyunwoopark.futinfo.data.remote.dto.ProfilePlayerGoalsDto): PlayerGoals {
        return PlayerGoals(
            total = dto.total ?: 0,
            conceded = dto.conceded ?: 0,
            assists = dto.assists ?: 0,
            saves = dto.saves ?: 0
        )
    }
    
    /**
     * PlayerPassesDto를 PlayerPasses 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerPasses(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerPassesDto): PlayerPasses {
        return PlayerPasses(
            total = dto.total ?: 0,
            key = dto.key ?: 0,
            accuracy = dto.accuracy?.let { "$it%" } ?: "0%"
        )
    }
    
    /**
     * PlayerTacklesDto를 PlayerTackles 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerTackles(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerTacklesDto): PlayerTackles {
        return PlayerTackles(
            total = dto.total ?: 0,
            blocks = dto.blocks ?: 0,
            interceptions = dto.interceptions ?: 0
        )
    }
    
    /**
     * PlayerDuelsDto를 PlayerDuels 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerDuels(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerDuelsDto): PlayerDuels {
        return PlayerDuels(
            total = dto.total ?: 0,
            won = dto.won ?: 0
        )
    }
    
    /**
     * PlayerDribblesDto를 PlayerDribbles 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerDribbles(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerDribblesDto): PlayerDribbles {
        return PlayerDribbles(
            attempts = dto.attempts ?: 0,
            success = dto.success ?: 0,
            past = dto.past ?: 0
        )
    }
    
    /**
     * PlayerFoulsDto를 PlayerFouls 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerFouls(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerFoulsDto): PlayerFouls {
        return PlayerFouls(
            drawn = dto.drawn ?: 0,
            committed = dto.committed ?: 0
        )
    }
    
    /**
     * PlayerCardsDto를 PlayerCards 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerCards(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerCardsDto): PlayerCards {
        return PlayerCards(
            yellow = dto.yellow ?: 0,
            yellowred = dto.yellowred ?: 0,
            red = dto.red ?: 0
        )
    }
    
    /**
     * PlayerPenaltyDto를 PlayerPenalty 도메인 모델로 변환합니다.
     */
    private fun convertToPlayerPenalty(dto: com.hyunwoopark.futinfo.data.remote.dto.PlayerPenaltyDto): PlayerPenalty {
        return PlayerPenalty(
            won = dto.won ?: 0,
            committed = dto.committed ?: 0,
            scored = dto.scored ?: 0,
            missed = dto.missed ?: 0,
            saved = dto.saved ?: 0
        )
    }
    
    /**
     * 이적 정보를 가져옵니다.
     *
     * @param player 선수 ID (선택사항)
     * @param team 팀 ID (선택사항)
     * @param season 시즌 (선택사항)
     *
     * @return 이적 정보 응답
     */
    override suspend fun getTransfers(
        player: Int?,
        team: Int?,
        season: Int?
    ): TransferResponseDto {
        return footballApiService.getTransfers(
            player = player,
            team = team,
            season = season
        )
    }
    
    /**
     * 최신 이적 정보를 가져옵니다. (도메인 모델로 변환)
     * 현재는 샘플 데이터를 반환하며, 실제 구현에서는 외부 API나 웹 스크래핑을 통해 데이터를 수집합니다.
     *
     * @return 이적 정보 목록
     */
    override suspend fun getLatestTransfers(): List<Transfer> {
        return try {
            // 실제 구현에서는 외부 API 호출이나 웹 스크래핑을 수행
            // 현재는 iOS의 RealTransferDataService를 참고한 샘플 데이터 반환
            generateSampleTransfers()
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "이적 정보 가져오기 실패: ${e.message}")
            // 실패 시 빈 리스트 반환
            emptyList()
        }
    }
    
    /**
     * 샘플 이적 데이터를 생성합니다.
     * iOS의 RealTransferDataService.generateRecentRealTransfers()를 참고하여 구현
     */
    private fun generateSampleTransfers(): List<Transfer> {
        val currentTime = LocalDateTime.now()
        
        return listOf(
            // 🔥 2025년 1월 겨울 이적시장 실제 완료된 이적들
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Jhon Duran",
                fromClub = "Aston Villa",
                toClub = "Al Nassr",
                transferFee = "€77 million",
                transferDate = currentTime.minusDays(1),
                contractLength = "5.5 years",
                source = "Aston Villa Official",
                reliability = 95,
                status = TransferStatus.COMPLETED,
                league = "Saudi Pro League",
                position = "Forward",
                age = 21,
                nationality = "Colombian"
            ),
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Galeno",
                fromClub = "FC Porto",
                toClub = "Al-Ahli",
                transferFee = "€50 million",
                transferDate = currentTime.minusDays(2),
                contractLength = "Long term",
                source = "FC Porto Official",
                reliability = 95,
                status = TransferStatus.COMPLETED,
                league = "Saudi Pro League",
                position = "Winger",
                age = 27,
                nationality = "Brazilian"
            ),
            
            // 🔄 현재 진행 중인 2025년 겨울 이적들
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Kaoru Mitoma",
                fromClub = "Brighton",
                toClub = "Al Nassr",
                transferFee = "€45 million",
                transferDate = currentTime.minusHours(1),
                contractLength = "4 years",
                source = "The Athletic",
                reliability = 85,
                status = TransferStatus.IN_PROGRESS,
                league = "Saudi Pro League",
                position = "Winger",
                age = 27,
                nationality = "Japanese"
            ),
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Victor Boniface",
                fromClub = "Bayer Leverkusen",
                toClub = "Al Nassr",
                transferFee = "€60 million",
                transferDate = currentTime.minusHours(2),
                contractLength = "5 years",
                source = "Sky Sports",
                reliability = 80,
                status = TransferStatus.NEGOTIATING,
                league = "Saudi Pro League",
                position = "Forward",
                age = 24,
                nationality = "Nigerian"
            ),
            
            // 📰 최신 2025년 겨울 이적 루머들
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Marcus Rashford",
                fromClub = "Manchester United",
                toClub = "AC Milan",
                transferFee = "Loan + €30m option",
                transferDate = currentTime.minusHours(3),
                contractLength = "Loan until June",
                source = "Fabrizio Romano",
                reliability = 85,
                status = TransferStatus.RUMOR,
                league = "Serie A",
                position = "Forward",
                age = 27,
                nationality = "English"
            ),
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Alejandro Garnacho",
                fromClub = "Manchester United",
                toClub = "Napoli",
                transferFee = "€50 million",
                transferDate = currentTime.minusHours(4),
                contractLength = "5 years",
                source = "Goal.com",
                reliability = 75,
                status = TransferStatus.INTERESTED,
                league = "Serie A",
                position = "Winger",
                age = 20,
                nationality = "Argentine"
            ),
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Evan Ferguson",
                fromClub = "Brighton",
                toClub = "West Ham United",
                transferFee = "€35 million",
                transferDate = currentTime.minusHours(5),
                contractLength = "4 years",
                source = "BBC Sport",
                reliability = 70,
                status = TransferStatus.INTERESTED,
                league = "Premier League",
                position = "Forward",
                age = 20,
                nationality = "Irish"
            ),
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Mathys Tel",
                fromClub = "Bayern Munich",
                toClub = "Brentford",
                transferFee = "Loan",
                transferDate = currentTime.minusHours(6),
                contractLength = "Loan until June",
                source = "Sky Sports",
                reliability = 80,
                status = TransferStatus.IN_PROGRESS,
                league = "Premier League",
                position = "Forward",
                age = 19,
                nationality = "French"
            ),
            
            // 🌟 여름 이적시장 대형 루머들
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Kylian Mbappé",
                fromClub = "Real Madrid",
                toClub = "Liverpool",
                transferFee = "€200 million",
                transferDate = currentTime.plusMonths(6),
                contractLength = "5 years",
                source = "Spanish Media",
                reliability = 60,
                status = TransferStatus.RUMOR,
                league = "Premier League",
                position = "Forward",
                age = 26,
                nationality = "French"
            ),
            Transfer(
                id = UUID.randomUUID().toString(),
                playerName = "Erling Haaland",
                fromClub = "Manchester City",
                toClub = "Real Madrid",
                transferFee = "€180 million",
                transferDate = currentTime.plusYears(1),
                contractLength = "6 years",
                source = "Marca",
                reliability = 65,
                status = TransferStatus.RUMOR,
                league = "La Liga",
                position = "Forward",
                age = 24,
                nationality = "Norwegian"
            )
        )
    }
    
    /**
     * 커뮤니티 게시글 목록을 가져옵니다.
     *
     * @param category 카테고리별 필터링 (선택사항)
     * @param limit 가져올 게시글 수 (기본값: 20)
     * @return 게시글 목록
     */
    override suspend fun getPosts(
        category: String?,
        limit: Int
    ): List<Post> {
        return getPostsByBoard("all", category, limit, 0)
    }
    
    override suspend fun getBoards(): List<Board> {
        return try {
            val response = supabaseClient.from("boards")
                .select()
                .decodeList<com.hyunwoopark.futinfo.data.remote.dto.BoardDto>()
            
            response.map { boardDto ->
                boardDto.toBoard()
            }
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to get boards: ${e.message}")
            emptyList()
        }
    }
    
    override suspend fun getBoard(boardId: String): Board? {
        return try {
            val response = supabaseClient.from("boards")
                .select() {
                    filter {
                        eq("id", boardId)
                    }
                }
                .decodeSingleOrNull<com.hyunwoopark.futinfo.data.remote.dto.BoardDto>()
            
            response?.toBoard()
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to get board: ${e.message}")
            null
        }
    }
    
    override suspend fun getPostsByBoard(
        boardId: String,
        category: String?,
        limit: Int,
        offset: Int
    ): List<Post> {
        return try {
            val response = if (boardId == "all") {
                // 전체 게시판의 경우 모든 게시글 가져오기
                supabaseClient.from("posts")
                    .select(columns = Columns.raw("*, author:profiles!posts_author_id_fkey(*)")) {
                        filter {
                            eq("is_deleted", false)
                            category?.let { eq("category", it) }
                        }
                        order("is_pinned", order = Order.DESCENDING)
                        order("created_at", order = Order.DESCENDING)
                        limit(limit.toLong())
                        range(offset.toLong(), (offset + limit - 1).toLong())
                    }
                    .decodeList<com.hyunwoopark.futinfo.data.remote.dto.PostDto>()
            } else {
                // 특정 게시판의 게시글만 가져오기
                supabaseClient.from("posts")
                    .select(columns = Columns.raw("*, author:profiles!posts_author_id_fkey(*)")) {
                        filter {
                            eq("board_id", boardId)
                            eq("is_deleted", false)
                            category?.let { eq("category", it) }
                        }
                        order("is_pinned", order = Order.DESCENDING)
                        order("created_at", order = Order.DESCENDING)
                        limit(limit.toLong())
                        range(offset.toLong(), (offset + limit - 1).toLong())
                    }
                    .decodeList<com.hyunwoopark.futinfo.data.remote.dto.PostDto>()
            }
            
            // 현재 사용자가 로그인한 경우, 좋아요 상태 확인
            val currentUserId = supabaseClient.auth.currentUserOrNull()?.id
            val postsWithLikeStatus = if (currentUserId != null) {
                val postIds = response.map { it.id }
                if (postIds.isNotEmpty()) {
                    val likes = supabaseClient.from("likes")
                        .select() {
                            filter {
                                eq("user_id", currentUserId)
                                isIn("post_id", postIds)
                            }
                        }
                        .decodeList<LikeDto>()
                    
                    val likedPostIds = likes.map { it.postId }.toSet()
                    response.map { post ->
                        post.toPost(
                            isLiked = likedPostIds.contains(post.id),
                            timeAgo = getRelativeTimeString(java.time.Instant.parse(post.createdAt ?: "1970-01-01T00:00:00Z"))
                        )
                    }
                } else {
                    response.map { it.toPost(timeAgo = getRelativeTimeString(java.time.Instant.parse(it.createdAt ?: "1970-01-01T00:00:00Z"))) }
                }
            } else {
                response.map { it.toPost(timeAgo = getRelativeTimeString(java.time.Instant.parse(it.createdAt ?: "1970-01-01T00:00:00Z"))) }
            }
            
            postsWithLikeStatus
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to get posts by board: ${e.message}")
            emptyList()
        }
    }
    
    override suspend fun getPost(postId: String): Post? {
        return try {
            val response = supabaseClient.from("posts")
                .select(columns = Columns.raw("*, author:profiles!posts_author_id_fkey(*)")) {
                    filter {
                        eq("id", postId)
                        eq("is_deleted", false)
                    }
                }
                .decodeSingleOrNull<com.hyunwoopark.futinfo.data.remote.dto.PostDto>()
            
            if (response != null) {
                // 현재 사용자가 로그인한 경우, 좋아요 상태 확인
                val currentUserId = supabaseClient.auth.currentUserOrNull()?.id
                val isLiked = if (currentUserId != null) {
                    val like = supabaseClient.from("likes")
                        .select() {
                            filter {
                                eq("user_id", currentUserId)
                                eq("post_id", postId)
                            }
                        }
                        .decodeSingleOrNull<LikeDto>()
                    like != null
                } else {
                    false
                }
                
                response.toPost(
                    isLiked = isLiked,
                    timeAgo = getRelativeTimeString(java.time.Instant.parse(response.createdAt ?: "1970-01-01T00:00:00Z"))
                )
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to get post: ${e.message}")
            null
        }
    }
    
    override suspend fun createPost(
        boardId: String,
        title: String,
        content: String,
        category: String,
        tags: List<String>,
        imageUrls: List<String>
    ): String {
        return try {
            val postId = UUID.randomUUID().toString()
            val currentUserId = supabaseClient.auth.currentUserOrNull()?.id
                ?: throw Exception("User not authenticated")
            
            val profile = getCurrentUserProfile()
                ?: throw Exception("User profile not found")
            
            val postData = mapOf(
                "id" to postId,
                "board_id" to boardId,
                "title" to title,
                "content" to content,
                "author_id" to profile.id,
                "category" to category,
                "tags" to tags,
                "image_urls" to imageUrls
            )
            
            supabaseClient.from("posts")
                .insert(postData)
            
            postId
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to create post: ${e.message}")
            throw e
        }
    }
    
    override suspend fun updatePost(
        postId: String,
        title: String,
        content: String,
        category: String,
        tags: List<String>,
        imageUrls: List<String>
    ): Boolean {
        return try {
            val updateData = mapOf(
                "title" to title,
                "content" to content,
                "category" to category,
                "tags" to tags,
                "image_urls" to imageUrls,
                "updated_at" to LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            )
            
            supabaseClient.from("posts")
                .update(updateData) {
                    filter {
                        eq("id", postId)
                    }
                }
            
            true
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to update post: ${e.message}")
            false
        }
    }
    
    override suspend fun deletePost(postId: String): Boolean {
        return try {
            supabaseClient.from("posts")
                .update(mapOf("is_deleted" to true)) {
                    filter {
                        eq("id", postId)
                    }
                }
            
            true
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to delete post: ${e.message}")
            false
        }
    }
    
    override suspend fun incrementPostView(postId: String): Boolean {
        return try {
            supabaseClient.postgrest.rpc("increment_post_view", mapOf("post_id" to postId))
            true
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to increment post view: ${e.message}")
            false
        }
    }
    
    override suspend fun getComments(postId: String): List<com.hyunwoopark.futinfo.domain.model.Comment> {
        return try {
            val response = supabaseClient.from("comments")
                .select() {
                    filter {
                        eq("post_id", postId)
                        eq("is_deleted", false)
                    }
                    order("created_at", Order.ASCENDING)
                }
                .decodeList<com.hyunwoopark.futinfo.data.remote.dto.CommentDto>()
            
            // 댓글을 계층구조로 구성
            val commentMap = response.associateBy { it.id }
            val rootComments = mutableListOf<com.hyunwoopark.futinfo.domain.model.Comment>()
            
            response.forEach { dto ->
                val comment = dto.toComment()
                if (dto.parentId == null) {
                    rootComments.add(comment)
                } else {
                    // 부모 댓글 찾기
                    val parentComment = commentMap[dto.parentId]
                    if (parentComment != null) {
                        // 대댓글 추가 로직 구현 필요
                    }
                }
            }
            
            rootComments
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to get comments: ${e.message}")
            emptyList()
        }
    }
    
    override suspend fun createComment(
        postId: String,
        content: String,
        parentId: String?
    ): String {
        return try {
            val commentId = UUID.randomUUID().toString()
            val profile = getCurrentUserProfile()
                ?: throw Exception("User profile not found")
            
            val commentData = mapOf(
                "id" to commentId,
                "post_id" to postId,
                "author_id" to profile.id,
                "content" to content,
                "parent_id" to parentId
            )
            
            supabaseClient.from("comments")
                .insert(commentData)
            
            commentId
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to create comment: ${e.message}")
            throw e
        }
    }
    
    override suspend fun deleteComment(commentId: String): Boolean {
        return try {
            supabaseClient.from("comments")
                .update(mapOf("is_deleted" to true)) {
                    filter {
                        eq("id", commentId)
                    }
                }
            
            true
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to delete comment: ${e.message}")
            false
        }
    }
    
    override suspend fun togglePostLike(postId: String, isLiked: Boolean): Boolean {
        return try {
            val userId = supabaseClient.auth.currentUserOrNull()?.id
                ?: throw Exception("User not authenticated")
            
            if (isLiked) {
                // 좋아요 추가
                supabaseClient.from("likes")
                    .insert(mapOf(
                        "user_id" to userId,
                        "post_id" to postId
                    ))
            } else {
                // 좋아요 제거
                supabaseClient.from("likes")
                    .delete {
                        filter {
                            eq("user_id", userId)
                            eq("post_id", postId)
                        }
                    }
            }
            
            true
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to toggle post like: ${e.message}")
            false
        }
    }
    
    override suspend fun toggleCommentLike(commentId: String, isLiked: Boolean): Boolean {
        return try {
            val userId = supabaseClient.auth.currentUserOrNull()?.id
                ?: throw Exception("User not authenticated")
            
            if (isLiked) {
                // 좋아요 추가
                supabaseClient.from("likes")
                    .insert(mapOf(
                        "user_id" to userId,
                        "comment_id" to commentId
                    ))
            } else {
                // 좋아요 제거
                supabaseClient.from("likes")
                    .delete {
                        filter {
                            eq("user_id", userId)
                            eq("comment_id", commentId)
                        }
                    }
            }
            
            true
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to toggle comment like: ${e.message}")
            false
        }
    }
    
    override suspend fun getCurrentUserProfile(): com.hyunwoopark.futinfo.domain.model.UserProfile? {
        return try {
            val userId = supabaseClient.auth.currentUserOrNull()?.id
                ?: return null
            
            val response = supabaseClient.from("profiles")
                .select() {
                    filter {
                        eq("user_id", userId)
                    }
                }
                .decodeSingleOrNull<com.hyunwoopark.futinfo.data.remote.dto.UserProfileDto>()
            
            response?.toUserProfile()
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to get user profile: ${e.message}")
            null
        }
    }
    
    override suspend fun updateUserProfile(
        nickname: String,
        favoriteTeamId: Int?,
        favoriteTeamName: String?,
        avatarUrl: String?
    ): Boolean {
        return try {
            val userId = supabaseClient.auth.currentUserOrNull()?.id
                ?: throw Exception("User not authenticated")
            
            val updateData = mutableMapOf<String, Any>("nickname" to nickname)
            favoriteTeamId?.let { updateData["favorite_team_id"] = it }
            favoriteTeamName?.let { updateData["favorite_team_name"] = it }
            avatarUrl?.let { updateData["avatar_url"] = it }
            
            supabaseClient.from("profiles")
                .update(updateData) {
                    filter {
                        eq("user_id", userId)
                    }
                }
            
            true
        } catch (e: Exception) {
            android.util.Log.e("FootballRepository", "Failed to update user profile: ${e.message}")
            false
        }
    }
    
    private fun getRelativeTimeString(instant: java.time.Instant): String {
        val now = java.time.Instant.now()
        val duration = java.time.Duration.between(instant, now)
        
        return when {
            duration.toMinutes() < 1 -> "방금 전"
            duration.toMinutes() < 60 -> "${duration.toMinutes()}분 전"
            duration.toHours() < 24 -> "${duration.toHours()}시간 전"
            duration.toDays() < 7 -> "${duration.toDays()}일 전"
            duration.toDays() < 30 -> "${duration.toDays() / 7}주 전"
            duration.toDays() < 365 -> "${duration.toDays() / 30}개월 전"
            else -> "${duration.toDays() / 365}년 전"
        }
    }
    
    
    /**
     * 상대적 시간을 계산합니다.
     */
    private fun calculateTimeAgo(date: java.util.Date): String {
        val now = java.util.Date()
        val diffInMillis = now.time - date.time
        val diffInMinutes = diffInMillis / (1000 * 60)
        val diffInHours = diffInMinutes / 60
        val diffInDays = diffInHours / 24
        
        return when {
            diffInMinutes < 1 -> "방금 전"
            diffInMinutes < 60 -> "${diffInMinutes}분 전"
            diffInHours < 24 -> "${diffInHours}시간 전"
            diffInDays < 7 -> "${diffInDays}일 전"
            diffInDays < 30 -> "${diffInDays / 7}주 전"
            else -> "${diffInDays / 30}개월 전"
        }
    }
    
    /**
     * 샘플 게시글 데이터를 생성합니다 (Firestore 실패 시 사용).
     */
    private fun generateSamplePosts(): List<Post> {
        val currentTime = java.time.Instant.now()
        
        return listOf(
            Post(
                id = "1",
                boardId = "board1",
                title = "맨시티 vs 리버풀 경기 어떻게 보셨나요?",
                content = "오늘 경기 정말 명경기였네요! 특히 홀란드의 골이 인상적이었습니다.",
                authorId = "user1",
                author = UserProfile(
                    id = "user1",
                    userId = "user1",
                    nickname = "축구팬123",
                    avatarUrl = null,
                    favoriteTeamId = null,
                    favoriteTeamName = null,
                    language = "ko",
                    postCount = 10,
                    commentCount = 5,
                    createdAt = currentTime,
                    updatedAt = currentTime
                ),
                createdAt = currentTime.minusSeconds(3600), // 1시간 전
                updatedAt = currentTime.minusSeconds(3600),
                likeCount = 15,
                commentCount = 8,
                category = PostCategory.DISCUSSION,
                tags = listOf("맨시티", "리버풀", "프리미어리그"),
                timeAgo = "1시간 전"
            ),
            Post(
                id = "2",
                boardId = "board1",
                title = "레알 마드리드 새 영입 소식",
                content = "레알 마드리드가 새로운 미드필더 영입을 추진한다는 소식이 있네요.",
                authorId = "user2",
                author = UserProfile(
                    id = "user2",
                    userId = "user2",
                    nickname = "마드리디스타",
                    avatarUrl = null,
                    favoriteTeamId = null,
                    favoriteTeamName = null,
                    language = "ko",
                    postCount = 10,
                    commentCount = 5,
                    createdAt = currentTime,
                    updatedAt = currentTime
                ),
                createdAt = currentTime.minusSeconds(7200), // 2시간 전
                updatedAt = currentTime.minusSeconds(7200),
                likeCount = 23,
                commentCount = 12,
                category = PostCategory.NEWS,
                tags = listOf("레알마드리드", "이적", "라리가"),
                timeAgo = "2시간 전"
            ),
            Post(
                id = "3",
                boardId = "board1",
                title = "손흥민 부상 소식이 걱정되네요",
                content = "토트넘 경기에서 손흥민이 부상을 당했다는데, 심각하지 않았으면 좋겠습니다.",
                authorId = "user3",
                author = UserProfile(
                    id = "user3",
                    userId = "user3",
                    nickname = "토트넘팬",
                    avatarUrl = null,
                    favoriteTeamId = null,
                    favoriteTeamName = null,
                    language = "ko",
                    postCount = 10,
                    commentCount = 5,
                    createdAt = currentTime,
                    updatedAt = currentTime
                ),
                createdAt = currentTime.minusSeconds(10800), // 3시간 전
                updatedAt = currentTime.minusSeconds(10800),
                likeCount = 45,
                commentCount = 20,
                category = PostCategory.GENERAL,
                tags = listOf("손흥민", "토트넘", "부상"),
                timeAgo = "3시간 전"
            ),
            Post(
                id = "4",
                boardId = "board1",
                title = "챔피언스리그 16강 대진 예상해보세요!",
                content = "이번 챔피언스리그 16강 대진이 어떻게 될지 궁금하네요. 여러분의 예상은?",
                authorId = "user4",
                author = UserProfile(
                    id = "user4",
                    userId = "user4",
                    nickname = "UCL매니아",
                    avatarUrl = null,
                    favoriteTeamId = null,
                    favoriteTeamName = null,
                    language = "ko",
                    postCount = 10,
                    commentCount = 5,
                    createdAt = currentTime,
                    updatedAt = currentTime
                ),
                createdAt = currentTime.minusSeconds(14400), // 4시간 전
                updatedAt = currentTime.minusSeconds(14400),
                likeCount = 8,
                commentCount = 15,
                category = PostCategory.QUESTION,
                tags = listOf("챔피언스리그", "16강", "예상"),
                timeAgo = "4시간 전"
            ),
            Post(
                id = "5",
                boardId = "board1",
                title = "바르셀로나 vs 아틀레티코 마드리드 경기 분석",
                content = "어제 경기에서 바르셀로나의 전술이 인상적이었습니다. 특히 미드필드 압박이...",
                authorId = "user5",
                author = UserProfile(
                    id = "user5",
                    userId = "user5",
                    nickname = "전술분석가",
                    avatarUrl = null,
                    favoriteTeamId = null,
                    favoriteTeamName = null,
                    language = "ko",
                    postCount = 10,
                    commentCount = 5,
                    createdAt = currentTime,
                    updatedAt = currentTime
                ),
                createdAt = currentTime.minusSeconds(18000), // 5시간 전
                updatedAt = currentTime.minusSeconds(18000),
                likeCount = 32,
                commentCount = 18,
                category = PostCategory.DISCUSSION,
                tags = listOf("바르셀로나", "아틀레티코", "전술분석"),
                timeAgo = "5시간 전"
            )
        )
    }
    
    /**
     * 토너먼트 대진표를 가져옵니다.
     *
     * @param leagueId 리그 ID (필수)
     * @param season 시즌 (필수)
     * @return 대진표 정보
     */
    override fun getBracket(leagueId: Int, season: Int): Flow<Resource<Bracket>> = flow {
        try {
            emit(Resource.Loading())
            
            android.util.Log.d("FutInfo_Repository", "🔄 대진표 데이터 가져오기: league=$leagueId, season=$season")
            
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] Bracket API 호출 시작")
            val response = try {
                footballApiService.getBracket(leagueId, season)
            } catch (e: Exception) {
                android.util.Log.e("FutInfo_Repository", "🔍 [DEBUG] Bracket API 호출 실패 - 원본 예외: ${e.javaClass.simpleName}: ${e.message}")
                android.util.Log.e("FutInfo_Repository", "🔍 [DEBUG] Bracket 스택 트레이스: ${e.stackTrace.take(5).joinToString("\n")}")
                throw e
            }
            
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] Bracket API 응답 수신")
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] response.response 타입: ${response.response.javaClass.simpleName}")
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] response.response.size: ${response.response.size}")
            android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] response.response 내용: ${response.response.take(3)}")
            
            // DTO를 도메인 모델로 변환
            val bracket = convertToBracket(response, leagueId, season)
            
            android.util.Log.d("FutInfo_Repository", "✅ 대진표 데이터 변환 완료: ${bracket.rounds.size}개 라운드")
            
            emit(Resource.Success(bracket))
            
        } catch (e: Exception) {
            android.util.Log.e("FutInfo_Repository", "❌ 대진표 데이터 가져오기 실패: ${e.message}")
            emit(Resource.Error(e.message ?: "대진표 데이터를 가져올 수 없습니다"))
        }
    }
    
    /**
     * BracketResponseDto를 Bracket 도메인 모델로 변환합니다.
     */
    private suspend fun convertToBracket(dto: BracketResponseDto, leagueId: Int, season: Int): Bracket {
        android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] 대진표 변환 시작 - 라운드 수: ${dto.response.size}")
        
        // API에서 반환된 모든 라운드 로그
        android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] 전체 라운드 목록: ${dto.response}")
        
        // 토너먼트 관련 라운드만 필터링 (16강 플레이오프부터만)
        val tournamentRounds = dto.response.filter { roundName ->
            val lower = roundName.lowercase()
            // 그룹 스테이지 및 리그 단계 제외, 16강 플레이오프부터만 포함
            (lower.contains("final") || 
            lower.contains("semi") || 
            lower.contains("quarter") || 
            lower.contains("round of 16") ||
            lower.contains("round of 32") ||
            lower.contains("1/8") ||
            lower.contains("1/4") ||
            lower.contains("1/2") ||
            lower.contains("playoffs") ||
            lower.contains("knockout")) &&
            // 명시적으로 제외할 라운드들
            !lower.contains("group") &&
            !lower.contains("league") &&
            !lower.contains("regular") &&
            !lower.contains("1st round") && // 일반적으로 초기 라운드는 제외
            !lower.contains("2nd round") &&
            !lower.contains("3rd round") &&
            !lower.contains("4th round") &&
            !lower.contains("5th round") &&
            !lower.contains("6th round") &&
            !lower.contains("matchday") &&
            !lower.contains("preliminary")
        }.take(6) // 최대 6개 라운드로 제한 (32강, 16강, 8강, 준결승, 결승, 3/4위전)
        
        android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] 토너먼트 라운드 필터링: ${tournamentRounds.size}개")
        
        if (tournamentRounds.isEmpty()) {
            android.util.Log.w("FutInfo_Repository", "⚠️ 토너먼트 라운드가 없어서 빈 대진표 반환")
            return Bracket(rounds = emptyList())
        }
        
        val rounds = mutableListOf<com.hyunwoopark.futinfo.domain.model.BracketRound>()
        
        // 각 라운드별 경기 데이터 가져오기
        for (roundName in tournamentRounds) {
            try {
                android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] 라운드 경기 데이터 조회: $roundName")
                
                val roundFixtures = footballApiService.getFixtures(
                    league = leagueId,
                    season = season,
                    round = roundName
                )
                
                android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] $roundName 라운드 경기 수: ${roundFixtures.response.size}")
                
                // 홈/어웨이 경기 그룹화 및 중복 제거
                val uniqueFixtures = mutableMapOf<String, com.hyunwoopark.futinfo.data.remote.dto.FixtureDto>()
                
                roundFixtures.response.forEach { fixtureDto ->
                    val homeTeamId = fixtureDto.teams.home.id
                    val awayTeamId = fixtureDto.teams.away.id
                    
                    // 팀 ID를 정렬하여 동일한 매치업 식별
                    val matchupKey = if (homeTeamId < awayTeamId) {
                        "${homeTeamId}_vs_${awayTeamId}"
                    } else {
                        "${awayTeamId}_vs_${homeTeamId}"
                    }
                    
                    // 이미 있는 매치업이라면 더 최근 경기로 업데이트 (완료된 경기 우선)
                    val existingFixture = uniqueFixtures[matchupKey]
                    if (existingFixture == null || 
                        (fixtureDto.fixture.status.short in listOf("FT", "AET", "PEN") && 
                         existingFixture.fixture.status.short !in listOf("FT", "AET", "PEN"))) {
                        uniqueFixtures[matchupKey] = fixtureDto
                    }
                }
                
                android.util.Log.d("FutInfo_Repository", "🔍 [DEBUG] $roundName 중복 제거 후 경기 수: ${uniqueFixtures.size}")
                
                val bracketFixtures = uniqueFixtures.values.map { fixtureDto ->
                    // 날짜 문자열을 타임스탬프로 변환
                    val timestamp = try {
                        val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", java.util.Locale.getDefault())
                        dateFormat.parse(fixtureDto.fixture.date)?.time ?: 0L
                    } catch (e: Exception) {
                        0L
                    }
                    
                    com.hyunwoopark.futinfo.domain.model.BracketFixture(
                        id = fixtureDto.fixture.id,
                        date = fixtureDto.fixture.date,
                        timestamp = timestamp,
                        status = com.hyunwoopark.futinfo.domain.model.BracketFixtureStatus(
                            long = fixtureDto.fixture.status.long,
                            short = fixtureDto.fixture.status.short,
                            elapsed = fixtureDto.fixture.status.elapsed
                        ),
                        venue = com.hyunwoopark.futinfo.domain.model.BracketVenue(
                            id = fixtureDto.fixture.venue.id,
                            name = fixtureDto.fixture.venue.name,
                            city = fixtureDto.fixture.venue.city
                        ),
                        homeTeam = com.hyunwoopark.futinfo.domain.model.BracketTeam(
                            id = fixtureDto.teams.home.id,
                            name = fixtureDto.teams.home.name,
                            logo = fixtureDto.teams.home.logo
                        ),
                        awayTeam = com.hyunwoopark.futinfo.domain.model.BracketTeam(
                            id = fixtureDto.teams.away.id,
                            name = fixtureDto.teams.away.name,
                            logo = fixtureDto.teams.away.logo
                        ),
                        homeScore = fixtureDto.goals?.home,
                        awayScore = fixtureDto.goals?.away
                    )
                }
                
                if (bracketFixtures.isNotEmpty()) {
                    rounds.add(
                        com.hyunwoopark.futinfo.domain.model.BracketRound(
                            round = roundName,
                            fixtures = bracketFixtures
                        )
                    )
                    android.util.Log.d("FutInfo_Repository", "✅ 라운드 추가: $roundName (${bracketFixtures.size}경기)")
                }
                
            } catch (e: Exception) {
                android.util.Log.e("FutInfo_Repository", "❌ 라운드 경기 데이터 조회 실패: $roundName - ${e.message}")
            }
        }
        
        android.util.Log.d("FutInfo_Repository", "✅ 대진표 변환 완료: ${rounds.size}개 라운드")
        return Bracket(rounds = rounds.sortedBy { getRoundPriority(it.round) })
    }
    
    /**
     * 토너먼트 라운드 우선순위를 반환합니다 (결승 > 준결승 > 8강 > 16강 > 32강 순)
     * 16강 플레이오프부터만 표시
     */
    private fun getRoundPriority(roundName: String): Int {
        val lower = roundName.lowercase()
        return when {
            // 결승전
            lower.contains("final") && !lower.contains("semi") -> 1
            // 3/4위전
            lower.contains("3rd place") || lower.contains("third place") -> 2
            // 준결승
            lower.contains("semi") || lower.contains("1/2") -> 3
            // 8강
            lower.contains("quarter") || lower.contains("1/4") -> 4
            // 16강
            lower.contains("round of 16") || lower.contains("1/8") -> 5
            // 32강 (있는 경우)
            lower.contains("round of 32") || lower.contains("1/16") -> 6
            // 플레이오프
            lower.contains("playoffs") || lower.contains("knockout") -> 7
            else -> 99 // 필터링되지 않은 라운드는 맨 뒤로
        }
    }
    
    // ===== 즐겨찾기 관련 메소드 구현 =====
    
    /**
     * 즐겨찾기를 추가합니다.
     *
     * @param favorite 추가할 즐겨찾기 항목
     */
    override suspend fun addFavorite(favorite: FavoriteEntity) {
        try {
            favoriteDao.insertFavorite(favorite)
            android.util.Log.d("FutInfo_Repository", "✅ 즐겨찾기 추가 완료: ${favorite.name} (${favorite.type})")
        } catch (e: Exception) {
            android.util.Log.e("FutInfo_Repository", "❌ 즐겨찾기 추가 실패: ${e.message}")
            throw e
        }
    }
    
    /**
     * 즐겨찾기를 삭제합니다.
     *
     * @param favoriteId 삭제할 즐겨찾기 ID
     */
    override suspend fun removeFavorite(favoriteId: String) {
        try {
            favoriteDao.deleteFavoriteById(favoriteId)
            android.util.Log.d("FutInfo_Repository", "✅ 즐겨찾기 삭제 완료: $favoriteId")
        } catch (e: Exception) {
            android.util.Log.e("FutInfo_Repository", "❌ 즐겨찾기 삭제 실패: ${e.message}")
            throw e
        }
    }
    
    /**
     * 모든 즐겨찾기 목록을 가져옵니다.
     *
     * @return 즐겨찾기 목록 Flow
     */
    override fun getAllFavorites(): Flow<List<FavoriteEntity>> {
        return favoriteDao.getAllFavorites()
    }
    
    /**
     * 특정 타입의 즐겨찾기 목록을 가져옵니다.
     *
     * @param type 즐겨찾기 타입 ("league", "team", "player")
     * @return 해당 타입의 즐겨찾기 목록 Flow
     */
    override fun getFavoritesByType(type: String): Flow<List<FavoriteEntity>> {
        return favoriteDao.getFavoritesByType(type)
    }
    
    /**
     * 특정 항목이 즐겨찾기에 있는지 확인합니다.
     *
     * @param favoriteId 확인할 즐겨찾기 ID
     * @return 즐겨찾기 여부 Flow
     */
    override fun isFavorite(favoriteId: String): Flow<Boolean> {
        return favoriteDao.getFavoriteByIdFlow(favoriteId).map { it != null }
    }
    
    override fun isFavorite(id: Int, type: String): Flow<Boolean> {
        val favoriteId = "${type}_$id"
        return favoriteDao.getFavoriteByIdFlow(favoriteId).map { it != null }
    }
    
    /**
     * 리그 즐겨찾기 목록을 가져옵니다.
     *
     * @return 리그 즐겨찾기 목록 Flow
     */
    override fun getFavoriteLeagues(): Flow<List<FavoriteEntity>> {
        return favoriteDao.getFavoriteLeagues()
    }
    
    /**
     * 팀 즐겨찾기 목록을 가져옵니다.
     *
     * @return 팀 즐겨찾기 목록 Flow
     */
    override fun getFavoriteTeams(): Flow<List<FavoriteEntity>> {
        return favoriteDao.getFavoriteTeams()
    }
    
    /**
     * 선수 즐겨찾기 목록을 가져옵니다.
     *
     * @return 선수 즐겨찾기 목록 Flow
     */
    override fun getFavoritePlayers(): Flow<List<FavoriteEntity>> {
        return favoriteDao.getFavoritePlayers()
    }
}