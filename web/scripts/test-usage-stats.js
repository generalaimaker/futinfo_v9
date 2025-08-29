// 사용량 통계 API 테스트

async function testUsageStats() {
  console.log('=== 사용량 통계 API 테스트 ===\n')
  
  try {
    // Note: This will only work if you're logged in as admin in the browser
    // For testing, we'll just check if the endpoint responds
    const response = await fetch('http://localhost:3000/api/admin/usage-stats')
    
    if (response.status === 401) {
      console.log('⚠️  인증 필요 (관리자 로그인 상태에서만 접근 가능)')
      console.log('\n관리자 페이지에서 직접 확인하세요:')
      console.log('1. http://localhost:3000/admin 접속')
      console.log('2. 관리자 로그인')
      console.log('3. "모니터링" 탭 클릭')
      return
    }
    
    if (response.ok) {
      const data = await response.json()
      
      console.log('✅ 사용량 통계 조회 성공!\n')
      
      console.log('📊 뉴스 통계:')
      console.log(`   - 전체 뉴스: ${data.news.total}개`)
      console.log(`   - 오늘 수집: ${data.news.today}개`)
      console.log(`   - 이번 달: ${data.news.thisMonth}개`)
      console.log(`   - 번역 완료: ${data.news.translated}개`)
      console.log(`   - Featured: ${data.news.featured}개`)
      
      console.log('\n🌐 번역 사용량:')
      console.log(`   일일:`)
      console.log(`   - 사용: ${data.translation.daily.used}/${data.translation.daily.limit}`)
      console.log(`   - 남은 횟수: ${data.translation.daily.remaining}개`)
      console.log(`   월간:`)
      console.log(`   - 문자 사용: ${data.translation.monthly.charactersUsed.toLocaleString()}`)
      console.log(`   - 한도: ${data.translation.monthly.charactersLimit.toLocaleString()}`)
      console.log(`   - 사용률: ${data.translation.monthly.percentUsed}%`)
      
      console.log('\n💾 저장소:')
      console.log(`   - 예상 크기: ${data.storage.estimatedSizeMB} MB`)
      console.log(`   - 총 레코드: ${data.storage.totalRecords}개`)
      console.log(`   - 평균 크기: ${data.storage.averageRecordSizeKB} KB/레코드`)
      
      console.log('\n🏥 시스템 상태:')
      console.log(`   - 뉴스 수집기: ${data.systemHealth.newsCollector.status}`)
      console.log(`   - 번역 서비스: ${data.systemHealth.translator.status}`)
      console.log(`   - 데이터베이스: ${data.systemHealth.database.status}`)
      
      if (data.categories) {
        console.log('\n📂 카테고리 분포:')
        Object.entries(data.categories).forEach(([category, count]) => {
          console.log(`   - ${category}: ${count}개`)
        })
      }
      
      if (data.sources && data.sources.length > 0) {
        console.log('\n📰 상위 뉴스 소스:')
        data.sources.forEach((source, index) => {
          console.log(`   ${index + 1}. ${source.name}: ${source.count}개 (신뢰도: ${source.avgTrustScore})`)
        })
      }
    }
  } catch (error) {
    console.error('❌ 에러:', error.message)
  }
  
  console.log('\n=== 테스트 완료 ===')
}

// 테스트 실행
testUsageStats()