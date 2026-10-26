import { io } from "socket.io-client";
import { BACKEND_URL } from "./api";

let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BACKEND_URL;

export const connectSocket = (token) => {
  if (!token) return null;

  socket = io(SOCKET_URL, {
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
