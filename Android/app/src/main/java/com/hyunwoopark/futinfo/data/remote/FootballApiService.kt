package com.hyunwoopark.futinfo.data.remote

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
import com.hyunwoopark.futinfo.data.remote.dto.NewsApiResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.TransferResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.SimpleTransferResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.BracketResponseDto
import retrofit2.http.GET
import retrofit2.http.Query
import retrofit2.http.Url

/**
 * Football API 서비스 인터페이스
 * Retrofit을 사용하여 API-Football 엔드포인트와 통신합니다.
 */
interface FootballApiService {
    
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
    @GET("leagues")
    suspend fun getLeagues(
        @Query("id") id: Int? = null,
        @Query("name") name: String? = null,
        @Query("country") country: String? = null,
        @Query("code") code: String? = null,
        @Query("season") season: Int? = null,
        @Query("type") type: String? = null,
        @Query("current") current: Boolean? = null,
        @Query("search") search: String? = null,
        @Query("last") last: Int? = null
    ): LeaguesResponseDto
    
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
    @GET("fixtures")
    suspend fun getFixtures(
        @Query("id") id: Int? = null,
        @Query("live") live: String? = null,
        @Query("date") date: String? = null,
        @Query("league") league: Int? = null,
        @Query("season") season: Int? = null,
        @Query("team") team: Int? = null,
        @Query("last") last: Int? = null,
        @Query("next") next: Int? = null,
        @Query("from") from: String? = null,
        @Query("to") to: String? = null,
        @Query("round") round: String? = null,
        @Query("status") status: String? = null,
        @Query("venue") venue: Int? = null,
        @Query("timezone") timezone: String? = null
    ): FixturesResponseDto
    
    /**
     * 지원되는 주요 리그들만 가져옵니다.
     * Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League
     *
     * @param season 시즌 (기본값: 현재 시즌)
     * @return 주요 리그 목록 응답
     */
    @GET("leagues")
    suspend fun getSupportedLeagues(
        @Query("season") season: Int? = null,
        @Query("current") current: Boolean? = true
    ): LeaguesResponseDto
    
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
    @GET("teams")
    suspend fun getTeamProfile(
        @Query("id") id: Int,
        @Query("name") name: String? = null,
        @Query("league") league: Int? = null,
        @Query("season") season: Int? = null,
        @Query("country") country: String? = null,
        @Query("code") code: String? = null,
        @Query("venue") venue: Int? = null,
        @Query("search") search: String? = null
    ): TeamProfileResponseDto
    
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
    @GET("teams/statistics")
    suspend fun getTeamStatistics(
        @Query("league") league: Int,
        @Query("season") season: Int,
        @Query("team") team: Int,
        @Query("date") date: String? = null
    ): TeamStatisticsResponseDto
    
    /**
     * 팀 선수단 정보를 가져옵니다.
     *
     * @param team 팀 ID (필수)
     * @param season 시즌 (선택사항)
     *
     * @return 선수단 응답
     */
    @GET("players/squads")
    suspend fun getTeamSquad(
        @Query("team") team: Int,
        @Query("season") season: Int? = null
    ): SquadResponseDto
    
    /**
     * 경기 라인업 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     *
     * @return 라인업 응답
     */
    @GET("fixtures/lineups")
    suspend fun getFixtureLineups(
        @Query("fixture") fixture: Int
    ): LineupResponseDto
    
    /**
     * 경기 통계 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     * @param team 팀 ID (선택사항, 특정 팀의 통계만 조회)
     *
     * @return 경기 통계 응답
     */
    @GET("fixtures/statistics")
    suspend fun getFixtureStatistics(
        @Query("fixture") fixture: Int,
        @Query("team") team: Int? = null
    ): FixtureStatsResponseDto
    
    /**
     * 경기 이벤트 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     *
     * @return 경기 이벤트 응답
     */
    @GET("fixtures/events")
    suspend fun getFixtureEvents(
        @Query("fixture") fixture: Int
    ): FixtureEventResponseDto
    
