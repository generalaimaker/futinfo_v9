// Microsoft Translator API 테스트 스크립트

const MICROSOFT_TRANSLATOR_KEY = process.env.MICROSOFT_TRANSLATOR_KEY || ''
const MICROSOFT_TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/'
const MICROSOFT_TRANSLATOR_REGION = 'koreacentral'

async function testMicrosoftTranslator() {
  const testCases = [
    {
      text: 'Manchester United wins the match',
      from: 'en',
      to: 'ko',
      expected: '맨체스터 유나이티드'
    },
    {
      text: 'Transfer window opens next month',
      from: 'en',
      to: 'ko',
      expected: '이적'
    },
    {
      text: 'Real Madrid',
      from: 'en',
      to: 'ja',
      expected: 'レアル・マドリード'
    }
  ]

  console.log('Testing Microsoft Translator API...\n')

  for (const testCase of testCases) {
    try {
      const url = `${MICROSOFT_TRANSLATOR_ENDPOINT}translate?api-version=3.0&from=${testCase.from}&to=${testCase.to}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': MICROSOFT_TRANSLATOR_KEY,
          'Ocp-Apim-Subscription-Region': MICROSOFT_TRANSLATOR_REGION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ text: testCase.text }])
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ Failed: ${testCase.text}`)
        console.error(`   Error: ${response.status} - ${error}`)
        continue
      }

      const data = await response.json()
      const translatedText = data[0]?.translations[0]?.text

      console.log(`✅ Success: ${testCase.text}`)
      console.log(`   From: ${testCase.from} → To: ${testCase.to}`)
      console.log(`   Result: ${translatedText}`)
      
      if (testCase.expected && translatedText.includes(testCase.expected)) {
        console.log(`   ✓ Contains expected: "${testCase.expected}"`)
      }
      console.log('')
    } catch (error) {
      console.error(`❌ Error testing: ${testCase.text}`)
      console.error(`   ${error.message}`)
    }
  }

  // Test API endpoint
  console.log('\nTesting via Next.js API route...')
  try {
    const response = await fetch('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Liverpool defeats Chelsea 2-1',
        sourceLang: 'EN',
        targetLang: 'KO'
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Route Test Success:')
      console.log(`   Original: Liverpool defeats Chelsea 2-1`)
      console.log(`   Translated: ${data.translatedText}`)
      console.log(`   Service: ${data.service || 'unknown'}`)
    } else {
      console.error('❌ API Route Test Failed:', response.status)
    }
  } catch (error) {
    console.error('❌ API Route Test Error:', error.message)
    console.log('   Make sure the development server is running (npm run dev)')
  }
}

// Run tests
testMicrosoftTranslator()