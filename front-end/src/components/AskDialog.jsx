import React, { useState } from 'react';

export default function AskDialog({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const askQuestion = async () => {
    try {
      setError('');
      console.log('Sending query:', query);
      const response = await fetch(`/api/chatgpt/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: query })
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received data:', data);
      setAnswer(data.answer);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get answer. Please try again.');
      setAnswer('');
    }
  };

  const handleClear = () => {
    setQuery('');
    setAnswer('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Ask a Question</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              className="border p-2 flex-grow rounded" 
              placeholder="Ask a question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {(query || answer || error) && (
              <button
                onClick={handleClear}
                className="px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Clear all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <button 
            onClick={askQuestion}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
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
    </div>
  );
} 