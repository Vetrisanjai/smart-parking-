import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

export default function AdminMessages() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/messages/customers').then((res) => {
      setCustomers(res.data);
      if (res.data.length) setSelectedId(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.get(`/messages/user/${selectedId}`).then((res) => {
      setMessages(res.data.messages);
      setConversationId(res.data.conversationId);
      api.patch('/messages/read', { conversationId: res.data.conversationId });
    });
  }, [selectedId]);

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
    if (!text.trim() || !selectedId) return;
    const socket = getSocket();
    const payload = { text: text.trim(), receiverId: selectedId, conversationId };
    setText('');
    if (socket) {
      socket.emit('send_message', payload);
    } else {
      const { data } = await api.post('/messages', payload);
      setMessages((m) => [...m, data]);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1>Customer Messages</h1>
        <p>Reply to customer support requests</p>
      </header>

      <div className="admin-chat-layout">
        <aside className="customer-list card">
          <h3>Customers</h3>
          {customers.map((c) => (
            <button
              key={c._id}
              type="button"
              className={`customer-item ${selectedId === c._id ? 'active' : ''}`}
              onClick={() => setSelectedId(c._id)}
            >
              <strong>{c.name}</strong>
              <small>{c.email}</small>
            </button>
          ))}
          {customers.length === 0 && <p className="muted">No customers yet</p>}
        </aside>

        <div className="chat-panel card">
          {selectedId ? (
            <>
              <div className="chat-messages-area">
                {messages.map((msg) => {
                  const mine =
                    msg.sender?._id === user?._id || msg.sender?._id?.toString() === user?._id;
                  return (
                    <div key={msg._id} className={`live-msg ${mine ? 'mine' : 'theirs'}`}>
                      <small>{msg.sender?.name}</small>
                      <p>{msg.text}</p>
                      <time>{new Date(msg.createdAt).toLocaleTimeString()}</time>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form className="chat-input-row" onSubmit={send}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Reply to customer..."
                />
                <button type="submit" className="btn btn-primary">
                  Send
                </button>
              </form>
            </>
          ) : (
            <p className="muted page-center">Select a customer</p>
          )}
        </div>
      </div>
    </div>
  );
}
