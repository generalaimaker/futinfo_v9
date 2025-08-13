// DeepL 번역 API 테스트 스크립트
// 사용법: node scripts/test-translation.js

const DEEPL_API_KEY = '75869dbd-a539-4026-95f6-997bdce5d232:fx' // DeepL API 키

async function testTranslation() {
  const testText = "Manchester United secured a dramatic victory against Liverpool"
  
  console.log('🔍 테스트 중...')
  console.log('원문:', testText)
  
  try {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        auth_key: DEEPL_API_KEY,
        text: testText,
        source_lang: 'EN',
        target_lang: 'KO',
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepL API 오류: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ 번역 성공!')
    console.log('번역:', data.translations[0].text)
  } catch (error) {
    console.error('❌ 번역 실패:', error.message)
    console.log('\n해결 방법:')
    console.log('1. DeepL API 키를 발급받으세요: https://www.deepl.com/pro-api')
    console.log('2. 이 파일의 DEEPL_API_KEY를 실제 키로 교체하세요')
    console.log('3. .env.local 파일의 NEXT_PUBLIC_DEEPL_API_KEY도 업데이트하세요')
  }
}

testTranslation()