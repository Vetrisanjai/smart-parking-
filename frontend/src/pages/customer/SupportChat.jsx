import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

export default function SupportChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/messages').then((res) => {
      setMessages(res.data.messages);
      setConversationId(res.data.conversationId);
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', { conversationId });

    const onMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('new_message', onMessage);
    return () => socket.off('new_message', onMessage);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const socket = getSocket();
    const payload = { text: text.trim(), conversationId };
    setText('');

    if (socket) {
      socket.emit('send_message', payload);
    } else {
      const { data } = await api.post('/messages', { text: payload.text });
      setMessages((m) => [...m, data]);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1>Support Chat</h1>
        <p>Chat with admin in real time</p>
      </header>

      <div className="chat-panel card">
        <div className="chat-messages-area">
          {messages.length === 0 ? (
            <p className="muted">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => {
              const mine = msg.sender?._id === user?._id || msg.sender === user?._id;
              return (
                <div key={msg._id} className={`live-msg ${mine ? 'mine' : 'theirs'}`}>
                  <small>{msg.sender?.name || (mine ? 'You' : 'Admin')}</small>
                  <p>{msg.text}</p>
                  <time>{new Date(msg.createdAt).toLocaleTimeString()}</time>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-input-row" onSubmit={send}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
