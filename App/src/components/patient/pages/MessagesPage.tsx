import React, { useState, useEffect} from 'react';
import ChatWindow from '../sub-components/ChatWindow';
import '../../../styles/messages.css';
import api from '../../../lib/api';

const MessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await api.get('/patient/chats');
        console.log('Patient conversations:', res.data);
        setConversations(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const selectedChatData = conversations.find(conv => conv.id === selectedConversation);

  if (loading) return <div className="loading">Loading messages...</div>;
  if (error) return <div className="error">Error: {error}</div>;

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
            {conversations.length === 0 ? (
              <div className="no-chats">No conversations yet</div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`chat-item ${selectedConversation === conv.id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  {conv.profilePicture ? (
                    <img 
                      src={conv.profilePicture} 
                      alt={conv.name} 
                      className="chat-avatar"
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div className="chat-avatar">{conv.avatar}</div>
                  )}
                  <div className="chat-info">
                    <div className="chat-header">
                      <span className="chat-name">{conv.name}</span>
                      <span className="chat-time">{conv.time}</span>
                    </div>
                    <div className="chat-preview">
                      <span className="last-message">{conv.lastMessage}</span>
                      {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <ChatWindow 
          conversationId={selectedConversation} 
          conversationData={selectedChatData}
        />
      </div>
    </div>
  );
};

export default MessagesPage;