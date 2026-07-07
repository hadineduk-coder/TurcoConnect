const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || 'turco123';

/* ============================================
   STATE
   ============================================ */
const users = new Map();       // socketId → { name, age, gender, city, status, connectedAt, roomId }
const waitQueue = [];          // socketIds waiting for match
let totalMatches = 0;

/* ============================================
   STATIC FILES
   ============================================ */
app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

/* ============================================
   HELPERS
   ============================================ */
function getUserList() {
  const list = [];
  users.forEach((u, id) => {
    list.push({ id, name: u.name, age: u.age, gender: u.gender, city: u.city, status: u.status, connectedAt: u.connectedAt });
  });
  return list;
}

function getStats() {
  let waiting = 0, chatting = 0, idle = 0;
  users.forEach(u => {
    if (u.status === 'waiting') waiting++;
    else if (u.status === 'chatting') chatting++;
    else idle++;
  });
  return { total: users.size, waiting, chatting, idle, totalMatches };
}

function broadcastAdmin() {
  io.to('admin-room').emit('admin:users', getUserList());
  io.to('admin-room').emit('admin:stats', getStats());
}

function tryMatch() {
  while (waitQueue.length >= 2) {
    const id1 = waitQueue.shift();
    const id2 = waitQueue.shift();

    const u1 = users.get(id1);
    const u2 = users.get(id2);

    if (id1 === id2) {
      if (u1 && u1.status === 'waiting') waitQueue.unshift(id1);
      continue;
    }

    // Check both still connected & waiting
    if (!u1 || u1.status !== 'waiting') {
      if (u2 && u2.status === 'waiting') waitQueue.unshift(id2);
      continue;
    }
    if (!u2 || u2.status !== 'waiting') {
      if (u1 && u1.status === 'waiting') waitQueue.unshift(id1);
      continue;
    }

    // Create room
    const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    u1.status = 'chatting';
    u1.roomId = roomId;
    u2.status = 'chatting';
    u2.roomId = roomId;

    const sock1 = io.sockets.sockets.get(id1);
    const sock2 = io.sockets.sockets.get(id2);

    if (sock1) sock1.join(roomId);
    if (sock2) sock2.join(roomId);

    totalMatches++;

    // Notify both
    if (sock1) {
      sock1.emit('match:found', {
        name: u2.name,
        age: u2.age,
        gender: u2.gender,
        city: u2.city,
        roomId
      });
    }
    if (sock2) {
      sock2.emit('match:found', {
        name: u1.name,
        age: u1.age,
        gender: u1.gender,
        city: u1.city,
        roomId
      });
    }

    console.log(`✅ Match: ${u1.name} ↔ ${u2.name} (${roomId})`);
    broadcastAdmin();
  }
}

