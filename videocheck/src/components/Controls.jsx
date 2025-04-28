const Controls = ({ 
    onToggleAudio, 
    onToggleVideo, 
    onLeave, 
    onShareScreen,
    isAudioMuted, 
    isVideoOff,
    isScreenSharing 
  }) => {
    return (
      <div className="flex justify-center space-x-4">
        <button 
          className={`btn ${isAudioMuted ? 'bg-gray-500' : 'btn-primary'}`}
          onClick={onToggleAudio}
        >
          {isAudioMuted ? 'Unmute' : 'Mute'}
        </button>
        
        <button 
          className={`btn ${isVideoOff ? 'bg-gray-500' : 'btn-primary'}`}
          onClick={onToggleVideo}
        >
          {isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
        </button>
        
        <button 
          className={`btn ${isScreenSharing ? 'bg-secondary' : 'bg-blue-500'}`}
          onClick={onShareScreen}
        >
          {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        </button>
        
        <button 
          className="btn btn-danger"
          onClick={onLeave}
        >
          Leave Meeting
        </button>
      </div>
    );
  };
  
  export default Controls;
  