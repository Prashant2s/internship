import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const token = router.query.token;
    if (!token) return;
    const run = async () => {
      try {
        await axios.post('/api/auth/verify-email', { token });
        setStatus('Email verified! Redirecting...');
        setTimeout(() => router.push('/'), 1500);
      } catch (e) {
        setStatus('Invalid or expired link.');
      }
    };
    run();
  }, [router.query.token]);

  return (
    <div className="auth">
      <h1>{status}</h1>
    </div>
  );
}