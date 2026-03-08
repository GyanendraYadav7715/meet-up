import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Settings, MonitorUp, MessageSquare, Disc, Download } from 'lucide-react';
import Chat from './Chat';
import './MeetingRoom.css';

// Socket connection
const socket = io('http://localhost:5000');

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video playsInline autoPlay ref={ref} className="peer-video" />;
};

export default function MeetingRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const mediaRecorderRef = useRef(null);
  
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    let myStream = null;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(currentStream => {
      setStream(currentStream);
      myStream = currentStream;
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }

      // 1. Join the room using socket ID
      socket.emit('join-room', roomId, socket.id);

      // 2. Someone connected, create a peer and call them
      socket.on('user-connected', userId => {
        const peer = createPeer(userId, socket.id, currentStream);
        peersRef.current.push({
          peerID: userId,
          peer,
        });
        setPeers(users => [...users, { peerID: userId, peer }]);
      });

      // 3. User joined (we are receiving a call)
      socket.on('user-joined', payload => {
        const peer = addPeer(payload.signal, payload.callerID, currentStream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });

        setPeers(users => [...users, { peerID: payload.callerID, peer }]);
      });

      // 4. Call accepted, hook up the stream
      socket.on('receiving-returned-signal', payload => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });

      // 5. Handle Disconnects
      socket.on('user-disconnected', userId => {
        const peerObj = peersRef.current.find(p => p.peerID === userId);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        const newPeers = peersRef.current.filter(p => p.peerID !== userId);
        peersRef.current = newPeers;
        setPeers(newPeers);
      });
    }).catch(err => {
      console.error("Failed to get local stream", err);
    });

    return () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      socket.emit('leave-room', roomId, socket.id);
      socket.off('user-connected');
      socket.off('user-joined');
      socket.off('receiving-returned-signal');
      socket.off('user-disconnected');
    };
  }, [roomId]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('sending-signal', { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('returning-signal', { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsMuted(!stream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoOff(!stream.getVideoTracks()[0].enabled);
    }
  };

  const shareScreen = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        // Replace video track for all peers
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        const oldVideoTrack = stream.getVideoTracks()[0];
        
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(oldVideoTrack, screenVideoTrack, stream);
        });
        
        // Update local video
        userVideo.current.srcObject = screenStream;
        setIsScreenSharing(true);

        // Listen for user stopping screen share from browser built-in UI
        screenVideoTrack.onended = () => {
          stopScreenShare(oldVideoTrack);
        };
      } catch (err) {
        console.error("Failed to share screen", err);
      }
    } else {
      // Revert back to camera
      const oldVideoTrack = stream.getVideoTracks()[0];
      stopScreenShare(oldVideoTrack);
    }
  };

  const stopScreenShare = (oldVideoTrack) => {
    if (userVideo.current.srcObject) {
       userVideo.current.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // Replace track back to camera for all peers
    peersRef.current.forEach(({ peer }) => {
      // Find the screen track and replace it
      const currentVideoTrack = peer.streams[0].getVideoTracks()[0] || null;
      if (currentVideoTrack) {
         peer.replaceTrack(currentVideoTrack, oldVideoTrack, stream);
      }
    });

    // Reattach local camera stream
    userVideo.current.srcObject = stream;
    setIsScreenSharing(false);
  };

  const handleStartCaptureClick = React.useCallback(() => {
    if (!stream) return;
    setRecordedChunks([]);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm"
    });

    mediaRecorder.ondataavailable = React.useCallback(
      (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => prev.concat(e.data));
        }
      },
      [setRecordedChunks]
    );

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  }, [stream, setIsRecording, setRecordedChunks]);

  const handleStopCaptureClick = React.useCallback(() => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  }, [mediaRecorderRef, setIsRecording]);

  const handleDownload = React.useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: "video/webm"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = url;
      a.download = `meeting-recording-${roomId}.webm`;
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks, roomId]);


  const declineMeeting = () => {
    socket.emit('leave-room');
    navigate('/');
  };

  return (
    <div className={`meeting-page ${isChatOpen ? 'chat-open' : ''}`}>
      <div className="meeting-header">
        <div className="meeting-info">
          <h2>Meeting ID: {roomId}</h2>
          {isRecording && <div className="recording-indicator" style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ea4335', fontSize: '14px', background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ea4335', animation: 'pulse 1.5s infinite' }}></div> Recording</div>}
        </div>
      </div>
      
      <div className="meeting-main-area">
        <div className="video-grid">
          <div className="video-wrapper outline-active">
             {/* Do not mirror video if we are screen sharing! */}
            <video muted ref={userVideo} autoPlay playsInline className={`my-video ${isScreenSharing ? 'no-mirror' : ''}`} />
            <div className="video-label">{isScreenSharing ? 'Your Presentation' : 'You'}</div>
          </div>
          
          {peers.map((peer) => {
            return (
              <div className="video-wrapper" key={peer.peerID}>
                <Video peer={peer.peer} />
                <div className="video-label">Participant</div>
              </div>
            );
          })}
        </div>
        
        <Chat 
          socket={socket} 
          roomId={roomId} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      </div>

      <div className="bottom-bar">
        <div className="controls-left">
           <span className="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {roomId}</span>
        </div>
        
        <div className="controls-center">
          <button 
            className={`control-btn ${isMuted ? 'danger' : ''}`}
            onClick={toggleAudio}
            title={isMuted ? "Turn on microphone" : "Turn off microphone"}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            className={`control-btn ${isVideoOff ? 'danger' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
          </button>

          <button 
            className={`control-btn ${isScreenSharing ? 'active-feature' : ''}`}
            onClick={shareScreen}
            title={isScreenSharing ? "Stop presenting" : "Present now"}
          >
            <MonitorUp size={24} />
          </button>
          
          <button className="control-btn call-end" onClick={declineMeeting} title="Leave call">
            <PhoneOff size={24} />
          </button>
        </div>

        <div className="controls-right" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
          {recordedChunks.length > 0 && !isRecording && (
            <button className="control-btn settings" onClick={handleDownload} title="Download Recording">
              <Download size={24} color="#34a853" />
            </button>
          )}
          <button 
            className={`control-btn settings ${isRecording ? 'active-feature-text' : ''}`}
            onClick={isRecording ? handleStopCaptureClick : handleStartCaptureClick}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
           {isRecording ? <Disc size={24} color="#ea4335" /> : <Disc size={24} />}
          </button>
          <button 
            className={`control-btn settings ${isChatOpen ? 'active-feature-text' : ''}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
            title="Chat with everyone"
          >
            <MessageSquare size={24} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
