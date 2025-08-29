// 번역 한도 시스템 테스트 스크립트

async function testTranslationLimit() {
  console.log('=== 번역 한도 시스템 테스트 ===\n')

  // 1. 현재 번역 상태 확인
  console.log('1. 현재 번역 상태 확인...')
  try {
    const statusResponse = await fetch('http://localhost:3000/api/translate-featured', {
      method: 'GET'
    })
    
    if (statusResponse.ok) {
      const status = await statusResponse.json()
      console.log('✅ 번역 상태:')
      console.log(`   - 일일 한도: ${status.dailyLimit}개`)
      console.log(`   - 오늘 사용: ${status.translatedToday}개`)
      console.log(`   - 남은 횟수: ${status.remainingToday}개`)
      console.log(`   - 번역 대기: ${status.pendingTranslation}개`)
      console.log(`   - 번역 가능: ${status.canTranslate ? '예' : '아니오'}`)
    } else {
      console.error('❌ 상태 확인 실패')
    }
  } catch (error) {
    console.error('❌ 에러:', error.message)
  }

  console.log('\n2. 테스트 번역 수행...')
  console.log('   (실제 번역을 수행하려면 관리자 페이지에서 뉴스를 선택하고 저장해야 합니다)')
  
  // 2. 번역 테스트 (featured_news가 있는 경우에만 동작)
  try {
    const translateResponse = await fetch('http://localhost:3000/api/translate-featured', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (translateResponse.ok) {
      const result = await translateResponse.json()
      console.log('✅ 번역 결과:')
      console.log(`   - 번역된 항목: ${result.translated}개`)
      console.log(`   - 메시지: ${result.message}`)
      console.log(`   - 오늘 남은 횟수: ${result.remainingToday}개`)
      
      if (result.items && result.items.length > 0) {
        console.log('\n   번역된 뉴스:')
        result.items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title}`)
          console.log(`      → ${item.translated_title}`)
        })
      }
    } else {
      const error = await translateResponse.json()
      console.log('ℹ️ 번역 응답:', error.message || error.error)
    }
  } catch (error) {
    console.error('❌ 번역 에러:', error.message)
  }

  console.log('\n=== 테스트 완료 ===')
  console.log('\n💡 참고사항:')
  console.log('- 하루에 5개의 주요 뉴스만 번역됩니다')
  console.log('- 제목과 설명만 번역되며, 본문은 번역하지 않습니다')
  console.log('- 번역 한도는 매일 자정(UTC)에 초기화됩니다')
  console.log('- Microsoft Translator API를 사용합니다')
}

// 테스트 실행
testTranslationLimit()