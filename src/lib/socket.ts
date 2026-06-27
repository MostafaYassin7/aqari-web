import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://api.aqora.sa';

let chatSocket: Socket | null = null;

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('aqar-auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
}

export function connectChatSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;
  if (chatSocket?.connected) return chatSocket;

  chatSocket = io(`${SOCKET_URL}/chat`, {
    transports: ['websocket'],
    auth: { token: `Bearer ${token}` },
  });

  chatSocket.on('connect', () => console.log('Chat socket connected'));
  chatSocket.on('connect_error', (e) => console.error('Chat socket error:', e.message));
  chatSocket.on('disconnect', () => console.log('Chat socket disconnected'));

  return chatSocket;
}

export function getChatSocket() {
  return chatSocket;
}

export function disconnectChatSocket() {
  chatSocket?.disconnect();
  chatSocket = null;
}

export function joinChat(chatId: string) {
  chatSocket?.emit('join_chat', chatId);
}

export function leaveChat(chatId: string) {
  chatSocket?.emit('leave_chat', chatId);
}

export function sendChatMessage(chatId: string, content: string) {
  chatSocket?.emit('send_message', { chatId, content });
}

export function emitTyping(chatId: string) {
  chatSocket?.emit('typing', chatId);
}
