import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Settings, MonitorUp, MessageSquare, Disc, Download } from 'lucide-react';
import Chat from './Chat';
import { useWebRTCOptimized } from './hooks/useWebRTCOptimized';
import { useMeeting } from './hooks/useMeeting';
import TranscriptionComponent from './TranscriptionComponent';
import './MeetingRoom.css';

// Socket connection
const socket = io('http://localhost:5000');

const Video = React.memo(({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video playsInline autoPlay ref={ref} className="peer-video" />;
});

export default function MeetingRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const [stream, setStream] = useState();
  const { peers, isSFUMode, setPeers, peersRef } = useWebRTCOptimized(socket, roomId, stream);
  
  // Custom Redux Hook Integration
  const { 
      isMuted, toggleMute,
      isVideoOff, toggleVideo,
      isScreenSharing, setScreenSharing,
      isChatOpen, toggleChat,
      isCaptionsEnabled, toggleCaptions,
      isRecording, setRecordingStatus,
      sfuParticipants, addSfuParticipant,
      leaveMeeting
  } = useMeeting();

  const [captions, setCaptions] = useState([]); // High-frequency state stays local
  const [meetingNotes, setMeetingNotes] = useState([]); // High-frequency state stays local
  const captionTimeoutRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const mediaRecorderRef = useRef(null);
  
  const userVideo = useRef();
  const mediaSources = useRef({}); // storing { mediaSource, sourceBuffer: SourceBuffer }

  useEffect(() => {
    let myStream = null;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(currentStream => {
      setStream(currentStream);
      myStream = currentStream;
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    }).catch(err => {
      console.error("Failed to get local stream", err);
    });

    return () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // SFU Simulation logic for displaying relayed media chunks
  useEffect(() => {
    if (!isSFUMode) return;

    const handleRelayedMedia = (payload) => {
      addSfuParticipant(payload.senderId);
    };

    socket.on('relayed-media', handleRelayedMedia);

    return () => {
      socket.off('relayed-media', handleRelayedMedia);
    };
  }, [isSFUMode, addSfuParticipant]);

  // Handle Incoming Captions
  useEffect(() => {
    const handleCaption = (payload) => {
        // payload: { text, senderName, language, isFinal, timestamp }
        setCaptions([{ ...payload }]); // For MVP we replace the single active caption line for simplicity
        
        // Append to meeting notes
        if (payload.isFinal) {
             setMeetingNotes(prev => [...prev, payload]);
        }

        // Clear caption after 5s of silence
        if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
        captionTimeoutRef.current = setTimeout(() => {
             setCaptions([]);
        }, 5000);
    };

    socket.on('receive-caption', handleCaption);
    return () => socket.off('receive-caption', handleCaption);
  }, []);

  const handleToggleAudio = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      toggleMute();
    }
  };

  const handleToggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      toggleVideo();
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
        setScreenSharing(true);

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
    setScreenSharing(false);
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
    setRecordingStatus(true);
  }, [stream, setRecordingStatus, setRecordedChunks]);

  const handleStopCaptureClick = React.useCallback(() => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setRecordingStatus(false);
    }
  }, [mediaRecorderRef, setRecordingStatus]);

  const handleDownload = React.useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-recording-${roomId}.webm`;
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks, roomId]);

  const exportNotes = async () => {
    if (meetingNotes.length === 0) {
        alert("No transcript yet to save.");
        return;
    }
    try {
        const token = localStorage.getItem('token'); // Simplistic token grab for MVP
        await fetch(`http://localhost:5000/api/meetings/${roomId}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notes: meetingNotes })
        });
        alert('Meeting notes exported to MongoDB successfully!');
    } catch(err) {
        console.error('Failed to export notes', err);
        alert('Failed to export notes.');
    }
  };


  const declineMeeting = () => {
    socket.emit('leave-room');
    leaveMeeting(); 
    navigate('/');
  };

  return (
    <div className={`meeting-page ${isChatOpen ? 'chat-open' : ''}`}>
      <div className="meeting-header" role="banner">
        <div className="meeting-info">
          <h2 aria-label={`Meeting ID: ${roomId}`}>Meeting ID: {roomId}</h2>
          {isSFUMode && <span className="sfu-badge" role="status" aria-live="polite" style={{ marginLeft: '12px', padding: '4px 8px', background: '#e3f2fd', color: '#1565c0', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>SFU Mode Active</span>}
          {isRecording && <div className="recording-indicator" role="status" aria-live="polite" style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ea4335', fontSize: '14px', background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '6px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ea4335', animation: 'pulse 1.5s infinite' }}></div> Recording</div>}
        </div>
      </div>
      
      <div className="meeting-main-area" role="main" aria-label="Meeting Video Grid">
        <div className="video-grid">
          <div className="video-wrapper outline-active">
             {/* Do not mirror video if we are screen sharing! */}
            <video muted ref={userVideo} autoPlay playsInline className={`my-video ${isScreenSharing ? 'no-mirror' : ''}`} />
            <div className="video-label">{isScreenSharing ? 'Your Presentation' : 'You'}</div>
          </div>
          
          {isSFUMode ? (
            // Render SFU placeholders or relayed video tags
            sfuParticipants.map((senderId) => (
              <div className="video-wrapper" key={senderId}>
                <div className="sfu-placeholder" style={{ background: '#333', height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  Receiving SFU Feed...
                </div>
                <div className="video-label">Relayed Participant</div>
              </div>
            ))
          ) : (
            // Render P2P Mesh Video components
            peers.map((peer) => {
              return (
                <div className="video-wrapper" key={peer.peerID}>
                  <Video peer={peer.peer} />
                  <div className="video-label">Participant</div>
                </div>
              );
            })
          )}
        </div>

        {/* Captions Overlay */}
        {isCaptionsEnabled && captions.length > 0 && (
           <div className="captions-overlay" aria-live="polite" style={{ position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px 20px', borderRadius: '8px', zIndex: 10, fontSize: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '300px', textAlign: 'center' }}>
               {captions.map((cap, i) => (
                  <div key={i}><strong>{cap.senderName}:</strong> {cap.text}</div>
               ))}
           </div>
        )}

        {isCaptionsEnabled && (
           <TranscriptionComponent 
               socket={socket} 
               isMuted={isMuted} 
               language="en-US" // Hardcoded to EN for MVP
               userName={`User_${roomId.substring(0,4)}`} // Stubbed username
           />
        )}
        
        <Chat 
          socket={socket} 
          roomId={roomId} 
          isOpen={isChatOpen} 
          onClose={toggleChat} 
        />
      </div>

      <div className="bottom-bar" role="toolbar" aria-label="Meeting controls">
        <div className="controls-left">
           <span className="time" aria-hidden="true">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {roomId}</span>
        </div>
        
        <div className="controls-center">
          <button 
            className={`control-btn ${isMuted ? 'danger' : ''}`}
            onClick={handleToggleAudio}
            title={isMuted ? "Turn on microphone" : "Turn off microphone"}
            aria-label={isMuted ? "Turn on microphone" : "Turn off microphone"}
            aria-pressed={!isMuted}
          >
            {isMuted ? <MicOff size={24} aria-hidden="true" /> : <Mic size={24} aria-hidden="true" />}
          </button>
          
          <button 
            className={`control-btn ${isVideoOff ? 'danger' : ''}`}
            onClick={handleToggleVideo}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            aria-label={isVideoOff ? "Turn on camera" : "Turn off camera"}
            aria-pressed={!isVideoOff}
          >
            {isVideoOff ? <VideoOff size={24} aria-hidden="true" /> : <VideoIcon size={24} aria-hidden="true" />}
          </button>

          <button 
            className={`control-btn ${isScreenSharing ? 'active-feature' : ''}`}
            onClick={shareScreen}
            title={isScreenSharing ? "Stop presenting" : "Present now"}
            aria-label={isScreenSharing ? "Stop presenting" : "Present now"}
            aria-pressed={isScreenSharing}
          >
            <MonitorUp size={24} aria-hidden="true" />
          </button>
          
          <button className="control-btn call-end" onClick={declineMeeting} title="Leave call" aria-label="Leave call">
            <PhoneOff size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="controls-right" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
          {meetingNotes.length > 0 && (
             <button className="control-btn settings" onClick={exportNotes} title="Export Captions to MongoDB" aria-label="Export Captions">
                 <Download size={24} color="#fbbc04" aria-hidden="true" />
             </button>
          )}

          <button 
             className={`control-btn settings ${isCaptionsEnabled ? 'active-feature-text' : ''}`}
             onClick={toggleCaptions}
             title="Toggle CC"
             aria-label="Toggle Live Captions"
             aria-pressed={isCaptionsEnabled}
          >
             <div style={{ fontSize: '14px', fontWeight: 'bold'}}>CC</div>
          </button>

          {recordedChunks.length > 0 && !isRecording && (
            <button className="control-btn settings" onClick={handleDownload} title="Download Recording" aria-label="Download Recording">
              <Download size={24} color="#34a853" aria-hidden="true" />
            </button>
          )}
          {/* GDPR Context: Users must be informed if recorded. Local recording drops file entirely on client's machine, keeping data retention out of our servers. */}
          <button 
            className={`control-btn settings ${isRecording ? 'active-feature-text' : ''}`}
            onClick={isRecording ? handleStopCaptureClick : handleStartCaptureClick}
            title={isRecording ? "Stop Recording" : "Start Recording"}
            aria-label={isRecording ? "Stop Recording" : "Start Recording"}
            aria-pressed={isRecording}
          >
           {isRecording ? <Disc size={24} color="#ea4335" aria-hidden="true" /> : <Disc size={24} aria-hidden="true" />}
          </button>
          <button 
            className={`control-btn settings ${isChatOpen ? 'active-feature-text' : ''}`}
            onClick={toggleChat}
            title="Chat with everyone"
            aria-label="Toggle Chat"
            aria-expanded={isChatOpen}
          >
            <MessageSquare size={24} aria-hidden="true" />
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
