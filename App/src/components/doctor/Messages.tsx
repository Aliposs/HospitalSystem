import React, { useState } from 'react';
import '../../styles/messages.css';

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');
  
  const chatList = [
    { 
      id: 1, 
      name: 'Sarah Johnson', 
      lastMessage: 'Thank you for the prescription, doctor.', 
      time: '10:30 AM',
      unread: 2,
      avatar: 'SJ'
    },
    { 
      id: 2, 
      name: 'Michael Brown', 
      lastMessage: 'Is it possible to reschedule my appointment?', 
      time: 'Yesterday',
      unread: 0,
      avatar: 'MB'
    },
    { 
      id: 3, 
      name: 'Emily Davis', 
      lastMessage: 'I\'ve uploaded my lab results.', 
      time: '2 days ago',
      unread: 1,
      avatar: 'ED'
    },
    { 
      id: 4, 
      name: 'Robert Wilson', 
      lastMessage: 'The medication is working well, thank you.', 
      time: '3 days ago',
      unread: 0,
      avatar: 'RW'
    },
  ];

  const messages = [
    { id: 1, sender: 'patient', text: 'Hello doctor, I have a question about my medication.', time: '10:15 AM' },
    { id: 2, sender: 'doctor', text: 'Hello Sarah! I\'d be happy to help. What\'s your question?', time: '10:20 AM' },
    { id: 3, sender: 'patient', text: 'I\'ve been experiencing some mild side effects. Is this normal?', time: '10:25 AM' },
    { id: 4, sender: 'doctor', text: 'Some mild side effects can be normal, especially during the first week. Which symptoms are you experiencing?', time: '10:28 AM' },
    { id: 5, sender: 'patient', text: 'Mostly just some nausea and slight dizziness. Nothing too severe.', time: '10:30 AM' },
    { id: 6, sender: 'patient', text: 'Thank you for the prescription, doctor.', time: '10:30 AM' },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message to the backend
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedChatData = chatList.find(chat => chat.id === selectedChat);

  return (
    <div className="messages-module">
      <div className="module-header">
        <h1>Messages</h1>
      </div>
      
      <div className="chat-container">
        <div className="chat-list">
          <div className="search-box">
            <input type="text" placeholder="Search conversations..." />
            <button className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
          
          <div className="chat-items">
            {chatList.map(chat => (
              <div 
                key={chat.id}
                className={`chat-item ${selectedChat === chat.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat.id)}
              >
                <div className="chat-avatar">{chat.avatar}</div>
                <div className="chat-info">
                  <div className="chat-header">
                    <span className="chat-name">{chat.name}</span>
                    <span className="chat-time">{chat.time}</span>
                  </div>
                  <div className="chat-preview">
                    <span className="last-message">{chat.lastMessage}</span>
                    {chat.unread > 0 && (
                      <span className="unread-badge">{chat.unread}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {selectedChat ? (
          <div className="conversation">
            <div className="conversation-header">
              <div className="chat-avatar">{selectedChatData?.avatar}</div>
              <div className="chat-info">
                <h3>{selectedChatData?.name}</h3>
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
              {messages.map(message => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    <p>{message.text}</p>
                    <span className="message-time">{message.time}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="message-input-container">
              <button className="attach-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="message-input"
              />
              <button className="send-button" onClick={handleSendMessage}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;