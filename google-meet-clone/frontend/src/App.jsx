import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Video, Keyboard, Plus } from 'lucide-react'; // Keep these as Home component still uses them
import { useAuth } from './hooks/useAuth'; // Assuming this hook is still used for auth, despite Redux mention
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Lazy loaded feature routes
const MeetingRoom = lazy(() => import('./MeetingRoom'));

function Home() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user, login, registerUser, logout } = useAuth();
  
  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    let success = false;
    if (isLoginView) {
      success = await login(email, password);
    } else {
      success = await registerUser(name, email, password);
    }
    if (success) {
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
      setName('');
    } else {
      alert("Authentication failed.");
    }
  };

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
          {isAuthenticated ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                <button className="btn-text" style={{ cursor: 'pointer' }} onClick={logout}>Logout</button>
             </div>
          ) : (
             <button className="btn-primary" onClick={() => setShowAuthModal(true)}>Sign In</button>
          )}
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

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
           <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '350px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
             <h2 style={{ marginBottom: '20px' }}>{isLoginView ? 'Sign In' : 'Register'}</h2>
             <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {!isLoginView && (
                   <input required type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                )}
                <input required type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                
                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                   {isLoginView ? 'Login' : 'Create Account'}
                </button>
             </form>
             <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
                <span style={{ color: '#1a73e8', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsLoginView(!isLoginView)}>
                   {isLoginView ? 'Sign Up' : 'Log In'}
                </span>
             </div>
             <button className="btn-text" style={{ width: '100%', marginTop: '10px', cursor: 'pointer' }} onClick={() => setShowAuthModal(false)}>Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
}

// The original App component is now wrapped by ErrorBoundary and Suspense
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<div className="loading-screen" style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Loading Application...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:id" element={<MeetingRoom />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
