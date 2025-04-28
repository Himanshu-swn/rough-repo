// src/pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import peerService from '../services/peerService';

const Home = () => {
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateMeeting = async () => {
    try {
      setIsCreating(true);
      setError('');
      const newMeetingId = await peerService.createMeeting();
      navigate(`/meeting/${newMeetingId}`);
    } catch (err) {
      setError('Failed to create meeting. Please try again.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    
    if (!meetingId.trim()) {
      setError('Please enter a meeting ID');
      return;
    }
    
    try {
      setIsJoining(true);
      setError('');
      
      const exists = await peerService.checkMeetingExists(meetingId);
      
      if (exists) {
        navigate(`/meeting/${meetingId}`);
      } else {
        setError('Meeting not found. Please check the ID and try again.');
      }
    } catch (err) {
      setError('Failed to join meeting. Please try again.');
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Mental Health Video Consultation</h1>
        </div>
      </header>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Create Meeting Section */}
              <div className="border-r-0 md:border-r border-gray-200 p-4">
                <h2 className="text-xl font-semibold mb-4">Start a New Meeting</h2>
                <p className="text-gray-600 mb-6">
                  Create a new consultation and invite others to join with the meeting ID.
                </p>
                <button
                  onClick={handleCreateMeeting}
                  disabled={isCreating}
                  className="btn btn-primary w-full"
                >
                  {isCreating ? 'Creating...' : 'Create New Meeting'}
                </button>
              </div>
              
              {/* Join Meeting Section */}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">Join a Meeting</h2>
                <p className="text-gray-600 mb-6">
                  Enter the meeting ID provided by the meeting organizer.
                </p>
                
                <form onSubmit={handleJoinMeeting}>
                  <div className="mb-4">
                    <label htmlFor="meetingId" className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      id="meetingId"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter meeting ID"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isJoining}
                    className="btn btn-primary w-full"
                  >
                    {isJoining ? 'Joining...' : 'Join Meeting'}
                  </button>
                </form>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-gray-500 text-center">
            © 2025 Mental Health Consultation Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;