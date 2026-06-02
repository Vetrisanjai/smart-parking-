import { useState } from 'react';
import api from '../services/api';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! Ask me about booking, payments, slots, or support.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const { data } = await api.post('/chatbot/ask', { message: question });
      setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'bot', text: 'Sorry, something went wrong. Try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-wrap">
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <strong>Parking Assistant</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="chat-msg bot">Thinking...</div>}
          </div>
          <form className="chatbot-form" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="chatbot-fab"
        onClick={() => setOpen(!open)}
        aria-label="Open chatbot"
      >
        💬
      </button>
    </div>
  );
}
