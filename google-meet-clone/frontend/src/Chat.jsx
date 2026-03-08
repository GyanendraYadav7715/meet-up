import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import './Chat.css';

export default function Chat({ socket, roomId, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const receiveMessage = (message, senderSocketId) => {
      setMessages((prev) => [
        ...prev, 
        { 
          text: message, 
          senderId: senderSocketId, 
          isMe: senderSocketId === socket.id,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    };

    socket.on('receive-message', receiveMessage);

    return () => {
      socket.off('receive-message', receiveMessage);
    };
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('send-message', input.trim(), socket.id);
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-sidebar">
      <div className="chat-header">
        <h3>In-call messages</h3>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="chat-messages">
        <div className="chat-message-notice">
          Messages can only be seen by people in the call and are deleted when the call ends.
        </div>
        
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.isMe ? 'me' : 'other'}`}>
            <div className="message-info">
              <span className="sender">{msg.isMe ? 'You' : `User (${msg.senderId.substring(0,4)})`}</span>
              <span className="time">{msg.time}</span>
            </div>
            <div className={`message-bubble ${msg.isMe ? 'me' : 'other'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={sendMessage}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message to everyone" 
        />
        <button type="submit" disabled={!input.trim()} className={input.trim() ? 'active' : ''}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
