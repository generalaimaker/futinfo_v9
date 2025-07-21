package com.hyunwoopark.futinfo.di

import com.hyunwoopark.futinfo.data.repository.AuthRepositoryImpl
import com.hyunwoopark.futinfo.data.repository.FootballRepositoryImpl
import com.hyunwoopark.futinfo.domain.repository.AuthRepository
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Repository 의존성 주입을 위한 Hilt 모듈
 * Repository 인터페이스와 구현체를 바인딩합니다.
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    
    /**
     * FootballRepositoryImpl을 FootballRepository 인터페이스에 바인딩합니다.
     * 
     * @param footballRepositoryImpl FootballRepository의 구현체
     * @return FootballRepository 인터페이스
     */
    @Binds
    @Singleton
    abstract fun bindFootballRepository(
        footballRepositoryImpl: FootballRepositoryImpl
    ): FootballRepository
    
    /**
     * AuthRepositoryImpl을 AuthRepository 인터페이스에 바인딩합니다.
     * 
     * @param authRepositoryImpl AuthRepository의 구현체
     * @return AuthRepository 인터페이스
     */
    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository
}