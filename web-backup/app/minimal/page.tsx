export default function MinimalPage() {
  return (
    <div style={{ padding: '2rem', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'black' }}>
        FUTINFO - Minimal Test
      </h1>
      <p style={{ color: 'black' }}>
        If you can see this text, the basic rendering is working.
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <p style={{ color: 'black' }}>This is a test box to verify CSS is not the issue.</p>
      </div>
    </div>
  )
}