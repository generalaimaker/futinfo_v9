package com.hyunwoopark.futinfo.presentation.news

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * 뉴스 필터링을 위한 바텀시트 컴포넌트
 * 
 * 검색어, 카테고리, 날짜 범위 필터링 기능을 제공합니다.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsFilterBottomSheet(
    searchQuery: String,
    selectedCategory: String?,
    startDate: String?,
    endDate: String?,
    onSearchQueryChange: (String) -> Unit,
    onCategorySelect: (String?) -> Unit,
    onDateRangeSelect: (String?, String?) -> Unit,
    onApplyFilters: () -> Unit,
    onClearFilters: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    var localSearchQuery by remember { mutableStateOf(searchQuery) }
    var localSelectedCategory by remember { mutableStateOf(selectedCategory) }
    var localStartDate by remember { mutableStateOf(startDate) }
    var localEndDate by remember { mutableStateOf(endDate) }
    
    val categories = listOf(
        "전체" to null,
        "이적" to "transfer",
        "경기" to "match", 
        "부상" to "injury",
        "국가대표" to "international",
        "일반" to "general"
    )

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 헤더
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "뉴스 필터",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            
            TextButton(onClick = onClearFilters) {
                Text("전체 초기화")
            }
        }
        
        Divider()
        
        // 검색어 입력
        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "검색어",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )
            
            OutlinedTextField(
                value = localSearchQuery,
                onValueChange = { 
                    localSearchQuery = it
                    onSearchQueryChange(it)
                },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("검색어를 입력하세요") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "검색"
                    )
                },
                trailingIcon = {
                    if (localSearchQuery.isNotEmpty()) {
                        IconButton(
                            onClick = { 
                                localSearchQuery = ""
                                onSearchQueryChange("")
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Clear,
                                contentDescription = "검색어 지우기"
                            )
                        }
                    }
                },
                singleLine = true
            )
        }
        
        // 카테고리 선택
        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "카테고리",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )
            
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { (displayName, categoryValue) ->
                    FilterChip(
                        onClick = { 
                            localSelectedCategory = categoryValue
                            onCategorySelect(categoryValue)
                        },
                        label = { Text(displayName) },
                        selected = localSelectedCategory == categoryValue
                    )
                }
            }
        }
        
        // 날짜 범위 선택
        Column(
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "날짜 범위",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // 시작 날짜
                OutlinedTextField(
                    value = localStartDate ?: "",
                    onValueChange = { },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("시작 날짜") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.CalendarToday,
                            contentDescription = "날짜 선택"
                        )
                    },
                    readOnly = true,
                    singleLine = true
                )
                
                // 종료 날짜
                OutlinedTextField(
                    value = localEndDate ?: "",
                    onValueChange = { },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("종료 날짜") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.CalendarToday,
                            contentDescription = "날짜 선택"
                        )
                    },
                    readOnly = true,
                    singleLine = true
                )
            }
            
            // 날짜 범위 빠른 선택 버튼들
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    OutlinedButton(
                        onClick = {
                            val today = LocalDate.now()
                            val todayStr = today.format(DateTimeFormatter.ISO_LOCAL_DATE)
                            localStartDate = todayStr
                            localEndDate = todayStr
                            onDateRangeSelect(todayStr, todayStr)
                        }
                    ) {
                        Text("오늘")
                    }
                }
                
                item {
                    OutlinedButton(
                        onClick = {
                            val today = LocalDate.now()
                            val weekAgo = today.minusDays(7)
                            val todayStr = today.format(DateTimeFormatter.ISO_LOCAL_DATE)
                            val weekAgoStr = weekAgo.format(DateTimeFormatter.ISO_LOCAL_DATE)
                            localStartDate = weekAgoStr
                            localEndDate = todayStr
                            onDateRangeSelect(weekAgoStr, todayStr)
                        }
                    ) {
                        Text("최근 7일")
                    }
                }
                
                item {
                    OutlinedButton(
                        onClick = {
                            val today = LocalDate.now()
                            val monthAgo = today.minusDays(30)
                            val todayStr = today.format(DateTimeFormatter.ISO_LOCAL_DATE)
                            val monthAgoStr = monthAgo.format(DateTimeFormatter.ISO_LOCAL_DATE)
                            localStartDate = monthAgoStr
                            localEndDate = todayStr
                            onDateRangeSelect(monthAgoStr, todayStr)
                        }
                    ) {
                        Text("최근 30일")
                    }
                }
                
                item {
                    OutlinedButton(
                        onClick = {
                            localStartDate = null
                            localEndDate = null
                            onDateRangeSelect(null, null)
                        }
                    ) {
                        Text("전체 기간")
                    }
                }
            }
        }
        
        Divider()
        
        // 액션 버튼들
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = onDismiss,
                modifier = Modifier.weight(1f)
            ) {
                Text("취소")
            }
            
            Button(
                onClick = onApplyFilters,
                modifier = Modifier.weight(1f)
            ) {
                Text("적용")
            }
        }
        
        // 바텀시트 하단 여백
        Spacer(modifier = Modifier.height(16.dp))
    }
}

/**
 * 필터 상태를 표시하는 칩 컴포넌트
 */
@Composable
fun FilterStatusChip(
    text: String,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier
) {
    AssistChip(
        onClick = onRemove,
        label = { Text(text) },
        trailingIcon = {
            Icon(
                imageVector = Icons.Default.Clear,
                contentDescription = "필터 제거",
                modifier = Modifier.size(16.dp)
            )
        },
        modifier = modifier
    )
}