/* ============================================
   SOCKET.IO
   ============================================ */
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  /* --- User Join --- */
  socket.on('user:join', (data) => {
    users.set(socket.id, {
      name: data.name || 'Anónimo',
      age: data.age || 0,
      gender: data.gender || '',
      city: data.city || '',
      status: 'idle',
      connectedAt: new Date().toISOString(),
      roomId: null
    });
    console.log(`👤 Joined: ${data.name} from ${data.city}`);
    broadcastAdmin();
  });

  /* --- Search for match --- */
  socket.on('user:search', () => {
    const u = users.get(socket.id);
    if (!u) return;
    u.status = 'waiting';
    if (!waitQueue.includes(socket.id)) {
      waitQueue.push(socket.id);
    }
    console.log(`🔍 Searching: ${u.name}`);
    broadcastAdmin();
    tryMatch();
  });

  /* --- Cancel search --- */
  socket.on('user:cancel-search', () => {
    const u = users.get(socket.id);
    if (!u) return;
    u.status = 'idle';
    const idx = waitQueue.indexOf(socket.id);
    if (idx > -1) waitQueue.splice(idx, 1);
    broadcastAdmin();
  });

  /* --- Chat message --- */
  socket.on('chat:message', (data) => {
    const u = users.get(socket.id);
    if (!u || !u.roomId) return;
    socket.to(u.roomId).emit('chat:message', {
      text: data.text,
      name: u.name,
      time: new Date().toISOString()
    });
  });

  /* --- Typing indicator --- */
  socket.on('chat:typing', (isTyping) => {
    const u = users.get(socket.id);
    if (!u || !u.roomId) return;
    socket.to(u.roomId).emit('chat:typing', { name: u.name, isTyping });
  });

  /* --- RPS play --- */
  socket.on('rps:play', (data) => {
    const u = users.get(socket.id);
    if (!u || !u.roomId) return;

    // Store choice
    if (!u.rpsChoice) u.rpsChoice = null;
    u.rpsChoice = data.choice;

    // Find opponent in room
    const roomSockets = io.sockets.adapter.rooms.get(u.roomId);
    if (!roomSockets) return;

    let opponentId = null;
    for (const sid of roomSockets) {
      if (sid !== socket.id) { opponentId = sid; break; }
    }
    if (!opponentId) return;

    const opp = users.get(opponentId);
    if (!opp) return;

    // Notify opponent that player made a choice
    socket.to(u.roomId).emit('rps:opponent-ready', { name: u.name });

    // If both chose, resolve
    if (u.rpsChoice && opp.rpsChoice) {
      const wins = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' };
      let result;
      if (u.rpsChoice === opp.rpsChoice) {
        result = 'draw';
      } else if (wins[u.rpsChoice] === opp.rpsChoice) {
        result = 'player1';
      } else {
        result = 'player2';
      }

      // Send results
      const sockU = io.sockets.sockets.get(socket.id);
      const sockO = io.sockets.sockets.get(opponentId);

      if (sockU) {
        sockU.emit('rps:result', {
          yourChoice: u.rpsChoice,
          oppChoice: opp.rpsChoice,
          result: result === 'draw' ? 'draw' : (result === 'player1' ? 'win' : 'lose'),
          oppName: opp.name
        });
      }
      if (sockO) {
        sockO.emit('rps:result', {
          yourChoice: opp.rpsChoice,
          oppChoice: u.rpsChoice,
          result: result === 'draw' ? 'draw' : (result === 'player2' ? 'win' : 'lose'),
          oppName: u.name
        });
      }

      // Reset choices
      u.rpsChoice = null;
      opp.rpsChoice = null;
    }
  });

  /* --- RPS reset --- */
  socket.on('rps:reset', () => {
    const u = users.get(socket.id);
    if (u) u.rpsChoice = null;
  });

  /* --- Disconnect from chat --- */
  socket.on('chat:disconnect', () => {
    const u = users.get(socket.id);
    if (!u || !u.roomId) return;

    socket.to(u.roomId).emit('chat:partner-left', { name: u.name });
    socket.leave(u.roomId);

    // Notify the partner
    const roomSockets = io.sockets.adapter.rooms.get(u.roomId);
    if (roomSockets) {
      for (const sid of roomSockets) {
        const partner = users.get(sid);
        if (partner) {
          partner.status = 'idle';
          partner.roomId = null;
          const partnerSock = io.sockets.sockets.get(sid);
          if (partnerSock) partnerSock.leave(u.roomId);
        }
      }
    }

    u.status = 'idle';
    u.roomId = null;
    broadcastAdmin();
  });

  /* --- Admin join --- */
  socket.on('admin:join', (data) => {
    if (data.password === ADMIN_PASS) {
      socket.join('admin-room');
      socket.emit('admin:auth', { success: true });
      socket.emit('admin:users', getUserList());
      socket.emit('admin:stats', getStats());
      console.log('🔑 Admin connected');
    } else {
      socket.emit('admin:auth', { success: false });
    }
  });

  /* --- Socket disconnect --- */
  socket.on('disconnect', () => {
    const u = users.get(socket.id);
    if (u) {
      // Remove from queue
      const idx = waitQueue.indexOf(socket.id);
      if (idx > -1) waitQueue.splice(idx, 1);

      // Notify chat partner
      if (u.roomId) {
        socket.to(u.roomId).emit('chat:partner-left', { name: u.name });
        const roomSockets = io.sockets.adapter.rooms.get(u.roomId);
        if (roomSockets) {
          for (const sid of roomSockets) {
            const partner = users.get(sid);
            if (partner) { partner.status = 'idle'; partner.roomId = null; }
          }
        }
      }

      console.log(`❌ Disconnected: ${u.name}`);
      users.delete(socket.id);
    }
    broadcastAdmin();
  });
});

/* ============================================
   START
   ============================================ */
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║    🟢 TURCO CONNECT MX — ONLINE         ║
  ║                                          ║
  ║    App:   http://localhost:${PORT}          ║
  ║    Admin: http://localhost:${PORT}/admin    ║
  ║    Pass:  ${ADMIN_PASS}                       ║
  ╚══════════════════════════════════════════╝
  `);
});
