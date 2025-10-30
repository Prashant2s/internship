import { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const VoiceChat = dynamic(() => import('./VoiceChat'), { ssr: false });

export default function ChatRoom({ mode, roomKey }) {
  const { user, token, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [groupName, setGroupName] = useState('');
  const bottomRef = useRef(null);

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  const isGame = mode === 'game';

  useEffect(() => {
    if (!token) return;
    const s = io(socketUrl, { auth: { token } });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [token, socketUrl]);

  useEffect(() => {
    if (!socket || !roomKey) return;

    const fetchHistory = async () => {
      try {
        if (isGame) {
          const { data } = await axios.get(`/api/rooms/${roomKey}/messages`);
          setMessages(data.messages || []);
        } else {
          const { data } = await axios.get(`/api/groups/${roomKey}/messages`);
          setMessages(data.messages || []);
        }
      } catch {}
    };
    fetchHistory();

    socket.emit('join_room', { roomType: mode, roomKey });

    socket.on('room_history', ({ roomType, roomKey: key, messages: hist }) => {
      if (roomType === mode && key === roomKey) setMessages(hist);
    });
    socket.on('room_users', (list) => setUsers(list));
    socket.on('user_joined', () => {});
    socket.on('user_left', () => {});
    socket.on('new_message', (msg) => {
      const match = msg.roomType === mode && msg.roomKey === (isGame ? roomKey : roomKey);
      if (match) setMessages((prev) => [...prev, msg]);
    });
    socket.on('typing', ({ userId, username, isTyping }) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: isTyping ? username : undefined }));
    });

    return () => {
      socket.emit('leave_room', { roomType: mode, roomKey });
      socket.off('room_history');
      socket.off('room_users');
      socket.off('new_message');
      socket.off('typing');
    };
  }, [socket, roomKey, mode, isGame]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="auth-guard">
        <p>You must be logged in.</p>
        <Link href="/login">Login</Link>
      </div>
    );
  }

  const send = () => {
    if (!input.trim()) return;
    socket.emit('send_message', { roomType: mode, roomKey, content: input });
    setInput('');
  };

  const typing = (isTyping) => {
    socket.emit('typing', { roomType: mode, roomKey, isTyping });
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    const { data } = await axios.post('/api/groups', { name: groupName, gameSlug: isGame ? roomKey : 'general' });
    setGroupName('');
    window.location.href = `/groups/${data.group._id}`;
  };

  return (
    <div className="chat-room">
      <header className="chat-header">
        <div className="header-left">
          <div className="room-info">
            <h2 className="room-title">{isGame ? `#${roomKey}` : `Group`}</h2>
            <div className="room-status">
              <span className="status-dot"></span>
              <span className="online-count">{users.length} online</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="welcome-message">
            <span className="welcome-text">Welcome,</span>
            <span className="username-display">{user.username || user.email}</span>
          </div>
          <button className="btn-icon" title="Settings">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
          </button>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </header>
      
      <div className="chat-body">
        <aside className="chat-sidebar">
          <div className="sidebar-panel">
            <h4 className="panel-title">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{marginRight: '8px'}}>
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              Create Group
            </h4>
            <form onSubmit={createGroup} className="group-form">
              <input 
                className="input-modern" 
                placeholder="Group name" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)} 
              />
              <button type="submit" className="btn-primary">Create</button>
            </form>
          </div>
          
          <div className="sidebar-panel">
            <h4 className="panel-title">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{marginRight: '8px'}}>
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
              </svg>
              {user.username || user.email || 'User'}
            </h4>
            <div className="current-user-info">
              <div className="user-item current-user">
                <span className="user-avatar user-avatar-large">{(user.username || user.email || 'U').charAt(0).toUpperCase()}</span>
                <div className="user-details">
                  <span className="user-name">{user.username || user.email}</span>
                  <span className="user-status-text">Online</span>
                </div>
              </div>
            </div>
            <h5 className="sub-title">Other Users ({users.length - 1})</h5>
            <ul className="users-list">
              {users.filter(u => u !== user.username && u !== user.email).map((u) => (
                <li key={u} className="user-item">
                  <span className="user-avatar">{u.charAt(0).toUpperCase()}</span>
                  <span className="user-name">{u}</span>
                  <span className="user-status"></span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="sidebar-panel">
            <h4 className="panel-title">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{marginRight: '8px'}}>
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
              </svg>
              Voice Chat
            </h4>
            {socket && user && (
              <VoiceChat socket={socket} mode={mode} roomKey={roomKey} selfId={user.id || user._id} />
            )}
          </div>
        </aside>
        
        <section className="chat-main">
          <div className="messages-container">
            {messages.map((m) => (
              <div key={m._id || m.createdAt + m.senderId} className="message">
                <div className="message-avatar">
                  {m.senderName.charAt(0).toUpperCase()}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <strong className="message-sender">{m.senderName}</strong>
                    <span className="message-time">{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="message-text">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          
          <div className="typing-indicator">
            {Object.values(typingUsers)
              .filter(Boolean)
              .slice(0, 3)
              .map((name, i) => (
                <span key={i} className="typing-text">
                  <span className="typing-dots">
                    <span></span><span></span><span></span>
                  </span>
                  {name} is typing
                </span>
              ))}
          </div>
          
          <div className="message-composer">
            <input
              className="composer-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => typing(true)}
              onBlur={() => typing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Type a message..."
            />
            <button className="btn-send" onClick={send}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
