package com.futinfo.services

import android.util.Log
import com.futinfo.data.models.*
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.*
import io.github.jan.supabase.realtime.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.util.Date
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
data class LiveMatch(
    val fixture_id: Int,
    val league_id: Int,
    val league_name: String,
    val home_team_id: Int,
    val home_team_name: String,
    val home_team_logo: String? = null,
    val away_team_id: Int,
    val away_team_name: String,
    val away_team_logo: String? = null,
    val status: String,
    val status_short: String,
    val elapsed: Int? = null,
    val home_score: Int = 0,
    val away_score: Int = 0,
    val match_date: String,
    val venue_name: String? = null,
    val venue_city: String? = null,
    val referee: String? = null,
    val round: String,
    val last_updated: String? = null,
    val created_at: String? = null
)

@Serializable
data class LiveMatchEvent(
    val id: Int? = null,
    val fixture_id: Int,
    val time_elapsed: Int,
    val time_extra: Int? = null,
    val team_id: Int,
    val team_name: String,
    val player_id: Int? = null,
    val player_name: String? = null,
    val assist_id: Int? = null,
    val assist_name: String? = null,
    val type: String,
    val detail: String? = null,
    val comments: String? = null,
    val created_at: String? = null
)

@Serializable
data class LiveMatchStatistics(
    val id: Int? = null,
    val fixture_id: Int,
    val team_id: Int,
    val team_name: String,
    val statistics: JsonObject,
    val updated_at: String? = null
)

