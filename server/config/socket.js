import { Server } from 'socket.io'

let io = null

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  })

  io.on('connection', (socket) => {
    // console.log(`⚡ WebSocket client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      // console.log(`WebSocket client disconnected: ${socket.id}`)
    })
  })

  return io
}

export function getIO() {
  return io
}

export const wsEvents = {
  requestCreated(request) {
    if (io) io.emit('request:created', request)
  },
  requestReviewed(data) {
    if (io) io.emit('request:reviewed', data)
  },
  requestCancelled(data) {
    if (io) io.emit('request:cancelled', data)
  },
  requestDeleted(data) {
    if (io) io.emit('request:deleted', data)
  },
  userUpdated(user) {
    if (io) io.emit('user:updated', user)
  },
  userDeleted(userId) {
    if (io) io.emit('user:deleted', { id: userId })
  },
  gateActivity(log) {
    if (io) io.emit('gate:activity', log)
  },
  belongingUpdated(belonging) {
    if (io) io.emit('belonging:updated', belonging)
  },
}

export default { initSocket, getIO, wsEvents }
