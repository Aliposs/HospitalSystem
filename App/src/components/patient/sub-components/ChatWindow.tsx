import React, { useState, useEffect, useRef } from 'react';
import '../../../styles/messages.css';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

interface ChatWindowProps {
  conversationId?: string | null;
  conversationData?: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, conversationData }) => {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/patient/chats/${conversationId}`);
        setMessages(res.data || []);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        console.error('Messages fetch error:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedAttachment) || !conversationId) return;

    try {
      const formData = new FormData();
      if (message.trim()) {
        formData.append('message_text', message);
      }
      if (selectedAttachment) {
        formData.append('attachment', selectedAttachment);
      }

      await api.post(`/patient/chats/${conversationId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMessage('');
      setSelectedAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      const res = await api.get(`/patient/chats/${conversationId}`);
      setMessages(res.data || []);
    } catch (err){
      alert('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedAttachment(file);
    }
  };

  if (!conversationId) {
    return (
      <div className="no-chat-selected">
        <h3>Select a conversation</h3>
        <p>Choose a conversation from the list to start messaging</p>
      </div>
    );
  }

  return (
    <div className="conversation">
      <div className="conversation-header">
        {conversationData?.profilePicture ? (
          <img 
            src={conversationData.profilePicture} 
            alt={conversationData.name} 
            className="chat-avatar"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div className="chat-avatar">{conversationData?.avatar}</div>
        )}
        <div className="chat-info">
          <h3>{conversationData?.name || 'Doctor'}</h3>
          <span className="online-status">Online</span>
        </div>
        <div className="conversation-actions">
          <button className="action-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </button>
          <button className="action-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.96l4.24 4.24M1 12h6m6 0h6"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`message ${msg.sender_id === user?.id ? 'patient' : 'doctor'}`}
          >
            <div className="message-content">
              {msg.message_text && <p>{msg.message_text}</p>}
              
              {msg.file_path && (
                <div className='message-attachment'>
                  <a href={msg.file_path}
                    target='_blank'
                    rel='noopener noreferrer'
                    download={msg.file_name}
                  >
                    📎 {msg.file_name || 'Attachment'}
                  </a>
                  {msg.file_type?.startsWith('image/') && (
                    <img src={msg.file_path} alt='attachment' style={{maxWidth: '200px', marginTop: '8px', borderRadius: '8px'}} />
                  )}
                </div>
              )}
              
              <span className="message-time">
                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        {selectedAttachment && (
          <div style={{ padding: '8px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px' }}>📎 {selectedAttachment.name}</span>
            <button 
              onClick={() => {
                setSelectedAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
            >
              ✕
            </button>
          </div>
        )}
        <button className="attach-button" onClick={() => fileInputRef.current?.click()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*,.pdf,.doc,.docx,.txt" 
          onChange={handleAttachmentChange}
        />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
        />
        <button 
          className="send-button" 
          onClick={handleSendMessage}
          disabled={(!message.trim() && !selectedAttachment) || !conversationId}
          style={{ 
            opacity: ((!message.trim() && !selectedAttachment) || !conversationId) ? 0.5 : 1,
            cursor: ((!message.trim() && !selectedAttachment) || !conversationId) ? 'not-allowed' : 'pointer'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;