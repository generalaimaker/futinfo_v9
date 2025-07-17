package com.hyunwoopark.futinfo.domain.service

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * iOS의 FavoriteService와 동일한 즐겨찾기 관리 서비스
 */
@Singleton
class FavoriteService @Inject constructor(
    private val context: Context,
    private val json: Json
) {
    
    companion object {
        private const val TAG = "FavoriteService"
        private const val PREFS_NAME = "favorites_prefs"
        private const val KEY_FAVORITES = "favorites"
        private const val MAX_FAVORITES_PER_TYPE = 50
    }
    
    private val sharedPreferences: SharedPreferences = 
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    private val _favorites = MutableStateFlow<List<FavoriteItem>>(emptyList())
    val favorites: StateFlow<List<FavoriteItem>> = _favorites.asStateFlow()
    
    init {
        loadFavorites()
    }
    
    /**
     * 즐겨찾기 추가
     */
    fun addFavorite(
        type: FavoriteType,
        entityId: Int,
        name: String,
        imageUrl: String? = null,
        additionalData: Map<String, String> = emptyMap()
    ) {
        val currentFavorites = _favorites.value.toMutableList()
        
        // 이미 즐겨찾기에 있는지 확인
        if (currentFavorites.any { it.type == type && it.entityId == entityId }) {
            Log.d(TAG, "이미 즐겨찾기에 추가된 항목: $type - $entityId")
            return
        }
        
        // 타입별 최대 개수 확인
        val sameTypeCount = currentFavorites.count { it.type == type }
        if (sameTypeCount >= MAX_FAVORITES_PER_TYPE) {
            Log.w(TAG, "즐겨찾기 한도 초과: $type - 최대 $MAX_FAVORITES_PER_TYPE 개")
            return
        }
        
        val newFavorite = FavoriteItem(
            type = type,
            entityId = entityId,
            name = name,
            imageUrl = imageUrl,
            addedDate = System.currentTimeMillis(),
            additionalData = additionalData
        )
        
        currentFavorites.add(newFavorite)
        updateFavorites(currentFavorites)
        
        Log.d(TAG, "즐겨찾기 추가: $type - $name ($entityId)")
    }
    
    /**
     * 즐겨찾기 제거
     */
    fun removeFavorite(type: FavoriteType, entityId: Int) {
        val currentFavorites = _favorites.value.toMutableList()
        val removedItem = currentFavorites.find { it.type == type && it.entityId == entityId }
        
        if (removedItem != null) {
            currentFavorites.remove(removedItem)
            updateFavorites(currentFavorites)
            Log.d(TAG, "즐겨찾기 제거: $type - ${removedItem.name} ($entityId)")
        }
    }
    
    /**
     * 즐겨찾기 토글
     */
    fun toggleFavorite(
        type: FavoriteType,
        entityId: Int,
        name: String,
        imageUrl: String? = null,
        additionalData: Map<String, String> = emptyMap()
    ) {
        if (isFavorite(type, entityId)) {
            removeFavorite(type, entityId)
        } else {
            addFavorite(type, entityId, name, imageUrl, additionalData)
        }
    }
    
    /**
     * 즐겨찾기 여부 확인
     */
    fun isFavorite(type: FavoriteType, entityId: Int): Boolean {
        return _favorites.value.any { it.type == type && it.entityId == entityId }
    }
    
    /**
     * 타입별 즐겨찾기 가져오기
     */
    fun getFavoritesByType(type: FavoriteType): List<FavoriteItem> {
        return _favorites.value.filter { it.type == type }
            .sortedByDescending { it.addedDate }
    }
    
    /**
     * 팀 즐겨찾기 가져오기
     */
    fun getFavoriteTeams(): List<FavoriteItem> {
        return getFavoritesByType(FavoriteType.TEAM)
    }
    
    /**
     * 선수 즐겨찾기 가져오기
     */
    fun getFavoritePlayers(): List<FavoriteItem> {
        return getFavoritesByType(FavoriteType.PLAYER)
    }
    
    /**
     * 리그 즐겨찾기 가져오기
     */
    fun getFavoriteLeagues(): List<FavoriteItem> {
        return getFavoritesByType(FavoriteType.LEAGUE)
    }
    
    /**
     * 즐겨찾기 순서 변경
     */
    fun reorderFavorites(newOrder: List<FavoriteItem>) {
        // 각 항목에 새로운 순서 정보 추가
        val reorderedFavorites = newOrder.mapIndexed { index, item ->
            item.copy(addedDate = System.currentTimeMillis() - index)
        }
        
        updateFavorites(reorderedFavorites)
        Log.d(TAG, "즐겨찾기 순서 변경: ${reorderedFavorites.size}개 항목")
    }
    
    /**
     * 즐겨찾기 정보 업데이트
     */
    fun updateFavoriteInfo(
        type: FavoriteType,
        entityId: Int,
        name: String? = null,
        imageUrl: String? = null,
        additionalData: Map<String, String>? = null
    ) {
        val currentFavorites = _favorites.value.toMutableList()
        val index = currentFavorites.indexOfFirst { it.type == type && it.entityId == entityId }
        
        if (index != -1) {
            val existingItem = currentFavorites[index]
            val updatedItem = existingItem.copy(
                name = name ?: existingItem.name,
                imageUrl = imageUrl ?: existingItem.imageUrl,
                additionalData = additionalData ?: existingItem.additionalData
            )
            
            currentFavorites[index] = updatedItem
            updateFavorites(currentFavorites)
            
            Log.d(TAG, "즐겨찾기 정보 업데이트: $type - $name ($entityId)")
        }
    }
    
    /**
     * 모든 즐겨찾기 삭제
     */
    fun clearAllFavorites() {
        updateFavorites(emptyList())
        Log.d(TAG, "모든 즐겨찾기 삭제")
    }
    
    /**
     * 타입별 즐겨찾기 삭제
     */
    fun clearFavoritesByType(type: FavoriteType) {
        val currentFavorites = _favorites.value.toMutableList()
        currentFavorites.removeAll { it.type == type }
        updateFavorites(currentFavorites)
        Log.d(TAG, "타입별 즐겨찾기 삭제: $type")
    }
    
    /**
     * 즐겨찾기 검색
     */
    fun searchFavorites(query: String): List<FavoriteItem> {
        val lowercaseQuery = query.lowercase()
        return _favorites.value.filter { item ->
            item.name.lowercase().contains(lowercaseQuery) ||
            item.additionalData.values.any { it.lowercase().contains(lowercaseQuery) }
        }
    }
    
    /**
     * 즐겨찾기 통계
     */
    fun getFavoriteStats(): FavoriteStats {
        val favorites = _favorites.value
        return FavoriteStats(
            totalCount = favorites.size,
            teamCount = favorites.count { it.type == FavoriteType.TEAM },
            playerCount = favorites.count { it.type == FavoriteType.PLAYER },
            leagueCount = favorites.count { it.type == FavoriteType.LEAGUE }
        )
    }
    
    /**
     * 즐겨찾기 내부 업데이트
     */
    private fun updateFavorites(newFavorites: List<FavoriteItem>) {
        _favorites.value = newFavorites
        saveFavorites()
    }
    
    /**
     * 즐겨찾기 저장
     */
    private fun saveFavorites() {
        try {
            val favoritesJson = json.encodeToString(_favorites.value)
            sharedPreferences.edit()
                .putString(KEY_FAVORITES, favoritesJson)
                .apply()
        } catch (e: Exception) {
            Log.e(TAG, "즐겨찾기 저장 실패: ${e.message}")
        }
    }
    
    /**
     * 즐겨찾기 로드
     */
    private fun loadFavorites() {
        try {
            val favoritesJson = sharedPreferences.getString(KEY_FAVORITES, null)
            if (favoritesJson != null) {
                val loadedFavorites = json.decodeFromString<List<FavoriteItem>>(favoritesJson)
                _favorites.value = loadedFavorites
                Log.d(TAG, "즐겨찾기 로드: ${loadedFavorites.size}개 항목")
            }
        } catch (e: Exception) {
            Log.e(TAG, "즐겨찾기 로드 실패: ${e.message}")
            _favorites.value = emptyList()
        }
    }
    
    /**
     * 즐겨찾기 백업 (JSON 문자열 반환)
     */
    fun exportFavorites(): String {
        return try {
            json.encodeToString(_favorites.value)
        } catch (e: Exception) {
            Log.e(TAG, "즐겨찾기 백업 실패: ${e.message}")
            "[]"
        }
    }
    
    /**
     * 즐겨찾기 복원
     */
    fun importFavorites(favoritesJson: String): Boolean {
        return try {
            val importedFavorites = json.decodeFromString<List<FavoriteItem>>(favoritesJson)
            _favorites.value = importedFavorites
            saveFavorites()
            Log.d(TAG, "즐겨찾기 복원: ${importedFavorites.size}개 항목")
            true
        } catch (e: Exception) {
            Log.e(TAG, "즐겨찾기 복원 실패: ${e.message}")
            false
        }
    }
}

/**
 * 즐겨찾기 타입
 */
enum class FavoriteType {
    TEAM,
    PLAYER,
    LEAGUE
}

/**
 * 즐겨찾기 항목
 */
@Serializable
data class FavoriteItem(
    val type: FavoriteType,
    val entityId: Int,
    val name: String,
    val imageUrl: String? = null,
    val addedDate: Long,
    val additionalData: Map<String, String> = emptyMap()
)

/**
 * 즐겨찾기 통계
 */
data class FavoriteStats(
    val totalCount: Int,
    val teamCount: Int,
    val playerCount: Int,
    val leagueCount: Int
)