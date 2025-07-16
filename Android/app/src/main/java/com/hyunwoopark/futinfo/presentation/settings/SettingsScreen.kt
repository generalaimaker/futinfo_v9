package com.hyunwoopark.futinfo.presentation.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.hyunwoopark.futinfo.presentation.navigation.Screen

/**
 * 설정 화면
 * 언어 설정 등의 사용자 설정을 관리합니다
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: androidx.navigation.NavController,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            verticalArrangement = Arrangement.Top
        ) {
            // 팔로잉 섹션
            item {
                SettingsSectionHeader(title = "팔로잉")
            }
            
            item {
                SettingsNavigationItem(
                    icon = Icons.Default.Star,
                    iconColor = Color(0xFFFFC107), // Yellow color for star
                    title = "즐겨찾기",
                    onClick = { /* TODO: Navigate to Favorites */ }
                )
            }
            
            item {
                SettingsNavigationItem(
                    icon = Icons.Default.Groups,
                    iconColor = MaterialTheme.colorScheme.primary,
                    title = "팔로잉 팀",
                    onClick = { navController.navigate(Screen.FollowingTeams.route) }
                )
            }
            
            item {
                SettingsNavigationItem(
                    icon = Icons.Default.Person,
                    iconColor = MaterialTheme.colorScheme.secondary,
                    title = "팔로잉 선수",
                    onClick = { navController.navigate(Screen.FollowingPlayers.route) }
                )
            }
            
            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            // 앱 설정 섹션
            item {
                SettingsSectionHeader(title = "앱 설정")
            }
            
            item {
                SettingsSwitchItem(
                    title = "다크 모드",
                    checked = false, // TODO: 실제 다크 모드 상태 연결
                    onCheckedChange = { /* TODO: 다크 모드 토글 */ }
                )
            }
            
            item {
                SettingsSwitchItem(
                    title = "푸시 알림",
                    checked = true, // TODO: 실제 알림 상태 연결
                    onCheckedChange = { /* TODO: 알림 토글 */ }
                )
            }
            
            item {
                SettingsNavigationItem(
                    icon = Icons.Default.Language,
                    iconColor = MaterialTheme.colorScheme.primary,
                    title = "언어",
                    subtitle = getLanguageDisplayName(uiState.currentLanguage),
                    onClick = { navController.navigate(Screen.LanguageSettings.route) }
                )
            }
            
            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            // 정보 섹션
            item {
                SettingsSectionHeader(title = "정보")
            }
            
            item {
                SettingsSimpleItem(
                    title = "앱 정보",
                    onClick = { /* TODO: 앱 정보 화면 */ }
                )
            }
            
            item {
                SettingsSimpleItem(
                    title = "개인정보 처리방침",
                    onClick = { /* TODO: 개인정보 처리방침 */ }
                )
            }
            
            item {
                SettingsSimpleItem(
                    title = "이용약관",
                    onClick = { /* TODO: 이용약관 */ }
                )
            }
        }
    }

}

@Composable
private fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    )
}

@Composable
private fun SettingsNavigationItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String? = null,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(24.dp)
            )
            
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge
                )
                subtitle?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SettingsSwitchItem(
    title: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f)
            )
            
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange
            )
        }
    }
}

@Composable
private fun SettingsSimpleItem(
    title: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f)
            )
            
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun LanguageSettingItem(
    currentLanguage: String,
    isLoading: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Language,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "언어",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = getLanguageDisplayName(currentLanguage),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp
                )
            }
        }
    }
}

@Composable
private fun LanguageSelectionDialog(
    currentLanguage: String,
    onLanguageSelected: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val languages = listOf(
        "ko" to "한국어",
        "en" to "English"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "언어 선택",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column {
                languages.forEach { (code, name) ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onLanguageSelected(code) }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = currentLanguage == code,
                            onClick = { onLanguageSelected(code) }
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = name,
                            style = MaterialTheme.typography.bodyLarge
                        )
                        if (currentLanguage == code) {
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("취소")
            }
        }
    )
}

private fun getLanguageDisplayName(languageCode: String): String {
    return when (languageCode) {
        "ko" -> "한국어"
        "en" -> "English"
        else -> "한국어"
    }
}