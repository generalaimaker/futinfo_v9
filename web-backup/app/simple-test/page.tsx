'use client'

export default function SimpleTestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Page</h1>
      <p>If you can see this, Next.js is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Click me for alert
      </button>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <p>Debug info:</p>
        <ul>
          <li>JavaScript enabled: Yes (if you see this)</li>
          <li>Page loaded at: {new Date().toISOString()}</li>
        </ul>
      </div>
    </div>
  )
}