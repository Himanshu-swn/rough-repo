import { useEffect, useRef } from 'react';

const VideoPlayer = ({ stream, isMuted, username }) => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  return (
    <div className="relative bg-black rounded-lg overflow-hidden h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
      />
      {username && (
        <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-70 text-white px-2 py-1 rounded-md text-sm">
          {username}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;