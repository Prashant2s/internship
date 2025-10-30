import { useState } from 'react';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setDone(true);
    } catch {
      setDone(true);
    }
  };

  return (
    <div className="auth">
      <h1>Forgot Password</h1>
      {done ? (
        <p>If that email exists, you will receive a reset link shortly.</p>
      ) : (
        <form onSubmit={submit}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit">Send reset link</button>
        </form>
      )}
    </div>
  );
}