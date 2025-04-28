// src/services/peerService.js
import { Peer } from 'peerjs';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class PeerService {
  constructor() {
    this.peer = null;
    this.socket = null;
    this.myStream = null;
    this.peers = {};
    this.onRemoteStreamCallbacks = [];
    this.onUserDisconnectedCallbacks = [];
  }

  initialize() {
    this.socket = io(API_URL);
    
    this.peer = new Peer(undefined, {
      host: new URL(API_URL).hostname,
      port: new URL(API_URL).port || (window.location.protocol === 'https:' ? 443 : 80),
      path: '/peerjs',
      secure: window.location.protocol === 'https:',
    });

    return new Promise((resolve) => {
      this.peer.on('open', (id) => {
        resolve(id);
      });
    });
  }

  joinMeeting(meetingId, userId) {
    this.socket.emit('join-meeting', meetingId, userId);
    
    this.socket.on('user-connected', (userId) => {
      console.log('User connected to meeting:', userId);
      this.connectToNewUser(userId);
    });

    this.socket.on('user-disconnected', (userId) => {
      console.log('User disconnected from meeting:', userId);
      if (this.peers[userId]) {
        this.peers[userId].close();
      }
      
      this.onUserDisconnectedCallbacks.forEach(callback => {
        callback(userId);
      });
    });
  }

  setMyStream(stream) {
    this.myStream = stream;
    
    this.peer.on('call', (call) => {
      call.answer(stream);
      
      call.on('stream', (remoteStream) => {
        this.onRemoteStreamCallbacks.forEach(callback => {
          callback(remoteStream, call.peer);
        });
      });
    });
  }

  connectToNewUser(userId) {
    if (!this.myStream) return;
    
    const call = this.peer.call(userId, this.myStream);
    
    call.on('stream', (remoteStream) => {
      this.onRemoteStreamCallbacks.forEach(callback => {
        callback(remoteStream, userId);
      });
    });
    
    call.on('close', () => {
      // Handle call closing
    });
    
    this.peers[userId] = call;
  }

  onRemoteStream(callback) {
    this.onRemoteStreamCallbacks.push(callback);
  }

  onUserDisconnected(callback) {
    this.onUserDisconnectedCallbacks.push(callback);
  }

  async createMeeting() {
    try {
      const response = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return data.meetingId;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  async checkMeetingExists(meetingId) {
    try {
      const response = await fetch(`${API_URL}/api/meetings/${meetingId}`);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking meeting:', error);
      return false;
    }
  }

  closeConnection() {
    if (this.myStream) {
      this.myStream.getTracks().forEach(track => track.stop());
    }
    
    Object.values(this.peers).forEach(call => {
      call.close();
    });
    
    if (this.peer) {
      this.peer.destroy();
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new PeerService();