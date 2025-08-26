'use client'

export default function TestPage() {
  console.log('[TestPage] Rendering')
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p>This is a test page to check if routing works.</p>
    </div>
  )
}