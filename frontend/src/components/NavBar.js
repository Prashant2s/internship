import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <div className="brand"><Link href="/">LFG Chat</Link></div>
      <div>
        {user ? (
          <>
            {user.role === 'admin' && (
              <>
                <Link href="/admin">Admin</Link>
                <span> · </span>
              </>
            )}
            <span>Hi, {user.username}</span>
            <span> · </span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <span> · </span>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
