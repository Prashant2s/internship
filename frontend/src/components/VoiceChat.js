import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

export default function VoiceChat({ socket, mode, roomKey, selfId }) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [peers, setPeers] = useState({}); // userId -> RTCPeerConnection
  const [peerStreams, setPeerStreams] = useState({}); // userId -> MediaStream
  const [peerNames, setPeerNames] = useState({}); // userId -> username
  const [audioLevels, setAudioLevels] = useState({}); // userId -> audio level (0-100)
  const [connectionStates, setConnectionStates] = useState({}); // userId -> 'connecting' | 'connected' | 'failed'
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const pcConfig = useMemo(() => ({
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] },
    ],
  }), []);

  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback(() => {
    if (!localStreamRef.current) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(localStreamRef.current);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    
    source.connect(analyser);
    analyserRef.current = analyser;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      const level = Math.min(100, Math.floor((average / 128) * 100));
      
      setAudioLevels(prev => ({ ...prev, [selfId]: level }));
      
      if (joined) {
        animationRef.current = requestAnimationFrame(checkAudioLevel);
      }
    };
    
    checkAudioLevel();
  }, [joined, selfId]);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
  }, []);

  // Join/leave lifecycle
  useEffect(() => {
    if (!socket) return;

    const onPeers = (list) => {
      // List should contain {userId, username} objects
      list.forEach((peer) => {
        if (typeof peer === 'object') {
          setPeerNames(prev => ({ ...prev, [peer.userId]: peer.username }));
          ensurePeer(peer.userId, true);
        } else {
          // Fallback for backward compatibility
          ensurePeer(peer, true);
        }
      });
    };
    
    const onUserJoined = ({ userId, username }) => {
      setPeerNames(prev => ({ ...prev, [userId]: username || 'User' }));
      setConnectionStates(prev => ({ ...prev, [userId]: 'connecting' }));
      ensurePeer(userId, true);
    };
    
    const onUserLeft = ({ userId }) => {
      removePeer(userId);
      setPeerNames(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setConnectionStates(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    };

    const onOffer = async ({ fromUserId, sdp }) => {
      const pc = await ensurePeer(fromUserId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      // Add local stream tracks if not already
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          if (!pc.getSenders().some((s) => s.track === t)) pc.addTrack(t, localStreamRef.current);
        });
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice_answer', { toUserId: fromUserId, sdp: pc.localDescription });
    };

    const onAnswer = async ({ fromUserId, sdp }) => {
      const pc = peers[fromUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const onIce = async ({ fromUserId, candidate }) => {
      const pc = peers[fromUserId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      }
    };

    socket.on('voice_peers', onPeers);
    socket.on('voice_user_joined', onUserJoined);
    socket.on('voice_user_left', onUserLeft);
    socket.on('voice_offer', onOffer);
    socket.on('voice_answer', onAnswer);
    socket.on('voice_ice_candidate', onIce);

    return () => {
      socket.off('voice_peers', onPeers);
      socket.off('voice_user_joined', onUserJoined);
      socket.off('voice_user_left', onUserLeft);
      socket.off('voice_offer', onOffer);
      socket.off('voice_answer', onAnswer);
      socket.off('voice_ice_candidate', onIce);
    };
  }, [socket, peers]);

  async function startVoice() {
    if (joined) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      localStreamRef.current = stream;
      setJoined(true);
      socket.emit('voice_join', { roomType: mode, roomKey });
      startAudioLevelMonitoring();
      
      // Play join sound
      const audio = new Audio('data:audio/wav;base64,UklGRkYBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSIBAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      console.error('Microphone error:', e);
      alert('Microphone permission denied or unavailable. Please check your browser settings.');
    }
  }

  function stopVoice() {
    socket.emit('voice_leave', { roomType: mode, roomKey });
    setJoined(false);
    setMuted(false);
    setDeafened(false);
    
    // Stop audio monitoring
    stopAudioLevelMonitoring();
    
    // Stop tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close peers
    Object.values(peers).forEach((pc) => pc.close());
    setPeers({});
    setPeerStreams({});
    setPeerNames({});
    setAudioLevels({});
    setConnectionStates({});
    
    // Play leave sound
    const audio = new Audio('data:audio/wav;base64,UklGRkYBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSIBAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA');
    audio.volume = 0.2;
    audio.playbackRate = 0.8;
    audio.play().catch(() => {});
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
    }
    // If muting, also stop audio level monitoring to save resources
    if (next) {
      setAudioLevels(prev => ({ ...prev, [selfId]: 0 }));
    }
  }

  function toggleDeafen() {
    const next = !deafened;
    setDeafened(next);
    
    // When deafening, also mute
    if (next && !muted) {
      toggleMute();
    }
    
    // Mute/unmute all peer audio
    Object.entries(peerStreams).forEach(([userId, stream]) => {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !next;
      });
    });
  }

  async function ensurePeer(userId, isInitiator) {
    if (userId === selfId) return null;
    if (peers[userId]) return peers[userId];

    const pc = new RTCPeerConnection(pcConfig);

    // Outbound local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('voice_ice_candidate', { toUserId: userId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setPeerStreams((prev) => ({ ...prev, [userId]: stream }));
    };

    pc.onconnectionstatechange = () => {
      setConnectionStates(prev => ({ ...prev, [userId]: pc.connectionState }));
      
      if (pc.connectionState === 'connected') {
        // Play connection sound
        const audio = new Audio('data:audio/wav;base64,UklGRkYBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSIBAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA');
        audio.volume = 0.1;
        audio.playbackRate = 1.5;
        audio.play().catch(() => {});
      }
      
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removePeer(userId);
      }
    };

    setPeers((prev) => ({ ...prev, [userId]: pc }));

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('voice_offer', { toUserId: userId, sdp: pc.localDescription });
    }

    return pc;
  }

  function removePeer(userId) {
    const pc = peers[userId];
    if (pc) {
      try { pc.close(); } catch {}
    }
    setPeers((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
    setPeerStreams((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  }

  return (
    <div className="voice-chat">
      <div className="voice-status">
        {joined ? (
          <div className="voice-active">
            <span className="voice-indicator active"></span>
            <span className="voice-text">Voice Connected</span>
          </div>
        ) : (
          <div className="voice-inactive">
            <span className="voice-indicator"></span>
            <span className="voice-text">Voice Available</span>
          </div>
        )}
      </div>

      <div className="voice-controls">
        {!joined ? (
          <button className="btn-voice-join" onClick={startVoice} title="Join Voice Channel">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
            </svg>
            <span>Join Voice</span>
          </button>
        ) : (
          <div className="voice-controls-active">
            <button 
              className={`btn-voice-control ${muted ? 'muted' : ''}`} 
              onClick={toggleMute} 
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 01-3 3 1 1 0 000 2v1a5 5 0 0010 0 1 1 0 10-2 0 3 3 0 01-6 0v-1a1 1 0 000-2 3 3 0 01-3-3V4z" clipRule="evenodd"/>
                  <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14z"/>
                </svg>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
            
            <button 
              className={`btn-voice-control ${deafened ? 'deafened' : ''}`} 
              onClick={toggleDeafen} 
              title={deafened ? 'Undeafen' : 'Deafen'}
            >
              {deafened ? (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z"/>
                  <path d="M12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"/>
                </svg>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.086 7.5l-1.429-1.429a1 1 0 010-1.414zm-2.829 3.535a1 1 0 011.414 0l1 1a1 1 0 010 1.414l-1 1a1 1 0 11-1.414-1.414l.293-.293-.293-.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
            
            <button className="btn-voice-leave" onClick={stopVoice} title="Leave Voice Channel">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {joined && (
        <div className="voice-participants">
          {/* Current user */}
          <div className="voice-participant self">
            <div className={`participant-avatar ${audioLevels[selfId] > 10 ? 'speaking' : ''} ${muted ? 'muted' : ''}`}>
              <span className="avatar-text">You</span>
              {audioLevels[selfId] > 0 && !muted && (
                <div className="audio-level" style={{ height: `${Math.min(100, audioLevels[selfId])}%` }}></div>
              )}
            </div>
            <div className="participant-info">
              <span className="participant-name">You</span>
              <span className="participant-status">
                {muted && 'Muted'}
                {deafened && ' • Deafened'}
              </span>
            </div>
          </div>

          {/* Other participants */}
          {Object.entries(peerNames).map(([userId, username]) => (
            <div key={userId} className="voice-participant">
              <div className={`participant-avatar ${audioLevels[userId] > 10 ? 'speaking' : ''}`}>
                <span className="avatar-text">{username?.charAt(0)?.toUpperCase() || '?'}</span>
                {audioLevels[userId] > 0 && (
                  <div className="audio-level" style={{ height: `${Math.min(100, audioLevels[userId])}%` }}></div>
                )}
              </div>
              <div className="participant-info">
                <span className="participant-name">{username || 'User'}</span>
                <span className="participant-status">
                  {connectionStates[userId] === 'connecting' && '🔄 Connecting...'}
                  {connectionStates[userId] === 'connected' && '✅ Connected'}
                  {connectionStates[userId] === 'failed' && '❌ Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden audio elements for peer streams */}
      <div style={{ display: 'none' }}>
        {Object.entries(peerStreams).map(([uid, stream]) => (
          <audio 
            key={uid} 
            autoPlay 
            playsInline 
            ref={(el) => { 
              if (el && stream) {
                el.srcObject = stream;
                el.volume = deafened ? 0 : 1;
              }
            }} 
          />
        ))}
      </div>
    </div>
  );
}