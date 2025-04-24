import React, { useState } from 'react';
import knowledgeTree from '../data/knowledge-tree.json';
import { contentStore } from '../data/content-store';

const KnowledgeTree = () => {
  const [expandedBranches, setExpandedBranches] = useState({});
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleBranch = (branchPath) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchPath]: !prev[branchPath]
    }));
  };

  const handleSubtopicClick = (branchPath, subtopic) => {
    setSelectedSubtopic({ branchPath, subtopic });
  };

  const flattenSubtopics = (branches) => {
    return branches.flatMap(branch => {
      if (branch.subtopics && branch.subtopics[0] && typeof branch.subtopics[0] === 'object') {
        return branch.subtopics.flatMap(subBranch => subBranch.subtopics);
      }
      return branch.subtopics;
    });
  };

  const filteredBranches = knowledgeTree.branches.map(branch => ({
    ...branch,
    subtopics: branch.subtopics.map(subBranch => ({
      ...subBranch,
      subtopics: subBranch.subtopics.filter(subtopic =>
        subtopic.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(subBranch => subBranch.subtopics.length > 0)
  })).filter(branch => branch.subtopics.length > 0);

  const renderContent = () => {
    if (!selectedSubtopic) {
      return (
        <div className="text-gray-500 text-center py-8">
          Select a topic to view its content
        </div>
      );
    }

    const content = contentStore[selectedSubtopic.subtopic];
    if (!content) {
      return (
        <div className="text-gray-500 text-center py-8">
          Content for this topic is coming soon!
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">{content.title}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Overview</h3>
            <p className="text-gray-700 mt-1">{content.content.overview}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Key Points</h3>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {content.content.keyPoints.map((point, index) => (
                <li key={index} className="text-gray-700">{point}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Examples</h3>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {content.content.examples.map((example, index) => (
                <li key={index} className="text-gray-700">{example}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderBranch = (branch, level = 0, parentPath = '') => {
    const branchPath = parentPath ? `${parentPath}.${branch.name}` : branch.name;
    const isExpanded = expandedBranches[branchPath];

    return (
      <div key={branchPath} className={`${level > 0 ? 'ml-4' : ''}`}>
        <button
          onClick={() => toggleBranch(branchPath)}
          className="w-full text-left font-semibold flex justify-between items-center p-2 hover:bg-gray-50 rounded"
        >
          <span>{branch.name}</span>
          <span className="text-gray-500">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        {isExpanded && (
          <div className="mt-2 pl-4 space-y-1">
            {branch.subtopics.map((subBranch, index) => {
              if (typeof subBranch === 'string') {
                return (
                  <div
                    key={`${branchPath}-${index}`}
                    onClick={() => handleSubtopicClick(branchPath, subBranch)}
                    className={`p-2 rounded cursor-pointer hover:bg-blue-50 ${
                      selectedSubtopic?.branchPath === branchPath && 
                      selectedSubtopic?.subtopic === subBranch ? 'bg-blue-50' : ''
                    }`}
                  >
                    {subBranch}
                  </div>
                );
              }
              return renderBranch(subBranch, level + 1, branchPath);
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{knowledgeTree.topic}</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          {filteredBranches.map((branch) => renderBranch(branch))}
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTree; 