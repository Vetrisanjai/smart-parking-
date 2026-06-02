import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user?.token) return null;
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: user.token },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
