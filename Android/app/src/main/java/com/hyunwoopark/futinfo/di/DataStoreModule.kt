package com.hyunwoopark.futinfo.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

/**
 * DataStore 의존성 주입을 위한 Hilt 모듈
 * DataStore 인스턴스를 제공합니다.
 */
@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {

    /**
     * DataStore<Preferences> 인스턴스를 제공합니다.
     * 
     * @param context Application Context
     * @return DataStore<Preferences> 인스턴스
     */
    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return context.dataStore
    }
}