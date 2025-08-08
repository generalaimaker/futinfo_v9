'use client'

import { useEffect, useState } from 'react'

export default function TestConsolePage() {
  const [mounted, setMounted] = useState(false)
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    console.log('=== TEST CONSOLE PAGE MOUNTED ===')
    console.log('Current time:', new Date().toISOString())
    console.log('Window object exists:', typeof window !== 'undefined')
    console.log('Document object exists:', typeof document !== 'undefined')
    
    setMounted(true)
    
    // Log every second to see if console is working
    const interval = setInterval(() => {
      console.log(`[TestConsole] Heartbeat ${Date.now()}`)
    }, 1000)
    
    return () => {
      console.log('=== TEST CONSOLE PAGE UNMOUNTING ===')
      clearInterval(interval)
    }
  }, [])

  const handleClick = () => {
    const newCounter = counter + 1
    console.log(`[TestConsole] Button clicked! Counter: ${newCounter}`)
    console.warn('[TestConsole] This is a warning')
    console.error('[TestConsole] This is an error')
    setCounter(newCounter)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Console Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <p>Mounted: {mounted ? 'Yes' : 'No'}</p>
          <p>Current time: {new Date().toLocaleTimeString()}</p>
          <p>Counter: {counter}</p>
        </div>
        
        <button 
          onClick={handleClick}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Click me to test console (clicked {counter} times)
        </button>
        
        <div className="p-4 bg-yellow-100 rounded">
          <p className="font-semibold">개발자 도구를 열고 Console 탭을 확인하세요:</p>
          <ul className="list-disc list-inside mt-2">
            <li>페이지 로드시 마운트 로그가 보여야 합니다</li>
            <li>매초마다 Heartbeat 로그가 보여야 합니다</li>
            <li>버튼 클릭시 클릭 로그가 보여야 합니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}