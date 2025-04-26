import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import optimize1 from '../assets/optimize_1.png';
import optimize2 from '../assets/optimize_2.png';
import robotChats from '../assets/robot_chats.gif';
import feature1 from '../assets/feature_1.png';
import feature2 from '../assets/feature_2.png';
import feature3 from '../assets/feature_3.png';
import AskDialog from './AskDialog';

const LandingPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              An Accelerated Learning Platform powered by Artificial Intelligence
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Transform your learning experience with cutting-edge AI technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                to="/knowledge"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Learning
              </Link>
              <Link
                to="/evaluate"
                className="px-8 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Take a Quiz
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src={optimize1} 
              alt="AI Learning Platform" 
              className="w-full object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Research Based Section */}
      <div className="bg-gradient-to-b from-white to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              100% Research Based
            </h2>
            <p className="text-lg text-gray-600">
              Backed by the latest findings in cognitive neuroscience, education, and learning theory
            </p>
          </div>
          <div className="flex justify-center">
            <img 
              src={optimize2} 
              alt="Research Based Learning" 
              className="max-w-xl w-full object-contain" 
            />
          </div>
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                AI Digital Assistant
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Turbocharged with your own personal learning assistant designed specifically to help accelerate your learning outcomes. Click on the "Bot" animation to start a chat right now in your browser!
              </p>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Chatting
              </button>
            </div>
            <div className="md:w-1/2 flex justify-center items-center">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl shadow-lg w-[300px] h-[300px] flex items-center justify-center">
                <img 
                  src={robotChats} 
                  alt="AI Assistant" 
                  className="w-full max-w-[200px] rounded-lg" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Feature Details
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <img src={feature1} alt="Dashboard" className="mx-auto mb-6 h-32" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-gray-600">
                Personalized Reporting gives you the insights you need
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <img src={feature2} alt="Adaptive Learning" className="mx-auto mb-6 h-32" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Adaptive</h3>
              <p className="text-gray-600">
                The system adapts using state of the art machine learning techniques to create a personalized learning path
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <img src={feature3} alt="Learning Accelerator" className="mx-auto mb-6 h-32" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Learning Accelerator</h3>
              <p className="text-gray-600">
                Gives you the ability to create, modify, track and accelerate the realisation of your learning goals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Accelerate Your Learning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of learners who are already experiencing the power of AI-driven education
          </p>
          <Link
            to="/knowledge"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Now
          </Link>
        </div>
      </div>

      {/* Ask Dialog */}
      <AskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};

export default LandingPage; 