    /**
     * 리그 순위표를 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (선택사항, 기본값: 현재 시즌)
     *
     * @return 순위표 응답
     */
    @GET("standings")
    suspend fun getStandings(
        @Query("league") league: Int,
        @Query("season") season: Int,
        @Query("team") team: Int? = null
    ): StandingsResponseDto
    
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
    @GET("teams")
    suspend fun searchTeams(
        @Query("search") search: String,
        @Query("country") country: String? = null,
        @Query("league") league: Int? = null,
        @Query("season") season: Int? = null
    ): TeamSearchResponseDto
    
    /**
     * 선수를 검색합니다.
     *
     * @param search 검색어 (필수)
     * @param team 팀 ID (선택사항)
     * @param league 리그 ID (선택사항)
     * @param season 시즌 (선택사항)
     */
    @GET("players")
    suspend fun searchPlayers(
        @Query("search") search: String,
        @Query("team") team: Int? = null,
        @Query("league") league: Int? = null,
        @Query("season") season: Int? = null
    ): PlayerSearchResponseDto
    
    /**
     * 리그별 선수 통계를 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     * @param page 페이지 번호 (선택사항)
     *
     * @return 선수 통계 응답
     */
    @GET("players")
    suspend fun getPlayersByLeague(
        @Query("league") league: Int,
        @Query("season") season: Int,
        @Query("page") page: Int? = null
    ): PlayersResponseDto
    
    /**
     * 리그 득점왕을 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     *
     * @return 득점왕 응답
     */
    @GET("players/topscorers")
    suspend fun getTopScorers(
        @Query("league") league: Int,
        @Query("season") season: Int
    ): PlayersResponseDto
    
    /**
     * 리그 도움왕을 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     *
     * @return 도움왕 응답
     */
    @GET("players/topassists")
    suspend fun getTopAssists(
        @Query("league") league: Int,
        @Query("season") season: Int
    ): PlayersResponseDto
    
    /**
     * 선수 프로필 정보를 가져옵니다.
     *
     * @param id 선수 ID (필수)
     * @param season 시즌 (선택사항)
     * @param team 팀 ID (선택사항)
     *
     * @return 선수 프로필 응답
     */
    @GET("players")
    suspend fun getPlayerProfile(
        @Query("id") id: Int,
        @Query("season") season: Int? = null,
        @Query("team") team: Int? = null
    ): PlayerProfileResponseDto
    
    /**
     * 축구 뉴스를 가져옵니다.
     * News API를 사용하여 축구 관련 뉴스를 조회합니다.
     *
     * @param url News API의 완전한 URL (쿼리 파라미터 포함)
     * @return 뉴스 응답
     */
    @GET
    suspend fun getNews(@Url url: String): NewsApiResponseDto
    
    /**
     * 이적 정보를 가져옵니다.
     *
     * @param player 선수 ID (선택사항)
     * @param team 팀 ID (선택사항)
     * @param season 시즌 (선택사항)
     *
     * @return 이적 정보 응답
     */
    @GET("transfers")
    suspend fun getTransfers(
        @Query("player") player: Int? = null,
        @Query("team") team: Int? = null,
        @Query("season") season: Int? = null
    ): TransferResponseDto
    
    /**
     * 최신 이적 정보를 가져옵니다. (샘플 데이터)
     * 실제 구현에서는 외부 API나 웹 스크래핑을 통해 데이터를 수집합니다.
     *
     * @return 간소화된 이적 정보 응답
     */
    @GET
    suspend fun getLatestTransfers(@Url url: String): SimpleTransferResponseDto
    
    /**
     * 토너먼트 대진표를 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     *
     * @return 대진표 응답
     */
    @GET("fixtures/rounds")
    suspend fun getBracket(
        @Query("league") league: Int,
        @Query("season") season: Int
    ): BracketResponseDto
}