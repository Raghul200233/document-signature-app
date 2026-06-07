import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Document Signature App
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">
                Welcome to Your Dashboard
              </h2>
              <p className="text-gray-600 mb-8">
                Upload documents, manage signatures, and track status all in one place.
              </p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                Upload New Document
              </button>
            </div>
            
            {/* Documents section - will be implemented on Day 4 */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Your Documents</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                No documents yet. Upload your first document to get started.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;