@Singleton
class LiveMatchRealtimeService @Inject constructor(
    private val supabaseClient: SupabaseClient
) {
    companion object {
        private const val TAG = "LiveMatchRealtimeService"
    }

    private val _liveMatches = MutableStateFlow<List<LiveMatch>>(emptyList())
    val liveMatches: StateFlow<List<LiveMatch>> = _liveMatches.asStateFlow()

    private val _matchEvents = MutableStateFlow<Map<Int, List<LiveMatchEvent>>>(emptyMap())
    val matchEvents: StateFlow<Map<Int, List<LiveMatchEvent>>> = _matchEvents.asStateFlow()

    private val _matchStatistics = MutableStateFlow<Map<Int, List<LiveMatchStatistics>>>(emptyMap())
    val matchStatistics: StateFlow<Map<Int, List<LiveMatchStatistics>>> = _matchStatistics.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private var realtimeChannel: RealtimeChannel? = null
    private var eventsChannel: RealtimeChannel? = null
    private var statsChannel: RealtimeChannel? = null

    private val coroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    suspend fun startRealtimeSubscription() {
        Log.d(TAG, "Starting realtime subscription")

        try {
            // 라이브 경기 채널 구독
            realtimeChannel = supabaseClient.realtime.channel("live-matches-channel")

            // INSERT 이벤트
            realtimeChannel?.postgresChangeFlow<PostgresAction.Insert>("public:live_matches")
                ?.onEach { change ->
                    val match = Json.decodeFromJsonElement<LiveMatch>(change.record)
                    handleMatchInsert(match)
                }
                ?.launchIn(coroutineScope)

            // UPDATE 이벤트
            realtimeChannel?.postgresChangeFlow<PostgresAction.Update>("public:live_matches")
                ?.onEach { change ->
                    val match = Json.decodeFromJsonElement<LiveMatch>(change.record)
                    handleMatchUpdate(match)
                }
                ?.launchIn(coroutineScope)

            // DELETE 이벤트
            realtimeChannel?.postgresChangeFlow<PostgresAction.Delete>("public:live_matches")
                ?.onEach { change ->
                    val fixtureId = change.oldRecord["fixture_id"]?.jsonPrimitive?.int
                    if (fixtureId != null) {
                        handleMatchDelete(fixtureId)
                    }
                }
                ?.launchIn(coroutineScope)

            // 채널 구독
            realtimeChannel?.subscribe()

            // 이벤트 채널 구독
            subscribeToEvents()

            // 통계 채널 구독
            subscribeToStatistics()

            // 초기 데이터 로드
            loadInitialLiveMatches()

            _isConnected.value = true
            Log.d(TAG, "Realtime subscription started successfully")

        } catch (e: Exception) {
            Log.e(TAG, "Error starting realtime subscription", e)
            _isConnected.value = false
        }
    }

    suspend fun stopRealtimeSubscription() {
        Log.d(TAG, "Stopping realtime subscription")

        realtimeChannel?.unsubscribe()
        eventsChannel?.unsubscribe()
        statsChannel?.unsubscribe()

        realtimeChannel = null
        eventsChannel = null
        statsChannel = null

        _isConnected.value = false
        coroutineScope.cancel()
    }

    private suspend fun loadInitialLiveMatches() {
        try {
            val matches = supabaseClient.postgrest["live_matches"]
                .select()
                .decodeList<LiveMatch>()

            _liveMatches.value = matches
            Log.d(TAG, "Loaded ${matches.size} initial live matches")

            // 각 경기의 이벤트와 통계 로드
            matches.forEach { match ->
                loadMatchEvents(match.fixture_id)
                loadMatchStatistics(match.fixture_id)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error loading initial live matches", e)
        }
    }

    private suspend fun subscribeToEvents() {
        eventsChannel = supabaseClient.realtime.channel("live-events-channel")

        eventsChannel?.postgresChangeFlow<PostgresAction.Insert>("public:live_match_events")
            ?.onEach { change ->
                val event = Json.decodeFromJsonElement<LiveMatchEvent>(change.record)
                handleEventInsert(event)
            }
            ?.launchIn(coroutineScope)

        eventsChannel?.subscribe()
    }

    private suspend fun subscribeToStatistics() {
        statsChannel = supabaseClient.realtime.channel("live-stats-channel")

        statsChannel?.postgresChangeFlow<PostgresAction.Update>("public:live_match_statistics")
            ?.onEach { change ->
                val stats = Json.decodeFromJsonElement<LiveMatchStatistics>(change.record)
                handleStatisticsUpdate(stats)
            }
            ?.launchIn(coroutineScope)

        statsChannel?.subscribe()
    }

    private fun handleMatchInsert(match: LiveMatch) {
        Log.d(TAG, "New live match: ${match.home_team_name} vs ${match.away_team_name}")
        _liveMatches.value = (_liveMatches.value + match).sortedBy { it.match_date }
    }

    private fun handleMatchUpdate(match: LiveMatch) {
        Log.d(TAG, "Live match updated: ${match.home_team_name} ${match.home_score}-${match.away_score} ${match.away_team_name}")
        
        _liveMatches.value = _liveMatches.value.map { 
            if (it.fixture_id == match.fixture_id) match else it 
        }
    }

    private fun handleMatchDelete(fixtureId: Int) {
        Log.d(TAG, "Live match ended: ID $fixtureId")
        
        _liveMatches.value = _liveMatches.value.filter { it.fixture_id != fixtureId }
        
        // 관련 이벤트와 통계 제거
        _matchEvents.value = _matchEvents.value.toMutableMap().apply {
            remove(fixtureId)
        }
        _matchStatistics.value = _matchStatistics.value.toMutableMap().apply {
            remove(fixtureId)
        }
    }

    private fun handleEventInsert(event: LiveMatchEvent) {
        Log.d(TAG, "New event: ${event.type} - ${event.player_name ?: "Unknown"} (${event.time_elapsed}')")
        
        val currentEvents = _matchEvents.value.toMutableMap()
        val fixtureEvents = currentEvents.getOrDefault(event.fixture_id, emptyList())
        currentEvents[event.fixture_id] = (fixtureEvents + event).sortedBy { it.time_elapsed }
        _matchEvents.value = currentEvents
    }

    private fun handleStatisticsUpdate(stats: LiveMatchStatistics) {
        val currentStats = _matchStatistics.value.toMutableMap()
        val fixtureStats = currentStats.getOrDefault(stats.fixture_id, emptyList())
        
        // 팀별로 업데이트
        val updatedStats = fixtureStats.toMutableList()
        val existingIndex = updatedStats.indexOfFirst { it.team_id == stats.team_id }
        
        if (existingIndex >= 0) {
            updatedStats[existingIndex] = stats
        } else {
            updatedStats.add(stats)
        }
        
        currentStats[stats.fixture_id] = updatedStats
        _matchStatistics.value = currentStats
    }

    private suspend fun loadMatchEvents(fixtureId: Int) {
        try {
            val events = supabaseClient.postgrest["live_match_events"]
                .select { 
                    filter { 
                        eq("fixture_id", fixtureId) 
                    }
                }
                .decodeList<LiveMatchEvent>()

            val currentEvents = _matchEvents.value.toMutableMap()
            currentEvents[fixtureId] = events.sortedBy { it.time_elapsed }
            _matchEvents.value = currentEvents

        } catch (e: Exception) {
            Log.e(TAG, "Error loading match events", e)
        }
    }

    private suspend fun loadMatchStatistics(fixtureId: Int) {
        try {
            val stats = supabaseClient.postgrest["live_match_statistics"]
                .select { 
                    filter { 
                        eq("fixture_id", fixtureId) 
                    }
                }
                .decodeList<LiveMatchStatistics>()

            val currentStats = _matchStatistics.value.toMutableMap()
            currentStats[fixtureId] = stats
            _matchStatistics.value = currentStats

        } catch (e: Exception) {
            Log.e(TAG, "Error loading match statistics", e)
        }
    }

    // Fixture로 변환하는 헬퍼 메서드
    fun liveMatchToFixture(liveMatch: LiveMatch): Fixture {
        return Fixture(
            fixture = FixtureInfo(
                id = liveMatch.fixture_id,
                referee = liveMatch.referee,
                timezone = "UTC",
                date = liveMatch.match_date,
                timestamp = 0, // 계산 필요
                periods = Periods(first = null, second = null),
                venue = Venue(
                    id = null,
                    name = liveMatch.venue_name,
                    city = liveMatch.venue_city
                ),
                status = Status(
                    long = liveMatch.status,
                    short = liveMatch.status_short,
                    elapsed = liveMatch.elapsed
                )
            ),
            league = League(
                id = liveMatch.league_id,
                name = liveMatch.league_name,
                country = "",
                logo = "",
                flag = null,
                season = 2025,
                round = liveMatch.round
            ),
            teams = Teams(
                home = Team(
                    id = liveMatch.home_team_id,
                    name = liveMatch.home_team_name,
                    logo = liveMatch.home_team_logo ?: "",
                    winner = null
                ),
                away = Team(
                    id = liveMatch.away_team_id,
                    name = liveMatch.away_team_name,
                    logo = liveMatch.away_team_logo ?: "",
                    winner = null
                )
            ),
            goals = Goals(
                home = liveMatch.home_score,
                away = liveMatch.away_score
            ),
            score = Score(
                halftime = Goals(home = null, away = null),
                fulltime = Goals(home = null, away = null),
                extratime = Goals(home = null, away = null),
                penalty = Goals(home = null, away = null)
            )
        )
    }
}