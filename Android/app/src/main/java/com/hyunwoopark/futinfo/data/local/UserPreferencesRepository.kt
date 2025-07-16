package com.hyunwoopark.futinfo.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 사용자 설정을 관리하는 Repository
 * Jetpack DataStore를 사용하여 언어 설정 등을 저장하고 불러옴
 */
@Singleton
class UserPreferencesRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    
    companion object {
        private val LANGUAGE_KEY = stringPreferencesKey("language")
        const val DEFAULT_LANGUAGE = "ko" // 기본 언어는 한국어
    }
    
    /**
     * 언어 설정을 저장합니다
     * @param language 저장할 언어 코드 (예: "ko", "en")
     */
    suspend fun saveLanguage(language: String) {
        dataStore.edit { preferences ->
            preferences[LANGUAGE_KEY] = language
        }
    }
    
    /**
     * 저장된 언어 설정을 불러옵니다
     * @return 언어 코드를 방출하는 Flow (기본값: "ko")
     */
    fun getLanguage(): Flow<String> {
        return dataStore.data.map { preferences ->
            preferences[LANGUAGE_KEY] ?: DEFAULT_LANGUAGE
        }
    }
}