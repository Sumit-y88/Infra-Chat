import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (!token) return null;

  socket = io("https://infra-chat.onrender.com", {
    auth: { token },
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
