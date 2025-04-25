import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import KnowledgeTree from './components/KnowledgeTree';
import Evaluate from './components/Evaluate';
import robotLogo from './assets/Opt25.png';
import './App.css'

function Navigation() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isKnowledge = location.pathname === '/knowledge';
  const isEvaluate = location.pathname === '/evaluate';

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img src={robotLogo} alt="OptimizeMe Logo" className="app-logo" />
              <span className="text-xl font-bold text-gray-900">Optimize Me</span>
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
                to="/knowledge"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isKnowledge
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Knowledge Base
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
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('tree');
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  const askQuestion = async () => {
    try {
      setError('')
      console.log('Sending query:', query)
      const response = await fetch(`/api/chatgpt/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: query })
      })
      console.log('Response status:', response.status)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Received data:', data)
      setAnswer(data.answer)
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to get answer. Please try again.')
      setAnswer('')
    }
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        {/* Main Content */}
        <main className="py-6">
          <Routes>
            <Route path="/" element={
              <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">OptimizeMe - AI Assistant</h1>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    className="border p-2 w-full" 
                    placeholder="Ask a question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button 
                    onClick={askQuestion}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Ask
                  </button>
                  {error && (
                    <div className="p-4 border rounded bg-red-50 text-red-600">
                      {error}
                    </div>
                  )}
                  {answer && (
                    <div className="p-4 border rounded bg-gray-50">
                      <h2 className="font-semibold mb-2">Answer:</h2>
                      <p>{answer}</p>
                    </div>
                  )}
                </div>
              </div>
            } />
            <Route path="/knowledge" element={<KnowledgeTree />} />
            <Route path="/evaluate" element={<Evaluate />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 