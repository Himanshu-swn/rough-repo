// server/index.js
const express = require('express');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Set up PeerJS server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});

app.use('/peerjs', peerServer);

// Store active meetings
const meetings = new Map();

// API Routes
app.post('/api/meetings', (req, res) => {
  const meetingId = uuidv4();
  meetings.set(meetingId, {
    id: meetingId,
    participants: [],
    createdAt: new Date()
  });
  
  res.status(201).json({ meetingId });
});

app.get('/api/meetings/:meetingId', (req, res) => {
  const { meetingId } = req.params;
  
  if (meetings.has(meetingId)) {
    res.status(200).json({ exists: true });
  } else {
    res.status(404).json({ exists: false });
  }
});

// Set up Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-meeting', (meetingId, userId) => {
    console.log(`User ${userId} joining meeting ${meetingId}`);
    
    socket.join(meetingId);
    socket.to(meetingId).emit('user-connected', userId);
    
    // Update meeting participants
    if (meetings.has(meetingId)) {
      const meeting = meetings.get(meetingId);
      meeting.participants.push(userId);
    }
    
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      socket.to(meetingId).emit('user-disconnected', userId);
      
      // Remove participant from meeting
      if (meetings.has(meetingId)) {
        const meeting = meetings.get(meetingId);
        meeting.participants = meeting.participants.filter(id => id !== userId);
        
        // Clean up empty meetings after some time
        if (meeting.participants.length === 0) {
          setTimeout(() => {
            if (meetings.has(meetingId) && 
                meetings.get(meetingId).participants.length === 0) {
              meetings.delete(meetingId);
              console.log(`Meeting ${meetingId} removed due to inactivity`);
            }
          }, 5 * 60 * 1000); // 5 minutes
        }
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});