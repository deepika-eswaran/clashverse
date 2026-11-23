import { io } from 'socket.io-client';

// On a deployed site, set VITE_SERVER_URL (for example https://clashverse-server.onrender.com).
// Locally it falls back to port 4000 on the same computer, so LAN play still works.
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:4000`;

export const socket = io(SERVER_URL, { autoConnect: true });
