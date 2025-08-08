'use client'

import { useState } from 'react'
import { useFixturesByDate } from '@/lib/supabase/football'
import { FixturesResponse } from '@/lib/types/football'

export default function TestSameAsMainPage() {
  // 메인 페이지와 동일한 방식으로 날짜 설정
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date('2025-07-16T00:00:00')
    date.setHours(12, 0, 0, 0)
    return date
  })
  
  // 메인 페이지와 동일한 방식으로 API 호출
  const { data: fixturesData, isLoading, error, isError, status, fetchStatus } = useFixturesByDate(selectedDate) as { 
    data: FixturesResponse | undefined; 
    isLoading: boolean; 
    error: Error | null;
    isError: boolean;
    status: string;
    fetchStatus: string;
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Same As Main Page</h1>
      <p className="text-gray-600 mb-4">이 페이지는 메인 페이지와 정확히 같은 방식으로 API를 호출합니다.</p>
      
      <div className="space-y-4">
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">API 호출 상태</h2>
          <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
            {JSON.stringify({
              selectedDate: selectedDate.toISOString(),
              isLoading,
              isError,
              status,
              fetchStatus,
              error: error?.message || error,
              hasData: !!fixturesData,
              dataLength: fixturesData?.response?.length || 0
            }, null, 2)}
          </pre>
        </div>
        
        {error && (
          <div className="border border-red-400 rounded p-4 bg-red-50">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Error Details</h2>
            <pre className="p-2 bg-white rounded text-sm overflow-auto">
              {JSON.stringify({
                message: error.message,
                stack: (error as any).stack,
                name: error.name
              }, null, 2)}
            </pre>
          </div>
        )}
        
        {fixturesData && (
          <div className="border rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Response Data</h2>
            <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(fixturesData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}