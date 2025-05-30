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
  const [allQuizHistory, setAllQuizHistory] = useState([]); // Store complete history
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.topic) {
      setSelectedTopic(location.state.topic);
    }
    fetchAllQuizHistory();
  }, [location.state?.topic]);

  useEffect(() => {
    if (selectedTopic === 'all') {
      setQuizHistory(allQuizHistory);
    } else {
      setQuizHistory(allQuizHistory.filter(quiz => quiz.topic === selectedTopic));
    }
  }, [selectedTopic, allQuizHistory]);

  const fetchAllQuizHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/evaluate/history');
      if (!response.ok) {
        throw new Error('Failed to fetch quiz history');
      }
      const data = await response.json();
      setAllQuizHistory(data);
      
      // Set the complete list of unique topics
      const uniqueTopics = [...new Set(data.map(quiz => quiz.topic))];
      setTopics(uniqueTopics);

      // Set initial quiz history based on selected topic
      if (selectedTopic === 'all') {
        setQuizHistory(data);
      } else {
        setQuizHistory(data.filter(quiz => quiz.topic === selectedTopic));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLearningPlan = async () => {
    if (selectedTopic === 'all') {
      navigate('/knowledge');
      return;
    }

    setIsNavigating(true);
    try {
      // First, check if the topic exists in the knowledge tree
      const response = await fetch(`/api/knowledge-tree/search?query=${encodeURIComponent(selectedTopic)}`);
      if (!response.ok) {
        throw new Error('Failed to search knowledge tree');
      }
      const nodes = await response.json();
      
      // If the topic exists, get its full context before navigating
      if (nodes.length > 0) {
        const node = nodes[0];
        const parentChain = [];
        let currentNode = { ...node };
        
        // Get all parent nodes in a chain
        while (currentNode.parentId) {
          const parentResponse = await fetch(`/api/knowledge-tree/node/${currentNode.parentId}`);
          if (!parentResponse.ok) break;
          
          const parent = await parentResponse.json();
          if (parent) {
            parentChain.unshift(parent);
            currentNode = parent;
          } else {
            break;
          }
        }

        // Navigate with the full context
        navigate('/knowledge', { 
          state: { 
            selectedNodeId: node.id,
            parentChain: parentChain // Pass the parent chain to help with initial rendering
          } 
        });
        return;
      }

      // If the topic doesn't exist, first find Learning Plan
      const learningPlanResponse = await fetch('/api/knowledge-tree/search?query=Learning Plan');
      if (!learningPlanResponse.ok) {
        throw new Error('Failed to find Learning Plan node');
      }
      const learningPlanNodes = await learningPlanResponse.json();
      
      if (learningPlanNodes.length === 0) {
        throw new Error('Learning Plan node not found');
      }

      const learningPlanId = learningPlanNodes[0].id;
      
      // Then find or create Software Engineering under Learning Plan
      const softwareEngResponse = await fetch('/api/knowledge-tree/search?query=Software Engineering');
      if (!softwareEngResponse.ok) {
        throw new Error('Failed to find Software Engineering node');
      }
      const softwareEngNodes = await softwareEngResponse.json();
      
      let softwareEngId;
      if (softwareEngNodes.length === 0) {
        // Create Software Engineering under Learning Plan
        const createSoftwareEngResponse = await fetch('/api/knowledge-tree', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Software Engineering',
            parent: {
              id: learningPlanId
            }
          })
        });

        if (!createSoftwareEngResponse.ok) {
          throw new Error('Failed to create Software Engineering node');
        }

        const softwareEngNode = await createSoftwareEngResponse.json();
        softwareEngId = softwareEngNode.id;
      } else {
        softwareEngId = softwareEngNodes[0].id;
      }
      
      // Now create the new topic under Software Engineering
      const createResponse = await fetch('/api/knowledge-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedTopic,
          parent: {
            id: softwareEngId
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create topic node');
      }

      const newNode = await createResponse.json();
      
      // Navigate with the full context
      navigate('/knowledge', { 
        state: { 
          selectedNodeId: newNode.id,
          shouldSuggest: true,
          parentChain: [learningPlanNodes[0], softwareEngNodes[0]] // Pass the parent chain
        } 
      });
    } catch (err) {
      console.error('Error handling learning plan:', err);
      setError('Failed to load learning plan. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  };

  const prepareChartData = () => {
    const sortedHistory = [...quizHistory].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Group quiz results by topic
    const quizzesByTopic = sortedHistory.reduce((acc, quiz) => {
      if (!acc[quiz.topic]) {
        acc[quiz.topic] = [];
      }
      acc[quiz.topic].push(quiz);
      return acc;
    }, {});

    // Generate a unique color for each topic
    const colors = [
      'rgb(59, 130, 246)', // blue-500
      'rgb(16, 185, 129)', // green-500
      'rgb(245, 158, 11)', // amber-500
      'rgb(239, 68, 68)',  // red-500
      'rgb(139, 92, 246)', // purple-500
      'rgb(236, 72, 153)', // pink-500
      'rgb(14, 165, 233)', // sky-500
      'rgb(168, 85, 247)', // violet-500
      'rgb(234, 88, 12)',  // orange-500
    ];

    // Format the timestamp for display
    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    // Get all timestamps for x-axis
    const allTimestamps = sortedHistory.map(quiz => quiz.createdAt)
      .sort((a, b) => new Date(a) - new Date(b));

    // Create datasets for each topic
    const datasets = Object.entries(quizzesByTopic).map(([topic, quizzes], index) => {
      const colorIndex = index % colors.length;
      
      // Create a map of timestamp to score for this topic
      const timestampScoreMap = quizzes.reduce((acc, quiz) => {
        acc[quiz.createdAt] = quiz.score;
        return acc;
      }, {});

      // Get data points for this topic
      const data = allTimestamps.map(timestamp => timestampScoreMap[timestamp] || null);

      return {
        label: topic,
        data: data,
        borderColor: colors[colorIndex],
        backgroundColor: colors[colorIndex],
        fill: false,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true
      };
    });

    return {
      labels: allTimestamps.map(formatTimestamp),
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: selectedTopic === 'all' ? 'Quiz Performance Across All Topics' : `Quiz Performance for ${selectedTopic}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label
        }
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
      },
      x: {
        title: {
          display: true,
          text: 'Date & Time'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
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
                onClick={handleViewLearningPlan}
                disabled={isNavigating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isNavigating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  'View Learning Plan'
                )}
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