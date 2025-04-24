import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  const askQuestion = async () => {
    try {
      setError('')
      console.log('Sending query:', query)
      const response = await fetch(`/api/ask?query=${encodeURIComponent(query)}`)
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
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Confluence LLM Assistant</h1>
      <input 
        type="text" 
        className="border p-2 w-full mb-2" 
        placeholder="Ask a question..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button 
        onClick={askQuestion}
        className="bg-blue-500 text-white px-4 py-2 rounded">
        Ask
      </button>
      {error && (
        <div className="mt-4 p-4 border rounded bg-red-50 text-red-600">
          {error}
        </div>
      )}
      {answer && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Answer:</h2>
          <p>{answer}</p>
        </div>
      )}
    </div>
  )
}

export default App; 