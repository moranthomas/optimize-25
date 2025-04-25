import React, { useState } from 'react';

const Evaluate = () => {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmitTopic = async (e) => {
        e.preventDefault();
        setLoading(true);
        setQuestions([]);
        setUserAnswers({});
        setScore(null);
        setSubmitted(false);

        try {
            const response = await fetch('http://localhost:8080/api/evaluate/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic })
            });

            if (!response.ok) {
                throw new Error('Failed to generate quiz');
            }

            const data = await response.json();
            setQuestions(data.questions);
        } catch (error) {
            console.error('Error generating quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionIndex, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: answer
        }));
    };

    const handleSubmitQuiz = async () => {
        const answeredQuestions = Object.keys(userAnswers).length;
        if (answeredQuestions < questions.length) {
            alert('Please answer all questions before submitting.');
            return;
        }

        try {
            // Convert userAnswers to the correct format
            const formattedUserAnswers = Object.entries(userAnswers).reduce((acc, [key, value]) => {
                acc[parseInt(key)] = value;
                return acc;
            }, {});

            const response = await fetch('http://localhost:8080/api/evaluate/submit-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic,
                    questions,
                    userAnswers: formattedUserAnswers
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit quiz');
            }

            const result = await response.json();
            setScore(result.score);
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert(error.message || 'Failed to submit quiz. Please try again.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Knowledge Evaluation</h1>
            
            <form onSubmit={handleSubmitTopic} className="mb-8">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What do you want to learn?"
                        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Generating...' : 'Generate Quiz'}
                    </button>
                </div>
            </form>

            {questions.length > 0 && !submitted && (
                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                            <p className="font-semibold mb-3">{index + 1}. {question.question}</p>
                            <div className="space-y-2">
                                {question.options.map((option, optionIndex) => (
                                    <label
                                        key={optionIndex}
                                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${index}`}
                                            value={option}
                                            checked={userAnswers[index] === option}
                                            onChange={() => handleAnswerSelect(index, option)}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={handleSubmitQuiz}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Submit Quiz
                    </button>
                </div>
            )}

            {submitted && score !== null && (
                <div className="mt-6 p-6 border rounded-lg bg-blue-50">
                    <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
                    <p className="text-lg">
                        Your score: <span className="font-bold">{score}%</span>
                    </p>
                    <button
                        onClick={() => {
                            setQuestions([]);
                            setUserAnswers({});
                            setScore(null);
                            setSubmitted(false);
                        }}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Try Another Quiz
                    </button>
                </div>
            )}
        </div>
    );
};

export default Evaluate; 