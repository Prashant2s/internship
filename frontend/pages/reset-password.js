import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (router.query.token) setToken(router.query.token);
  }, [router.query.token]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/reset-password', { token, newPassword });
      setStatus('Password reset! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (e) {
      setStatus('Reset failed. The link may be invalid or expired.');
    }
  };

  return (
    <div className="auth">
      <h1>Reset Password</h1>
      <form onSubmit={submit}>
        <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button type="submit">Reset</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}