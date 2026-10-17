import React, { useState, useEffect } from 'react';
import { generateSalt, deriveKeys, encryptVault, decryptVault, generatePassword } from './crypto';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [vault, setVault] = useState([]);
  const [rawBlob, setRawBlob] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [site, setSite] = useState('');
  const [siteUser, setSiteUser] = useState('');
  const [sitePass, setSitePass] = useState('');

  // ⏱️ Auto-Lock Timer (Inactivity after 5 minutes)
  useEffect(() => {
    if (!token) return; // Only active when logged in

    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        alert("Session locked automatically due to 5 minutes of inactivity.");
        handleLogout();
      }, 5 * 60 * 1000); // 5 minutes
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
    };
  }, [token]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const salt = generateSalt();
    const { authKey } = await deriveKeys(masterPassword, salt);
    
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, authKey, salt })
    });
    
    if (res.ok) {
      alert('Registration successful! Now login.');
      setIsRegistering(false);
    } else {
      alert('Registration failed.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const saltRes = await fetch(`${API_URL}/auth/salt/${username}`);
    if (!saltRes.ok) return alert('User not found');
    const { salt } = await saltRes.json();

    const keys = await deriveKeys(masterPassword, salt);

    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, authKey: keys.authKey })
    });

    if (!loginRes.ok) return alert('Invalid Master Password');
    const data = await loginRes.json();
    
    setToken(data.token);
    setEncryptionKey(keys.encryptionKey);
    fetchVaultData(data.token, keys.encryptionKey);
  };

  const fetchVaultData = async (authToken, encKey) => {
    const res = await fetch(`${API_URL}/vault`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    setRawBlob(data.vaultBlob);
    if (data.vaultBlob) {
      const decrypted = await decryptVault(data.vaultBlob, encKey);
      setVault(decrypted);
    } else {
      setVault([]);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    const updatedVault = [...vault, { site, username: siteUser, password: sitePass, id: Date.now() }];
    const encryptedBlob = await encryptVault(updatedVault, encryptionKey);

    await fetch(`${API_URL}/vault`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ vaultBlob: encryptedBlob })
    });

    setVault(updatedVault);
    setRawBlob(encryptedBlob);
    setSite(''); setSiteUser(''); setSitePass('');
  };

  const handleLogout = () => {
    setToken(null);
    setEncryptionKey(null);
    setVault([]);
    setMasterPassword('');
    setRawBlob(null);
  };

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Vaultify — Zero-Knowledge Password Manager</h2>
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div style={{ marginBottom: '10px' }}>
            <label>Username:</label><br/>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Master Password:</label><br/>
            <input type="password" value={masterPassword} onChange={e => setMasterPassword(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}>
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#007BFF' }} onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <h2>Vaultify Dashboard</h2>
        <div>
          <button onClick={() => setShowRaw(!showRaw)} style={{ marginRight: '10px', padding: '6px 12px' }}>
            {showRaw ? 'Hide Raw Data' : '🔍 View Raw Data (Sanity Check)'}
          </button>
          <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
        </div>
      </div>

      {showRaw && (
        <div style={{ background: '#f8f9fa', padding: '15px', margin: '15px 0', border: '1px dashed #6c757d', borderRadius: '4px' }}>
          <h4>Sanity Check: What the Server Sees (Encrypted Gibberish)</h4>
          <pre style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {JSON.stringify(rawBlob, null, 2)}
          </pre>
        </div>
      )}

      <h3>Add Password Entry</h3>
      <form onSubmit={handleAddEntry} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', marginBottom: '30px' }}>
        <input type="text" placeholder="Site (e.g. GitHub)" value={site} onChange={e => setSite(e.target.value)} required style={{ padding: '8px' }} />
        <input type="text" placeholder="Username/Email" value={siteUser} onChange={e => setSiteUser(e.target.value)} required style={{ padding: '8px' }} />
        <div style={{ display: 'flex' }}>
          <input type="text" placeholder="Password" value={sitePass} onChange={e => setSitePass(e.target.value)} required style={{ padding: '8px', width: '100%' }} />
          <button type="button" onClick={() => setSitePass(generatePassword())} title="Generate strong password" style={{ padding: '0 8px' }}>⚡</button>
        </div>
        <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}>Add</button>
      </form>

      <h3>Your Saved Passwords</h3>
      {vault.length === 0 ? <p>No passwords stored yet.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f1f1', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Site</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Username</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Password</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vault.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.site}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.username}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}><code>{item.password}</code></td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(item.password);
                      alert(`Password for ${item.site} copied to clipboard!`);
                    }}
                    style={{ background: '#007BFF', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    📋 Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}