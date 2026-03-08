import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Video, Keyboard, Plus } from 'lucide-react';
import MeetingRoom from './MeetingRoom';
import './App.css';

function Home() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    }
  };

  const createMeeting = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    navigate(`/room/${newRoomId}`);
  };

  return (
    <div className="home-container">
      <header className="header">
        <div className="logo">
          <Video color="#1a73e8" size={32} />
          <span>Google Meet Clone</span>
        </div>
        <div className="header-right">
          <span className="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="user-avatar">U</div>
        </div>
      </header>

      <main className="main-content">
        <div className="left-panel">
          <h1>Premium video meetings.<br/>Now free for everyone.</h1>
          <p>We re-engineered the service we built for secure business meetings, Google Meet, to make it free and available for all.</p>
          
          <div className="action-buttons">
            <button className="btn-primary" onClick={createMeeting}>
              <Video size={20} />
              New meeting
            </button>
            <div className="join-form">
              <div className="input-with-icon">
                <Keyboard size={20} color="#5f6368" />
                <input 
                  type="text" 
                  placeholder="Enter a code or link"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <button 
                className={`btn-text ${roomId ? 'active' : ''}`}
                onClick={handleJoin}
                disabled={!roomId}
              >
                Join
              </button>
            </div>
          </div>
          <div className="divider"></div>
          <p className="learn-more"><a href="#">Learn more</a> about Google Meet</p>
        </div>
        
        <div className="right-panel">
          <div className="hero-images">
            <img src="https://www.gstatic.com/meet/user_edu_get_a_link_light_90698cd7b4ca04d3005c962a3756c42d.svg" alt="Get a link you can share" />
            <h2>Get a link you can share</h2>
            <p>Click <strong>New meeting</strong> to get a link you can send to people you want to meet with</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:id" element={<MeetingRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
