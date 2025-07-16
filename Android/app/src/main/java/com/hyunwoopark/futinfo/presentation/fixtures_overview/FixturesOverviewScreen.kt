package com.hyunwoopark.futinfo.presentation.fixtures_overview

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.BorderStroke
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.hyunwoopark.futinfo.data.remote.dto.FixtureDto
import com.hyunwoopark.futinfo.presentation.fixtures.FixtureItem
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * iOS FixturesOverviewView를 참고한 안드로이드 일정 개요 화면
 * 날짜별 탭과 HorizontalPager를 사용하여 iOS와 동일한 UX를 제공합니다.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun FixturesOverviewScreen(
    viewModel: FixturesOverviewViewModel = hiltViewModel(),
    onFixtureClick: (Int) -> Unit = {},
    onTeamClick: (Int) -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val pagerState = rememberPagerState(
        initialPage = state.selectedDateIndex,
        pageCount = { state.availableDates.size }
    )
    val coroutineScope = rememberCoroutineScope()
    
    // 페이지 변경 시 날짜 선택 동기화
    LaunchedEffect(pagerState.currentPage) {
        if (pagerState.currentPage < state.availableDates.size) {
            val selectedDate = state.availableDates[pagerState.currentPage]
            viewModel.selectDate(selectedDate, pagerState.currentPage)
        }
    }
    
    // 선택된 날짜 인덱스 변경 시 페이저 동기화
    LaunchedEffect(state.selectedDateIndex) {
        if (state.selectedDateIndex != pagerState.currentPage && 
            state.selectedDateIndex < state.availableDates.size) {
            pagerState.animateScrollToPage(state.selectedDateIndex)
        }
    }
    
    Scaffold(
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // 날짜 탭 스크롤러 (iOS의 FixturesDateTabsView와 동일)
            if (state.availableDates.isNotEmpty()) {
                DateTabsRow(
                    dates = state.availableDates,
                    selectedIndex = state.selectedDateIndex,
                    onDateSelected = { date, index ->
                        viewModel.selectDate(date, index)
                        coroutineScope.launch {
                            pagerState.animateScrollToPage(index)
                        }
                    }
                )
            }
            
            // 경기 목록 페이저 (iOS의 FixturesPageTabView와 동일)
            if (state.availableDates.isNotEmpty()) {
                HorizontalPager(
                    state = pagerState,
                    modifier = Modifier.fillMaxSize()
                ) { page ->
                    val pageDate = state.availableDates.getOrNull(page) ?: ""
                    val isPageLoading = state.loadingDates.contains(pageDate) || 
                                      (state.isLoading && page == state.selectedDateIndex)
                    
                    FixturesPageContent(
                        date = pageDate,
                        viewModel = viewModel,
                        fixtures = if (page == state.selectedDateIndex) state.fixtures else emptyList(),
                        isLoading = isPageLoading,
                        errorMessage = if (page == state.selectedDateIndex) state.errorMessage else null,
                        onFixtureClick = onFixtureClick,
                        onTeamClick = onTeamClick,
                        onRetry = { viewModel.refreshFixtures() }
                    )
                }
            } else {
                // 초기 로딩 상태
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }
    }
}

/**
 * 날짜 탭 행 (iOS의 FixturesDateTabsView 구현)
 */
@Composable
fun DateTabsRow(
    dates: List<String>,
    selectedIndex: Int,
    onDateSelected: (String, Int) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyRow(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        itemsIndexed(dates) { index, date ->
            DateTab(
                date = date,
                isSelected = index == selectedIndex,
                onClick = { onDateSelected(date, index) }
            )
        }
    }
}

/**
 * 개별 날짜 탭
 */
@Composable
fun DateTab(
    date: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val displayFormat = SimpleDateFormat("MM/dd", Locale.getDefault())
    val dayFormat = SimpleDateFormat("E", Locale.getDefault())
    
    val parsedDate = try {
        dateFormat.parse(date)
    } catch (e: Exception) {
        Date()
    }
    
    val displayDate = parsedDate?.let { displayFormat.format(it) } ?: ""
    val dayOfWeek = parsedDate?.let { dayFormat.format(it) } ?: ""
    
    val isToday = date == dateFormat.format(Date())
    
    // iOS 스타일에 맞춰 디자인 수정
    Surface(
        modifier = modifier
            .clickable { onClick() }
            .width(64.dp),
        shape = RoundedCornerShape(8.dp),
        color = when {
            isSelected -> MaterialTheme.colorScheme.primary
            else -> Color.Transparent
        },
        border = if (!isSelected && isToday) {
            BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
        } else null
    ) {
        Column(
            modifier = Modifier
                .padding(vertical = 12.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = dayOfWeek,
                style = MaterialTheme.typography.labelSmall,
                color = when {
                    isSelected -> MaterialTheme.colorScheme.onPrimary
                    isToday -> MaterialTheme.colorScheme.primary
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                },
                fontSize = 11.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = displayDate,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.Medium
                ),
                color = when {
                    isSelected -> MaterialTheme.colorScheme.onPrimary
                    isToday -> MaterialTheme.colorScheme.primary
                    else -> MaterialTheme.colorScheme.onSurface
                },
                fontSize = 14.sp
            )
        }
    }
}

/**
 * 경기 페이지 콘텐츠 (iOS의 개별 페이지 구현)
 */
@Composable
fun FixturesPageContent(
    date: String,
    viewModel: FixturesOverviewViewModel,
    fixtures: List<FixtureDto>,
    isLoading: Boolean,
    errorMessage: String?,
    onFixtureClick: (Int) -> Unit,
    onTeamClick: (Int) -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    // 페이지가 표시될 때 해당 날짜의 데이터 확인 및 로드
    LaunchedEffect(date) {
        if (date.isNotEmpty()) {
            val cachedFixtures = viewModel.getFixturesForDate(date)
            if (cachedFixtures == null || cachedFixtures.isEmpty()) {
                // 캐시에 데이터가 없으면 로드
                viewModel.loadFixturesForSpecificDate(date)
            }
        }
    }
    
    // 현재 날짜의 캐시된 데이터 가져오기
    val displayFixtures = if (fixtures.isNotEmpty()) {
        fixtures
    } else {
        viewModel.getFixturesForDate(date) ?: emptyList()
    }
    Box(
        modifier = modifier.fillMaxSize()
    ) {
        when {
            isLoading -> {
                // 로딩 상태
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(48.dp),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "경기 목록을 불러오는 중...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
            }
            
            errorMessage != null -> {
                // 에러 상태
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "오류가 발생했습니다",
                            style = MaterialTheme.typography.headlineSmall,
                            color = MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = errorMessage,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = onRetry) {
                            Text("다시 시도")
                        }
                    }
                }
            }
            
            displayFixtures.isEmpty() -> {
                // 빈 상태
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "📅",
                            style = MaterialTheme.typography.displayMedium
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "이 날짜에는 경기가 없습니다",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
            }
            
            else -> {
                // 경기 목록 표시
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(displayFixtures) { fixture ->
                        FixtureItem(
                            fixture = fixture,
                            onFixtureClick = onFixtureClick,
                            onTeamClick = onTeamClick
                        )
                    }
                }
            }
        }
    }
}