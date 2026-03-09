import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Video, Keyboard, Plus, Menu, HelpCircle, MessageSquare, Settings, Grid, CalendarDays, Link, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { useAuth } from './hooks/useAuth';
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

  // New Meeting Dropdown State
  const [showNewMeetingMenu, setShowNewMeetingMenu] = useState(false);

  const handleJoin = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId}`);
    }
  };

  const createMeeting = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    navigate(`/room/${newRoomId}`);
  };

  const handleDocumentClick = (e) => {
      // Close dropdown if clicked outside
      if (!e.target.closest('.new-meeting-container')) {
          setShowNewMeetingMenu(false);
      }
  };

  React.useEffect(() => {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  return (
    <div className="home-container">
      <header className="header">
        <div className="header-left">
          <button className="icon-btn menu-btn"><Menu size={20} color="#5f6368" /></button>
          <div className="logo">
            <img src="https://www.gstatic.com/meet/google_meet_horizontal_wordmark_2020q4_1x_icon_124_40_2373e79660dabbf194273d27aa7ee1f5.png" alt="Google Meet Logo" style={{ height: '30px' }} />
          </div>
        </div>
        <div className="header-right">
          <span className="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <div className="header-icons">
             <button className="icon-btn"><HelpCircle size={20} color="#5f6368" /></button>
             <button className="icon-btn"><MessageSquare size={20} color="#5f6368" /></button>
             <button className="icon-btn"><Settings size={20} color="#5f6368" /></button>
          </div>
          <div className="header-icons" style={{ marginLeft: '10px' }}>
             <button className="icon-btn"><Grid size={20} color="#5f6368" /></button>
          </div>
          
          {isAuthenticated ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
                <div className="user-avatar" title={user?.email}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                <button className="btn-text" style={{ cursor: 'pointer', padding: '0 8px' }} onClick={logout}>Logout</button>
             </div>
          ) : (
             <button className="btn-primary" style={{ marginLeft: '10px' }} onClick={() => setShowAuthModal(true)}>Sign In</button>
          )}
        </div>
      </header>

      <div className="main-layout">
         <aside className="sidebar">
            <div className="sidebar-item active">
               <CalendarDays size={20} />
               <span>Meetings</span>
            </div>
            <div className="sidebar-item">
               <Video size={20} />
               <span>Calls</span>
            </div>
         </aside>

         <main className="main-content">
            <div className="hero-section">
               <h1>Video calls and meetings for<br/>everyone</h1>
               <p>Connect, collaborate and celebrate from anywhere with<br/>Google Meet</p>
               
               <div className="action-buttons">
                  <div className="new-meeting-container" style={{ position: 'relative' }}>
                     <button className="btn-primary" onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}>
                        <Video size={18} />
                        New meeting
                     </button>
                     
                     {showNewMeetingMenu && (
                        <div className="dropdown-menu">
                           <div className="dropdown-item" onClick={createMeeting}>
                              <Link size={18} color="#5f6368" />
                              <span>Create a meeting for later</span>
                           </div>
                           <div className="dropdown-item" onClick={createMeeting}>
                              <Plus size={18} color="#5f6368" />
                              <span>Start an instant meeting</span>
                           </div>
                           <div className="dropdown-item">
                              <Calendar size={18} color="#5f6368" />
                              <span>Schedule in Google Calendar</span>
                           </div>
                        </div>
                     )}
                  </div>
                  
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

               <div className="carousel-section">
                  <button className="carousel-nav"><ChevronLeft size={20} color="#5f6368" /></button>
                  <div className="carousel-image">
                     <img src="https://www.gstatic.com/meet/user_edu_get_a_link_light_90698cd7b4ca04d3005c962a3756c42d.svg" alt="Meet Illustration" />
                   </div>
                  <button className="carousel-nav"><ChevronRight size={20} color="#5f6368" /></button>
               </div>
            </div>
         </main>
      </div>

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
