import React, { useState } from 'react';
import ChatWindow from '../sub-components/ChatWindow';
import '../../../styles/patientDashboard.css';

const MessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState(1);

  const conversations = [
    { id: 1, name: 'Dr. Sara Salem', lastMessage: 'Please take the medication as prescribed.', avatar: '1' },
    { id: 2, name: 'Dr. Ahmed Ali', lastMessage: 'Your appointment is confirmed for tomorrow.', avatar: '2' },
    { id: 3, name: 'Lab Support', lastMessage: 'Your results are now available.', avatar: '3' },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Messages</h1>
        <p>Communicate directly with your healthcare providers.</p>
      </div>

      <div className="messages-layout">
        <div className="conversation-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedConversation === conv.id ? 'active' : ''}`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <img src={`https://i.pravatar.cc/150?img=${conv.avatar}`} alt={conv.name} />
              <div className="details">
                <div className="name">{conv.name}</div>
                <div className="last-message">{conv.lastMessage}</div>
              </div>
            </div>
          ))}
        </div>
        <ChatWindow conversation={conversations.find(c => c.id === selectedConversation)} />
      </div>
    </>
  );
};

export default MessagesPage;