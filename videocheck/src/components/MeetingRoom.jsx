// src/components/MeetingRoom.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import Controls from './Controls';
import peerService from '../services/peerService';

const MeetingRoom = () => {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        // Initialize video and audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        
        // Initialize WebRTC
        const peerId = await peerService.initialize();
        setUserId(peerId);
        
        peerService.setMyStream(stream);
        peerService.joinMeeting(meetingId, peerId);
        
        // Handle remote streams
        peerService.onRemoteStream((stream, userId) => {
          setRemoteStreams(prev => ({
            ...prev,
            [userId]: stream
          }));
        });
        
        // Handle user disconnect
        peerService.onUserDisconnected((userId) => {
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[userId];
            return newStreams;
          });
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        alert('Failed to access camera and microphone. Please check your permissions.');
        navigate('/');
      }
    };
    
    // Verify the meeting exists first
    const checkAndJoinMeeting = async () => {
      try {
        const exists = await peerService.checkMeetingExists(meetingId);
        if (exists) {
          initializeMeeting();
        } else {
          alert('Meeting not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking meeting:', error);
        navigate('/');
      }
    };
    
    if (meetingId) {
      checkAndJoinMeeting();
    } else {
      navigate('/');
    }
    
    // Cleanup on unmount
    return () => {
      peerService.closeConnection();
    };
  }, [meetingId, navigate]);

  const handleToggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioMuted;
        setIsAudioMuted(!isAudioMuted);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const handleShareScreen = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      
      // Restore camera video
      if (localStream) {
        peerService.setMyStream(localStream);
      }
      
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      try {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        setScreenStream(stream);
        peerService.setMyStream(stream);
        setIsScreenSharing(true);
        
        // Handle the case when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          peerService.setMyStream(localStream);
          setScreenStream(null);
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };

  const handleLeave = () => {
    if (window.confirm('Are you sure you want to leave this meeting?')) {
      peerService.closeConnection();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Joining meeting...</p>
      </div>
    );
  }

  const copyMeetingLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Meeting link copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow-md p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Meeting: {meetingId}</h1>
          <div className="flex items-center">
            <button 
              onClick={copyMeetingLink}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              Copy meeting link
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr h-full">
          {/* Local video */}
          <div className="h-64 md:h-auto">
            <VideoPlayer 
              stream={isScreenSharing ? screenStream : localStream} 
              isMuted={true} 
              username={`You ${isScreenSharing ? '(Screen)' : ''}`} 
            />
          </div>
          
          {/* Remote videos */}
          {Object.entries(remoteStreams).map(([userId, stream]) => (
            <div key={userId} className="h-64 md:h-auto">
              <VideoPlayer 
                stream={stream} 
                isMuted={false} 
                username={`Participant ${userId.substring(0, 5)}`} 
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-900 p-4">
        <Controls 
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onShareScreen={handleShareScreen}
          onLeave={handleLeave}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
        />
      </div>
    </div>
  );
};

export default MeetingRoom;