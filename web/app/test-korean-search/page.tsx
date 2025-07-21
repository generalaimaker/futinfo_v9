'use client'

import { useState } from 'react'
import { convertKoreanToEnglish, isKoreanQuery } from '@/lib/utils/korean-search-mapping'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestKoreanSearchPage() {
  const [testQuery, setTestQuery] = useState('')
  const [results, setResults] = useState<string[]>([])

  const handleTest = () => {
    if (isKoreanQuery(testQuery)) {
      const englishQueries = convertKoreanToEnglish(testQuery)
      setResults(englishQueries)
    } else {
      setResults(['Not a Korean query'])
    }
  }

  const testCases = [
    '맨유', '맨시티', '첼시', '리버풀', '토트넘',
    '레알', '바르샤', '바이에른', '도르트문트',
    '손흥민', '이강인', '김민재', '메시', '호날두'
  ]

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Korean Search Mapping Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Custom Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter Korean query..."
            />
            <Button onClick={handleTest}>Test</Button>
          </div>
          {results.length > 0 && (
            <div className="bg-gray-100 p-3 rounded">
              <strong>Results:</strong>
              <ul className="list-disc list-inside">
                {results.map((result, idx) => (
                  <li key={idx}>{result}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testCases.map(testCase => {
              const isKorean = isKoreanQuery(testCase)
              const englishResults = isKorean ? convertKoreanToEnglish(testCase) : []
              
              return (
                <div key={testCase} className="border rounded p-3">
                  <div className="font-medium">{testCase}</div>
                  <div className="text-sm text-gray-600">
                    {isKorean ? (
                      <>
                        → {englishResults.join(', ')}
                      </>
                    ) : (
                      'Not Korean'
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}