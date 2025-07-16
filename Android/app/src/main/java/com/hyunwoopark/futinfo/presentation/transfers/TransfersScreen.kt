package com.hyunwoopark.futinfo.presentation.transfers

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hyunwoopark.futinfo.domain.model.Transfer
import com.hyunwoopark.futinfo.domain.model.TransferStatus
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * 이적 시장 화면
 * 최신 이적 정보를 표시하고 필터링 및 검색 기능을 제공합니다.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransfersScreen(
    viewModel: TransfersViewModel = hiltViewModel()
) {
    val state = viewModel.state.value
    val filteredTransfers = viewModel.getFilteredTransfers()
    val transferCounts = viewModel.getTransferCountByStatus()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // 상단 제목 및 검색
        TopAppBar(
            title = {
                Text(
                    text = "이적 시장",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            },
            actions = {
                IconButton(onClick = { /* 검색 기능 구현 */ }) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "검색"
                    )
                }
            }
        )
        
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
                // 필터 칩들
                item {
                    FilterChipsRow(
                        selectedFilter = state.selectedFilter,
                        transferCounts = transferCounts,
                        onFilterSelected = viewModel::onFilterChanged
                    )
                }
                
                // 로딩 상태
                if (state.isLoading && !state.isRefreshing) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                }
                
                // 에러 상태
                if (state.error.isNotBlank()) {
                    item {
                        ErrorCard(
                            error = state.error,
                            onRetry = { viewModel.getTransfers() },
                            onDismiss = { viewModel.clearError() }
                        )
                    }
                }
                
                // 이적 목록
                if (filteredTransfers.isNotEmpty()) {
                    items(filteredTransfers) { transfer ->
                        TransferCard(
                            transfer = transfer,
                            onClick = { /* 상세 화면으로 이동 */ }
                        )
                    }
                } else if (!state.isLoading && state.error.isBlank()) {
                    item {
                        EmptyStateCard()
                    }
                }
       }
   }
}

@Composable
private fun FilterChipsRow(
    selectedFilter: TransferFilter,
    transferCounts: Map<TransferFilter, Int>,
    onFilterSelected: (TransferFilter) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 4.dp)
    ) {
        items(TransferFilter.values()) { filter ->
            Button(
                onClick = { onFilterSelected(filter) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedFilter == filter)
                        MaterialTheme.colorScheme.primary
                    else
                        MaterialTheme.colorScheme.surfaceVariant,
                    contentColor = if (selectedFilter == filter)
                        MaterialTheme.colorScheme.onPrimary
                    else
                        MaterialTheme.colorScheme.onSurfaceVariant
                ),
                modifier = Modifier.height(32.dp)
            ) {
                Text(
                    text = "${filter.displayName} (${transferCounts[filter] ?: 0})",
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
private fun TransferCard(
    transfer: Transfer,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 상단: 선수 이름과 상태
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = transfer.playerName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                
                StatusChip(status = transfer.status)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 이적 정보
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${transfer.fromClub} → ${transfer.toClub}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    Row {
                        Text(
                            text = transfer.position,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = " • ${transfer.age}세 • ${transfer.nationality}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = transfer.transferFee,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    
                    Text(
                        text = transfer.transferDate.format(
                            DateTimeFormatter.ofPattern("MM/dd HH:mm", Locale.getDefault())
                        ),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // 하단: 리그와 신뢰도
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = transfer.league,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = transfer.source,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    ReliabilityIndicator(reliability = transfer.reliability)
                }
            }
        }
    }
}

@Composable
private fun StatusChip(status: TransferStatus) {
    val backgroundColor = when (status) {
        TransferStatus.COMPLETED -> Color(0xFF4CAF50)
        TransferStatus.IN_PROGRESS -> Color(0xFFFF9800)
        TransferStatus.NEGOTIATING -> Color(0xFF2196F3)
        TransferStatus.RUMOR -> Color(0xFF9E9E9E)
        TransferStatus.INTERESTED -> Color(0xFF673AB7)
    }
    
    Box(
        modifier = Modifier
            .background(
                color = backgroundColor.copy(alpha = 0.1f),
                shape = RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = status.displayName,
            style = MaterialTheme.typography.labelSmall,
            color = backgroundColor,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun ReliabilityIndicator(reliability: Int) {
    val color = when {
        reliability >= 80 -> Color(0xFF4CAF50)
        reliability >= 60 -> Color(0xFFFF9800)
        else -> Color(0xFFF44336)
    }
    
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        
        Spacer(modifier = Modifier.width(4.dp))
        
        Text(
            text = "${reliability}%",
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun ErrorCard(
    error: String,
    onRetry: () -> Unit,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "오류 발생",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onErrorContainer,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = error,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onErrorContainer
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TextButton(onClick = onRetry) {
                    Text("다시 시도")
                }
                
                TextButton(onClick = onDismiss) {
                    Text("닫기")
                }
            }
        }
    }
}

@Composable
private fun EmptyStateCard() {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "이적 정보가 없습니다",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "현재 조건에 맞는 이적 정보를 찾을 수 없습니다.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}