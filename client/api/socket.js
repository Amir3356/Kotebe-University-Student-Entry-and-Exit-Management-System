import { io } from 'socket.io-client'
import { getStoredToken } from './client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000'

let socketInstance = null

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      auth: (cb) => {
        const token = getStoredToken()
        cb({ token })
      },
    })

    socketInstance.on('connect', () => {
      // console.log(`Connected to WebSocket server: ${socketInstance.id}`)
    })

    socketInstance.on('connect_error', () => {
      // Graceful fallback if WebSocket is temporarily disconnected
    })
  }

  return socketInstance
}

export default getSocket
