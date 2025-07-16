package com.hyunwoopark.futinfo.data.local

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 사용자가 선택한 리그 설정을 SharedPreferences에 저장/로드하는 클래스
 *
 * 주요 리그와 국제대회는 기본으로 즐겨찾기되어 있으며, 사용자가 추가/제거할 수 있습니다.
 * 일정 탭에서는 즐겨찾기된 리그의 경기만 표시됩니다.
 */
@Singleton
class UserLeaguePreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val sharedPreferences: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME, Context.MODE_PRIVATE
    )
    private val gson = Gson()
    
    companion object {
        private const val PREFS_NAME = "user_league_preferences"
        private const val KEY_FAVORITE_LEAGUES = "favorite_leagues"
        private const val KEY_LEAGUE_ORDER = "league_order"
        private const val KEY_FIRST_LAUNCH = "first_launch"
    }
    
    /**
     * 즐겨찾기된 리그 ID 목록을 가져옵니다.
     * 첫 실행 시에는 기본 주요 리그들이 자동으로 즐겨찾기됩니다.
     */
    fun getFavoriteLeagues(): List<Int> {
        // 첫 실행인지 확인
        if (isFirstLaunch()) {
            initializeDefaultFavorites()
        }
        
        val json = sharedPreferences.getString(KEY_FAVORITE_LEAGUES, null)
        return if (json != null) {
            try {
                val type = object : TypeToken<List<Int>>() {}.type
                gson.fromJson(json, type) ?: getDefaultLeagues()
            } catch (e: Exception) {
                android.util.Log.e("UserLeaguePrefs", "Error parsing favorite leagues: ${e.message}")
                getDefaultLeagues()
            }
        } else {
            getDefaultLeagues()
        }
    }
    
    /**
     * 리그를 즐겨찾기에 추가합니다.
     *
     * @param leagueId 추가할 리그 ID
     * @return 성공 여부
     */
    fun addFavoriteLeague(leagueId: Int): Boolean {
        val currentFavorites = getFavoriteLeagues().toMutableList()
        
        // 이미 즐겨찾기된 리그인지 확인
        if (currentFavorites.contains(leagueId)) {
            android.util.Log.d("UserLeaguePrefs", "League $leagueId already in favorites")
            return false
        }
        
        currentFavorites.add(leagueId)
        return saveFavoriteLeagues(currentFavorites)
    }
    
    /**
     * 리그를 즐겨찾기에서 제거합니다.
     *
     * @param leagueId 제거할 리그 ID
     * @return 성공 여부
     */
    fun removeFavoriteLeague(leagueId: Int): Boolean {
        val currentFavorites = getFavoriteLeagues().toMutableList()
        val removed = currentFavorites.remove(leagueId)
        
        return if (removed) {
            saveFavoriteLeagues(currentFavorites)
        } else {
            android.util.Log.d("UserLeaguePrefs", "League $leagueId not found in favorites")
            false
        }
    }
    
    /**
     * 즐겨찾기 리그 목록을 저장합니다.
     */
    private fun saveFavoriteLeagues(leagues: List<Int>): Boolean {
        return try {
            val json = gson.toJson(leagues)
            sharedPreferences.edit()
                .putString(KEY_FAVORITE_LEAGUES, json)
                .apply()
            android.util.Log.d("UserLeaguePrefs", "Saved favorite leagues: $leagues")
            true
        } catch (e: Exception) {
            android.util.Log.e("UserLeaguePrefs", "Error saving favorite leagues: ${e.message}")
            false
        }
    }
    
    /**
     * 리그 순서를 저장합니다. (향후 확장용)
     */
    fun saveLeagueOrder(orderedLeagueIds: List<Int>): Boolean {
        return try {
            val json = gson.toJson(orderedLeagueIds)
            sharedPreferences.edit()
                .putString(KEY_LEAGUE_ORDER, json)
                .apply()
            true
        } catch (e: Exception) {
            android.util.Log.e("UserLeaguePrefs", "Error saving league order: ${e.message}")
            false
        }
    }
    
    /**
     * 저장된 리그 순서를 가져옵니다. (향후 확장용)
     */
    fun getLeagueOrder(): List<Int>? {
        val json = sharedPreferences.getString(KEY_LEAGUE_ORDER, null)
        return if (json != null) {
            try {
                val type = object : TypeToken<List<Int>>() {}.type
                gson.fromJson(json, type)
            } catch (e: Exception) {
                android.util.Log.e("UserLeaguePrefs", "Error parsing league order: ${e.message}")
                null
            }
        } else {
            null
        }
    }
    
    /**
     * 모든 사용자 설정을 초기화합니다.
     */
    fun clearAllPreferences() {
        sharedPreferences.edit().clear().apply()
        android.util.Log.d("UserLeaguePrefs", "Cleared all user league preferences")
    }
    
    /**
     * 첫 실행인지 확인합니다.
     */
    private fun isFirstLaunch(): Boolean {
        return !sharedPreferences.getBoolean(KEY_FIRST_LAUNCH, false)
    }
    
    /**
     * 첫 실행 시 기본 즐겨찾기 리그들을 설정합니다.
     */
    private fun initializeDefaultFavorites() {
        val defaultLeagues = getDefaultLeagues()
        saveFavoriteLeagues(defaultLeagues)
        
        // 첫 실행 완료 표시
        sharedPreferences.edit()
            .putBoolean(KEY_FIRST_LAUNCH, true)
            .apply()
        
        android.util.Log.d("UserLeaguePrefs", "Initialized default favorite leagues: $defaultLeagues")
    }
    
    /**
     * 특정 리그가 즐겨찾기되어 있는지 확인합니다.
     */
    fun isFavoriteLeague(leagueId: Int): Boolean {
        return getFavoriteLeagues().contains(leagueId)
    }
    
    /**
     * 즐겨찾기된 리그 개수를 반환합니다.
     */
    fun getFavoriteLeagueCount(): Int {
        return getFavoriteLeagues().size
    }
    
    /**
     * 기본 주요 리그 목록을 반환합니다.
     * 주요 리그와 국제대회가 포함됩니다.
     */
    fun getDefaultLeagues(): List<Int> {
        return listOf(
            39,  // Premier League (잉글랜드)
            140, // La Liga (스페인)
            78,  // Bundesliga (독일)
            135, // Serie A (이탈리아)
            61,  // Ligue 1 (프랑스)
            2,   // Champions League (유럽 챔피언스리그)
            3,   // Europa League (유럽 유로파리그)
            1,   // World Cup (월드컵)
            4,   // Euro Championship (유럽선수권대회)
            5,   // Nations League (네이션스리그)
            9,   // Copa America (코파 아메리카)
            15   // Asian Cup (아시안컵) / FIFA Club World Cup (클럽월드컵)
        )
    }
    
    /**
     * 기본 주요 리그인지 확인합니다.
     */
    fun isDefaultLeague(leagueId: Int): Boolean {
        return getDefaultLeagues().contains(leagueId)
    }
    
    /**
     * 일정 탭에 표시할 리그 ID 목록을 반환합니다.
     * 즐겨찾기된 리그만 반환됩니다.
     */
    fun getFixtureDisplayLeagues(): List<Int> {
        return getFavoriteLeagues()
    }
    
    /**
     * 즐겨찾기 상태를 토글합니다.
     *
     * @param leagueId 토글할 리그 ID
     * @return 토글 후 즐겨찾기 상태 (true: 즐겨찾기됨, false: 즐겨찾기 해제됨)
     */
    fun toggleFavoriteLeague(leagueId: Int): Boolean {
        return if (isFavoriteLeague(leagueId)) {
            removeFavoriteLeague(leagueId)
            false
        } else {
            addFavoriteLeague(leagueId)
            true
        }
    }
}