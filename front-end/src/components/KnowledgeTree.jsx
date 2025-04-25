import React, { useState, useEffect } from 'react';
import { knowledgeTreeService } from '../services/knowledgeTreeService';

const KnowledgeTree = () => {
    const [expandedBranches, setExpandedBranches] = useState(new Set());
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [rootNodes, setRootNodes] = useState([]);
    const [childNodes, setChildNodes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        content: '',
        examples: '',
        references: ''
    });

    useEffect(() => {
        const fetchRootNodes = async () => {
            try {
                console.log('Fetching root nodes...');
                const nodes = await knowledgeTreeService.getRootNodes();
                console.log('Root nodes received:', nodes);
                setRootNodes(nodes);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching root nodes:', err);
                setError('Failed to load knowledge tree');
                setLoading(false);
            }
        };
        fetchRootNodes();
    }, []);

    useEffect(() => {
        if (selectedSubtopic) {
            setEditForm({
                name: selectedSubtopic.name || '',
                description: selectedSubtopic.description || '',
                content: selectedSubtopic.content || '',
                examples: selectedSubtopic.examples || '',
                references: selectedSubtopic.references || ''
            });
        }
    }, [selectedSubtopic]);

    const toggleBranch = async (branchId) => {
        console.log('Toggling branch:', branchId);
        const newExpanded = new Set(expandedBranches);
        if (newExpanded.has(branchId)) {
            console.log('Collapsing branch:', branchId);
            newExpanded.delete(branchId);
        } else {
            console.log('Expanding branch:', branchId);
            newExpanded.add(branchId);
            if (!childNodes[branchId]) {
                try {
                    console.log('Fetching children for branch:', branchId);
                    const children = await knowledgeTreeService.getChildren(branchId);
                    console.log('Children received:', children);
                    setChildNodes(prev => ({
                        ...prev,
                        [branchId]: children
                    }));
                } catch (err) {
                    console.error('Error fetching children:', err);
                    setError('Failed to load children');
                }
            }
        }
        setExpandedBranches(newExpanded);
    };

    const handleSubtopicClick = (node) => {
        console.log('Selected node:', node);
        setSelectedSubtopic(node);
        setIsEditing(false);
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim()) {
            try {
                console.log('Searching for:', query);
                const results = await knowledgeTreeService.searchNodes(query);
                console.log('Search results:', results);
                setRootNodes(results);
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to search knowledge tree');
            }
        } else {
            try {
                console.log('Clearing search, fetching root nodes');
                const nodes = await knowledgeTreeService.getRootNodes();
                console.log('Root nodes received:', nodes);
                setRootNodes(nodes);
            } catch (err) {
                console.error('Error fetching root nodes:', err);
                setError('Failed to load knowledge tree');
            }
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            const updatedNode = {
                ...selectedSubtopic,
                ...editForm
            };
            const result = await knowledgeTreeService.updateNode(selectedSubtopic.id, updatedNode);
            setSelectedSubtopic(result);
            setIsEditing(false);

            // Update the node in the tree
            if (result.parentId === null) {
                setRootNodes(prev => prev.map(node => 
                    node.id === result.id ? result : node
                ));
            } else {
                setChildNodes(prev => ({
                    ...prev,
                    [result.parentId]: prev[result.parentId].map(node =>
                        node.id === result.id ? result : node
                    )
                }));
            }
        } catch (err) {
            console.error('Error saving node:', err);
            setError('Failed to save changes');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({
            name: selectedSubtopic.name || '',
            description: selectedSubtopic.description || '',
            content: selectedSubtopic.content || '',
            examples: selectedSubtopic.examples || '',
            references: selectedSubtopic.references || ''
        });
    };

    const renderBranch = (node, level = 0) => {
        console.log('Rendering branch:', node);
        const isExpanded = expandedBranches.has(node.id);
        const children = isExpanded ? childNodes[node.id] || [] : [];
        const hasChildren = node.childIds && node.childIds.length > 0;
        console.log('Children for node', node.id, ':', children, 'Has children:', hasChildren);

        return (
            <div key={node.id} className="ml-4">
                <div 
                    className={`flex items-center py-1 cursor-pointer hover:bg-gray-100 ${
                        selectedSubtopic?.id === node.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleSubtopicClick(node)}
                >
                    {hasChildren && (
                        <span 
                            className="mr-2 text-gray-500"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleBranch(node.id);
                            }}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    )}
                    <span className="text-gray-800">{node.name}</span>
                </div>
                {isExpanded && children.map(child => renderBranch(child, level + 1))}
            </div>
        );
    };

    const renderContent = () => {
        if (!selectedSubtopic) {
            return <div className="text-gray-500">Select a topic to view its content</div>;
        }

        if (isEditing) {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={editForm.description}
                            onChange={handleFormChange}
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Content</label>
                        <textarea
                            name="content"
                            value={editForm.content}
                            onChange={handleFormChange}
                            rows="5"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Examples</label>
                        <textarea
                            name="examples"
                            value={editForm.examples}
                            onChange={handleFormChange}
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">References</label>
                        <textarea
                            name="references"
                            value={editForm.references}
                            onChange={handleFormChange}
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{selectedSubtopic.name}</h2>
                    <button
                        onClick={handleEditClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Edit
                    </button>
                </div>
                {selectedSubtopic.description && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">Description</h3>
                        <p className="text-gray-700">{selectedSubtopic.description}</p>
                    </div>
                )}
                {selectedSubtopic.content && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">Content</h3>
                        <p className="text-gray-700">{selectedSubtopic.content}</p>
                    </div>
                )}
                {selectedSubtopic.examples && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">Examples</h3>
                        <p className="text-gray-700">{selectedSubtopic.examples}</p>
                    </div>
                )}
                {selectedSubtopic.references && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">References</h3>
                        <p className="text-gray-700">{selectedSubtopic.references}</p>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    return (
        <div className="flex h-screen">
            <div className="w-1/3 border-r p-4 overflow-y-auto">
                <input
                    type="text"
                    placeholder="Search knowledge tree..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full p-2 border rounded mb-4"
                />
                {rootNodes.map(node => renderBranch(node))}
            </div>
            <div className="w-2/3 p-4 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default KnowledgeTree; 