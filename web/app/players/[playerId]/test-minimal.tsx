'use client'

export default function TestMinimalPage() {
  console.log('[TestMinimalPage] Component rendered')
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold">Minimal Test Page</h1>
      <p>This is a minimal test page for player profile.</p>
    </div>
  )
}