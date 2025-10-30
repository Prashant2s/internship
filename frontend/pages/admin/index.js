import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      setError('Not authorized');
      return;
    }
    const load = async () => {
      try {
        const { data } = await axios.get('/api/admin/users');
        setUsers(data.users || []);
      } catch (e) {
        setError('Failed to load admin data');
      }
    };
    load();
  }, [user]);

  if (!user) return <div className="auth-guard">Loading...</div>;
  if (user.role !== 'admin') return <div className="auth-guard">Not authorized</div>;

  return (
    <div className="admin">
      <h1>Admin Dashboard</h1>
      <h2>Users</h2>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{new Date(u.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}