import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import KnowledgeTree from './components/KnowledgeTree';
import Evaluate from './components/Evaluate';
import Track from './components/Track';
import AskDialog from './components/AskDialog';
import robotLogo from './assets/Opt25.png';
import './App.css'

function Navigation() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isKnowledge = location.pathname === '/knowledge';
  const isEvaluate = location.pathname === '/evaluate';
  const isTrack = location.pathname === '/track';

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img src={robotLogo} alt="OptimizeMe Logo" className="app-logo mr-2" />
              <span className="text-xl font-bold text-gray-900">OptimizeMe</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isHome
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/evaluate"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isEvaluate
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Evaluate
              </Link>
              <Link
                to="/track"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isTrack
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Track Progress
              </Link>
              <Link
                to="/knowledge"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isKnowledge
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Knowledge Base
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {/* Main Content */}
        <main className="py-6">
          <Routes>
            <Route path="/" element={
              <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to OptimizeMe</h1>
              </div>
            } />
            <Route path="/knowledge" element={<KnowledgeTree />} />
            <Route path="/evaluate" element={<Evaluate />} />
            <Route path="/track" element={<Track />} />
          </Routes>
        </main>

        {/* Floating Ask Button */}
        <button
          onClick={() => setIsDialogOpen(true)}
          className="fixed bottom-8 right-8 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>

        {/* Ask Dialog */}
        <AskDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </div>
    </Router>
  );
}

export default App; 