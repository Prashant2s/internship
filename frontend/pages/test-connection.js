import { useState } from 'react';
import axios from 'axios';
import { config } from '../src/config';

export default function TestConnection() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults = {};

    // Test 1: Check config
    testResults.config = {
      API_BASE: config.API_BASE,
      SOCKET_URL: config.SOCKET_URL,
      ENV_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'NOT SET',
      ENV_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'NOT SET'
    };

    // Test 2: Try to reach backend health
    try {
      const response = await axios.get(`${config.API_BASE}/health`);
      testResults.health = { success: true, data: response.data };
    } catch (error) {
      testResults.health = { 
        success: false, 
        error: error.message,
        code: error.code,
        response: error.response?.data 
      };
    }

    // Test 3: Try to reach backend root
    try {
      const response = await axios.get(config.API_BASE);
      testResults.root = { success: true, data: response.data };
    } catch (error) {
      testResults.root = { 
        success: false, 
        error: error.message 
      };
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>Connection Diagnostic</h1>
      
      <button 
        onClick={runTests} 
        disabled={testing}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {testing ? 'Testing...' : 'Run Tests'}
      </button>

      {Object.keys(results).length > 0 && (
        <div>
          <h2>Results:</h2>
          <pre style={{ 
            background: '#1e1e1e', 
            color: '#fff', 
            padding: '20px', 
            borderRadius: '8px',
            overflow: 'auto'
          }}>
            {JSON.stringify(results, null, 2)}
          </pre>

          <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Diagnosis:</h3>
            {results.config?.ENV_API_BASE === 'NOT SET' && (
              <p style={{ color: 'red', fontWeight: 'bold' }}>
                ❌ ISSUE: Environment variable NEXT_PUBLIC_API_BASE is NOT SET on Render!
              </p>
            )}
            {results.health?.success && (
              <p style={{ color: 'green', fontWeight: 'bold' }}>
                ✅ Backend is reachable and healthy!
              </p>
            )}
            {results.health?.success === false && (
              <p style={{ color: 'red', fontWeight: 'bold' }}>
                ❌ Cannot reach backend: {results.health.error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
