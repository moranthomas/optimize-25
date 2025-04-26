import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Track() {
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [topics, setTopics] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If we have a topic from navigation state, set it as the selected topic
    if (location.state?.topic) {
      setSelectedTopic(location.state.topic);
    }
    fetchQuizHistory();
  }, [selectedTopic, location.state?.topic]);

  const fetchQuizHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = selectedTopic === 'all' 
        ? '/api/evaluate/history'
        : `/api/evaluate/history/${selectedTopic}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz history');
      }
      const data = await response.json();
      setQuizHistory(data);
      
      // Extract unique topics
      const uniqueTopics = [...new Set(data.map(quiz => quiz.topic))];
      setTopics(uniqueTopics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    const sortedHistory = [...quizHistory].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    return {
      labels: sortedHistory.map(quiz => new Date(quiz.createdAt).toLocaleDateString()),
      datasets: [{
        label: 'Quiz Scores',
        data: sortedHistory.map(quiz => quiz.score),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Quiz Performance Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score (%)'
        }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="border rounded p-2"
          >
            <option value="all">All Topics</option>
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && quizHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No quiz history available. Take some quizzes to see your progress!
          </div>
        )}

        {!loading && !error && quizHistory.length > 0 && (
          <>
            <div className="mb-8 h-80">
              <Line data={prepareChartData()} options={chartOptions} />
            </div>

            {/* New Personalized Learning Plan Section */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Personalized Learning Plan</h2>
              <p className="text-gray-700 mb-4">
                Based on your test evaluation and progress for {selectedTopic === 'all' ? 'all subjects' : `"${selectedTopic}"`}, 
                I've created the following personally tailored learning plan for you.
              </p>
              <button
                onClick={() => navigate('/knowledge')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Learning Plan
              </button>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Recent Quiz Results</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quizHistory.map((quiz, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {quiz.topic}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {quiz.score}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 