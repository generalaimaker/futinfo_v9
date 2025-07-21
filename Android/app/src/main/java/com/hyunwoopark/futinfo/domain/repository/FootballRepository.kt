package com.hyunwoopark.futinfo.domain.repository

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
import com.hyunwoopark.futinfo.data.remote.dto.TransferResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.SimpleTransferResponseDto
import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity
import com.hyunwoopark.futinfo.domain.model.NewsArticle
import com.hyunwoopark.futinfo.domain.model.PlayerProfile
import com.hyunwoopark.futinfo.domain.model.Transfer
import com.hyunwoopark.futinfo.domain.model.Post
import com.hyunwoopark.futinfo.domain.model.Bracket
import com.hyunwoopark.futinfo.domain.model.Board
import com.hyunwoopark.futinfo.domain.model.Comment
import com.hyunwoopark.futinfo.domain.model.UserProfile
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow

/**
 * Football 데이터 Repository 인터페이스
 * 데이터 소스를 추상화하여 도메인 계층에서 사용합니다.
 */
interface FootballRepository {
    
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
    suspend fun getLeagues(
        id: Int? = null,
        name: String? = null,
        country: String? = null,
        code: String? = null,
        season: Int? = null,
        type: String? = null,
        current: Boolean? = null,
        search: String? = null,
        last: Int? = null
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
    suspend fun getFixtures(
        id: Int? = null,
        live: String? = null,
        date: String? = null,
        league: Int? = null,
        season: Int? = null,
        team: Int? = null,
        last: Int? = null,
        next: Int? = null,
        from: String? = null,
        to: String? = null,
        round: String? = null,
        status: String? = null,
        venue: Int? = null,
        timezone: String? = null
    ): FixturesResponseDto
    
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
    suspend fun getFixtures(
        date: String,
        leagueIds: List<Int>,
        season: Int? = null
    ): FixturesResponseDto
    
    /**
     * 지원되는 주요 리그들만 가져옵니다.
     * Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League
     *
     * @param season 시즌 (기본값: 현재 시즌)
     * @return 주요 리그 목록 응답
     */
    suspend fun getSupportedLeagues(season: Int? = null): LeaguesResponseDto
    
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
    suspend fun getTeamProfile(
        id: Int,
        name: String? = null,
        league: Int? = null,
        season: Int? = null,
        country: String? = null,
        code: String? = null,
        venue: Int? = null,
        search: String? = null
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
    suspend fun getTeamStatistics(
        league: Int,
        season: Int,
        team: Int,
        date: String? = null
    ): TeamStatisticsResponseDto
    
    /**
     * 팀 선수단 정보를 가져옵니다.
     *
     * @param team 팀 ID (필수)
     * @param season 시즌 (선택사항)
     *
     * @return 선수단 응답
     */
    suspend fun getTeamSquad(
        team: Int,
        season: Int? = null
    ): SquadResponseDto
    
    /**
     * 경기 라인업 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     *
     * @return 라인업 응답
     */
    suspend fun getFixtureLineups(
        fixture: Int
    ): LineupResponseDto
    
    /**
     * 경기 통계 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     * @param team 팀 ID (선택사항, 특정 팀의 통계만 조회)
     *
     * @return 경기 통계 응답
     */
    suspend fun getFixtureStatistics(
        fixture: Int,
        team: Int? = null
    ): FixtureStatsResponseDto
    
    /**
     * 경기 이벤트 정보를 가져옵니다.
     *
     * @param fixture 경기 ID (필수)
     *
     * @return 경기 이벤트 응답
     */
    suspend fun getFixtureEvents(
        fixture: Int
    ): FixtureEventResponseDto
    
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
    suspend fun searchTeams(
        search: String,
        country: String? = null,
        league: Int? = null,
        season: Int? = null
    ): TeamSearchResponseDto
    
    /**
     * 선수를 검색합니다.
     *
     * @param search 검색어 (필수)
     * @param team 팀별 필터링 (선택사항)
     * @param league 리그별 필터링 (선택사항)
     * @param season 시즌별 필터링 (선택사항)
     *
     * @return 선수 검색 결과 응답
     */
    suspend fun searchPlayers(
        search: String,
        team: Int? = null,
        league: Int? = null,
        season: Int? = null
    ): PlayerSearchResponseDto
    
    /**
     * 리그 순위표를 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     * @param team 특정 팀 ID (선택사항)
     *
     * @return 순위표 응답
     */
    suspend fun getStandings(
        league: Int,
        season: Int,
        team: Int? = null
    ): StandingsResponseDto
    
    /**
     * 리그별 선수 통계를 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     * @param page 페이지 번호 (선택사항)
     *
     * @return 선수 통계 응답
     */
    suspend fun getPlayersByLeague(
        league: Int,
        season: Int,
        page: Int? = null
    ): PlayersResponseDto
    
    /**
     * 리그 득점왕을 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     *
     * @return 득점왕 응답
     */
    suspend fun getTopScorers(
        league: Int,
        season: Int
    ): PlayersResponseDto
    
    /**
     * 리그 도움왕을 가져옵니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     *
     * @return 도움왕 응답
     */
    suspend fun getTopAssists(
        league: Int,
        season: Int
    ): PlayersResponseDto
    
    /**
     * 선수 프로필 정보를 가져옵니다.
     *
     * @param id 선수 ID (필수)
     * @param season 시즌 (선택사항)
     * @param team 팀 ID (선택사항)
     *
     * @return 선수 프로필
     */
    suspend fun getPlayerProfile(
        id: Int,
        season: Int? = null,
        team: Int? = null
    ): PlayerProfile
    
    /**
     * 축구 뉴스를 가져옵니다.
     *
     * @param query 검색 쿼리 (선택사항, 기본값: "football")
     * @param maxResults 최대 결과 수 (선택사항, 기본값: 20)
     * @param startDate 시작 날짜 (YYYY-MM-DD 형식, 선택사항)
     * @param endDate 종료 날짜 (YYYY-MM-DD 형식, 선택사항)
     * @param category 카테고리 필터 (선택사항)
     *
     * @return 뉴스 기사 목록
     */
    suspend fun getNews(
        query: String = "football",
        maxResults: Int = 20,
        startDate: String? = null,
        endDate: String? = null,
        category: String? = null
    ): List<NewsArticle>
    
    /**
     * 이적 정보를 가져옵니다.
     *
     * @param player 선수 ID (선택사항)
     * @param team 팀 ID (선택사항)
     * @param season 시즌 (선택사항)
     *
     * @return 이적 정보 응답
     */
    suspend fun getTransfers(
        player: Int? = null,
        team: Int? = null,
        season: Int? = null
    ): TransferResponseDto
    
    /**
     * 최신 이적 정보를 가져옵니다. (도메인 모델로 변환)
     *
     * @return 이적 정보 목록
     */
    suspend fun getLatestTransfers(): List<Transfer>
    
    // ===== 커뮤니티 관련 메소드 =====
    
    /**
     * 모든 커뮤니티 보드 목록을 가져옵니다.
     *
     * @return 보드 목록
     */
    suspend fun getBoards(): List<Board>
    
    /**
     * 특정 보드 정보를 가져옵니다.
     *
     * @param boardId 보드 ID
     * @return 보드 정보
     */
    suspend fun getBoard(boardId: String): Board?
    
    /**
     * 특정 보드의 게시글 목록을 가져옵니다.
     *
     * @param boardId 보드 ID
     * @param category 카테고리별 필터링 (선택사항)
     * @param limit 가져올 게시글 수 (기본값: 20)
     * @param offset 오프셋 (페이지네이션용)
     * @return 게시글 목록
     */
    suspend fun getPostsByBoard(
        boardId: String,
        category: String? = null,
        limit: Int = 20,
        offset: Int = 0
    ): List<Post>
    
    /**
     * 커뮤니티 게시글 목록을 가져옵니다.
     *
     * @param category 카테고리별 필터링 (선택사항)
     * @param limit 가져올 게시글 수 (기본값: 20)
     * @return 게시글 목록
     */
    suspend fun getPosts(
        category: String? = null,
        limit: Int = 20
    ): List<Post>
    
    /**
     * 특정 게시글 상세 정보를 가져옵니다.
     *
     * @param postId 게시글 ID
     * @return 게시글 상세 정보
     */
    suspend fun getPost(postId: String): Post?
    
    /**
     * 게시글을 생성합니다.
     *
     * @param boardId 보드 ID
     * @param title 제목
     * @param content 내용
     * @param category 카테고리
     * @param tags 태그 목록
     * @param imageUrls 이미지 URL 목록
     * @return 생성된 게시글 ID
     */
    suspend fun createPost(
        boardId: String,
        title: String,
        content: String,
        category: String,
        tags: List<String> = emptyList(),
        imageUrls: List<String> = emptyList()
    ): String
    
    /**
     * 게시글을 수정합니다.
     *
     * @param postId 게시글 ID
     * @param title 제목
     * @param content 내용
     * @param category 카테고리
     * @param tags 태그 목록
     * @param imageUrls 이미지 URL 목록
     * @return 성공 여부
     */
    suspend fun updatePost(
        postId: String,
        title: String,
        content: String,
        category: String,
        tags: List<String> = emptyList(),
        imageUrls: List<String> = emptyList()
    ): Boolean
    
    /**
     * 게시글을 삭제합니다.
     *
     * @param postId 게시글 ID
     * @return 성공 여부
     */
    suspend fun deletePost(postId: String): Boolean
    
    /**
     * 게시글 조회수를 증가시킵니다.
     *
     * @param postId 게시글 ID
     * @return 성공 여부
     */
    suspend fun incrementPostView(postId: String): Boolean
    
    /**
     * 게시글의 댓글 목록을 가져옵니다.
     *
     * @param postId 게시글 ID
     * @return 댓글 목록
     */
    suspend fun getComments(postId: String): List<Comment>
    
    /**
     * 댓글을 생성합니다.
     *
     * @param postId 게시글 ID
     * @param content 댓글 내용
     * @param parentId 부모 댓글 ID (대댓글인 경우)
     * @return 생성된 댓글 ID
     */
    suspend fun createComment(
        postId: String,
        content: String,
        parentId: String? = null
    ): String
    
    /**
     * 댓글을 삭제합니다.
     *
     * @param commentId 댓글 ID
     * @return 성공 여부
     */
    suspend fun deleteComment(commentId: String): Boolean
    
    /**
     * 게시글에 좋아요를 추가/제거합니다.
     *
     * @param postId 게시글 ID
     * @param isLiked 좋아요 여부
     * @return 성공 여부
     */
    suspend fun togglePostLike(postId: String, isLiked: Boolean): Boolean
    
    /**
     * 댓글에 좋아요를 추가/제거합니다.
     *
     * @param commentId 댓글 ID
     * @param isLiked 좋아요 여부
     * @return 성공 여부
     */
    suspend fun toggleCommentLike(commentId: String, isLiked: Boolean): Boolean
    
    /**
     * 현재 사용자의 프로필 정보를 가져옵니다.
     *
     * @return 사용자 프로필
     */
    suspend fun getCurrentUserProfile(): UserProfile?
    
    /**
     * 사용자 프로필을 생성/업데이트합니다.
     *
     * @param nickname 닉네임
     * @param favoriteTeamId 선호 팀 ID
     * @param favoriteTeamName 선호 팀 이름
     * @param avatarUrl 아바타 URL
     * @return 성공 여부
     */
    suspend fun updateUserProfile(
        nickname: String,
        favoriteTeamId: Int? = null,
        favoriteTeamName: String? = null,
        avatarUrl: String? = null
    ): Boolean
    
    /**
     * 토너먼트 대진표를 가져옵니다.
     *
     * @param leagueId 리그 ID (필수)
     * @param season 시즌 (필수)
     * @return 대진표 정보
     */
    fun getBracket(
        leagueId: Int,
        season: Int
    ): Flow<Resource<Bracket>>
    
    // ===== 즐겨찾기 관련 메소드 =====
    
    /**
     * 즐겨찾기를 추가합니다.
     *
     * @param favorite 추가할 즐겨찾기 항목
     */
    suspend fun addFavorite(favorite: FavoriteEntity)
    
    /**
     * 즐겨찾기를 삭제합니다.
     *
     * @param favoriteId 삭제할 즐겨찾기 ID
     */
    suspend fun removeFavorite(favoriteId: String)
    
    /**
     * 모든 즐겨찾기 목록을 가져옵니다.
     *
     * @return 즐겨찾기 목록 Flow
     */
    fun getAllFavorites(): Flow<List<FavoriteEntity>>
    
    /**
     * 특정 타입의 즐겨찾기 목록을 가져옵니다.
     *
     * @param type 즐겨찾기 타입 ("league", "team", "player")
     * @return 해당 타입의 즐겨찾기 목록 Flow
     */
    fun getFavoritesByType(type: String): Flow<List<FavoriteEntity>>
    
    /**
     * 특정 항목이 즐겨찾기에 있는지 확인합니다.
     *
     * @param favoriteId 확인할 즐겨찾기 ID
     * @return 즐겨찾기 여부 Flow
     */
    fun isFavorite(favoriteId: String): Flow<Boolean>
    
    /**
     * 특정 항목이 즐겨찾기에 있는지 확인합니다.
     *
     * @param id 항목 ID
     * @param type 항목 타입 ("league", "team", "player")
     * @return 즐겨찾기 여부 Flow
     */
    fun isFavorite(id: Int, type: String): Flow<Boolean>
    
    /**
     * 리그 즐겨찾기 목록을 가져옵니다.
     *
     * @return 리그 즐겨찾기 목록 Flow
     */
    fun getFavoriteLeagues(): Flow<List<FavoriteEntity>>
    
    /**
     * 팀 즐겨찾기 목록을 가져옵니다.
     *
     * @return 팀 즐겨찾기 목록 Flow
     */
    fun getFavoriteTeams(): Flow<List<FavoriteEntity>>
    
    /**
     * 선수 즐겨찾기 목록을 가져옵니다.
     *
     * @return 선수 즐겨찾기 목록 Flow
     */
    fun getFavoritePlayers(): Flow<List<FavoriteEntity>>
}