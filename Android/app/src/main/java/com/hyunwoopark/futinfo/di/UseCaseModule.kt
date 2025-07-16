package com.hyunwoopark.futinfo.di

import com.hyunwoopark.futinfo.data.local.UserLeaguePreferences
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.domain.use_case.AddFavoriteUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetBracketUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetFavoritesUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetFixtureDetailUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetFixturesUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetLeaguesUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetPlayerProfileUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetPlayersByLeagueUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetStandingsUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetTeamProfileUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetTeamStatisticsUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetTopAssistsUseCase
import com.hyunwoopark.futinfo.domain.use_case.GetTopScorersUseCase
import com.hyunwoopark.futinfo.domain.use_case.IsFavoriteUseCase
import com.hyunwoopark.futinfo.domain.use_case.RemoveFavoriteUseCase
import com.hyunwoopark.futinfo.domain.use_case.SearchTeamsUseCase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * UseCase 의존성 주입을 위한 Hilt 모듈
 * 모든 UseCase들을 제공합니다.
 */
@Module
@InstallIn(SingletonComponent::class)
object UseCaseModule {

    @Provides
    @Singleton
    fun provideGetLeaguesUseCase(
        repository: FootballRepository
    ): GetLeaguesUseCase = GetLeaguesUseCase(repository)

    @Provides
    @Singleton
    fun provideGetFixturesUseCase(
        repository: FootballRepository,
        userLeaguePreferences: UserLeaguePreferences
    ): GetFixturesUseCase = GetFixturesUseCase(repository, userLeaguePreferences)

    @Provides
    @Singleton
    fun provideGetStandingsUseCase(
        repository: FootballRepository
    ): GetStandingsUseCase = GetStandingsUseCase(repository)

    @Provides
    @Singleton
    fun provideGetTopScorersUseCase(
        repository: FootballRepository
    ): GetTopScorersUseCase = GetTopScorersUseCase(repository)

    @Provides
    @Singleton
    fun provideGetTopAssistsUseCase(
        repository: FootballRepository
    ): GetTopAssistsUseCase = GetTopAssistsUseCase(repository)

    @Provides
    @Singleton
    fun provideGetTeamProfileUseCase(
        repository: FootballRepository
    ): GetTeamProfileUseCase = GetTeamProfileUseCase(repository)

    @Provides
    @Singleton
    fun provideGetFixtureDetailUseCase(
        repository: FootballRepository
    ): GetFixtureDetailUseCase = GetFixtureDetailUseCase(repository)

    @Provides
    @Singleton
    fun provideSearchTeamsUseCase(
        repository: FootballRepository
    ): SearchTeamsUseCase = SearchTeamsUseCase(repository)

    @Provides
    @Singleton
    fun provideGetPlayersByLeagueUseCase(
        repository: FootballRepository
    ): GetPlayersByLeagueUseCase = GetPlayersByLeagueUseCase(repository)

    @Provides
    @Singleton
    fun provideGetPlayerProfileUseCase(
        repository: FootballRepository
    ): GetPlayerProfileUseCase = GetPlayerProfileUseCase(repository)

    @Provides
    @Singleton
    fun provideGetBracketUseCase(
        repository: FootballRepository
    ): GetBracketUseCase = GetBracketUseCase(repository)

    @Provides
    @Singleton
    fun provideGetTeamStatisticsUseCase(
        repository: FootballRepository
    ): GetTeamStatisticsUseCase = GetTeamStatisticsUseCase(repository)

    // 즐겨찾기 관련 UseCase들
    @Provides
    @Singleton
    fun provideAddFavoriteUseCase(
        repository: FootballRepository
    ): AddFavoriteUseCase = AddFavoriteUseCase(repository)

    @Provides
    @Singleton
    fun provideRemoveFavoriteUseCase(
        repository: FootballRepository
    ): RemoveFavoriteUseCase = RemoveFavoriteUseCase(repository)

    @Provides
    @Singleton
    fun provideGetFavoritesUseCase(
        repository: FootballRepository
    ): GetFavoritesUseCase = GetFavoritesUseCase(repository)

    @Provides
    @Singleton
    fun provideIsFavoriteUseCase(
        repository: FootballRepository
    ): IsFavoriteUseCase = IsFavoriteUseCase(repository)
}