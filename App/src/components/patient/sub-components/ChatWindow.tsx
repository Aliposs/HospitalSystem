import React, { useState } from 'react';
import '../../../styles/patientDashboard.css';

interface Conversation {
  id: number;
  name: string;
}

interface ChatWindowProps {
  conversation?: Conversation;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello, how can I help you today?', sender: 'doctor' },
    { id: 2, text: 'I wanted to ask about my test results.', sender: 'patient' },
    { id: 3, text: 'Of course. Which results are you referring to?', sender: 'doctor' },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: message, sender: 'patient' }]);
      setMessage('');
    }
  };

  if (!conversation) {
    return (
      <div className="chat-window" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--muted-text)' }}>
        Select a conversation to start messaging.
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">{conversation.name}</div>
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender === 'patient' ? 'sent' : 'received'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage} className="btn btn-primary">Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;