import React, { useState, useEffect, useCallback, useRef } from 'react';
import { knowledgeTreeService } from '../services/knowledgeTreeService';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useLocation } from 'react-router-dom';

const Branch = React.memo(({ 
    node, 
    level, 
    index, 
    expandedBranches, 
    childNodes, 
    selectedSubtopic,
    onToggle,
    onNodeClick,
    getRootNodeColor 
}) => {
    const isExpanded = expandedBranches.has(node.id);
    const children = isExpanded ? childNodes[node.id] || [] : [];
    const hasChildren = node.childIds && node.childIds.length > 0;
    const isRootNode = level === 0;
    const rootColorClass = isRootNode ? getRootNodeColor(node.name) : '';

    return (
        <Draggable 
            key={node.id} 
            draggableId={String(node.id)}
            index={index}
        >
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                        ...provided.draggableProps.style,
                        marginLeft: `${level * 1}rem`
                    }}
                    className={`${isRootNode ? 'mb-2' : ''}`}
                >
                    <div 
                        className={`
                            flex items-center py-2 px-3 rounded-lg transition-all duration-200
                            ${isRootNode ? `${rootColorClass} border-2 font-semibold` : 'hover:bg-gray-100'}
                            ${selectedSubtopic?.id === node.id ? 'bg-blue-100' : ''}
                            ${snapshot.isDragging ? 'shadow-lg' : ''}
                            cursor-pointer
                        `}
                        onClick={() => onNodeClick(node)}
                    >
                        {hasChildren && (
                            <span 
                                className={`mr-2 transition-transform duration-200 ${
                                    isExpanded ? 'transform rotate-90' : ''
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle(node.id);
                                }}
                            >
                                ▶
                            </span>
                        )}
                        <span className={`${isRootNode ? 'text-lg' : 'text-base'}`}>
                            {node.name}
                        </span>
                    </div>
                    {isExpanded && children.length > 0 && (
                        <Droppable 
                            droppableId={String(node.id)}
                            type="node"
                        >
                            {(provided) => (
                                <div 
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="ml-4 border-l-2 border-gray-200 pl-2"
                                >
                                    {children.map((child, childIndex) => (
                                        <Branch
                                            key={child.id}
                                            node={child}
                                            level={level + 1}
                                            index={childIndex}
                                            expandedBranches={expandedBranches}
                                            childNodes={childNodes}
                                            selectedSubtopic={selectedSubtopic}
                                            onToggle={onToggle}
                                            onNodeClick={onNodeClick}
                                            getRootNodeColor={getRootNodeColor}
                                        />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    )}
                </div>
            )}
        </Draggable>
    );
});

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
    const [isPopulating, setIsPopulating] = useState(false);
    const populateRequestRef = useRef(null);
    const location = useLocation();
    const navigationHandled = React.useRef(false);
    const selectedSubtopicRef = useRef(null);

    // Keep selectedSubtopicRef in sync with selectedSubtopic
    useEffect(() => {
        selectedSubtopicRef.current = selectedSubtopic;
    }, [selectedSubtopic]);

    const handlePopulate = useCallback(async () => {
        // Use the ref to check the current selected topic
        const currentSubtopic = selectedSubtopicRef.current;
        if (!currentSubtopic?.id) {
            setError('No topic selected');
            return;
        }

        // Prevent multiple simultaneous requests
        if (isPopulating || populateRequestRef.current) {
            console.log('Population already in progress, skipping request');
            return;
        }

        setIsPopulating(true);
        setError(null);
        
        try {
            // Create an AbortController for this request
            populateRequestRef.current = new AbortController();
            
            // Store the current node ID and data to maintain context
            const currentNodeId = currentSubtopic.id;
            
            // Get existing children for the selected node
            const existingChildren = childNodes[currentNodeId] || [];
            
            // Properly encode the node name for the URL
            const encodedNodeName = encodeURIComponent(currentSubtopic.name);
            const response = await fetch(`http://localhost:8080/api/chatgpt/populate/${encodedNodeName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    existingNodes: existingChildren.map(node => ({
                        name: node.name,
                        description: node.description,
                        content: node.content
                    }))
                }),
                signal: populateRequestRef.current.signal
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to populate content');
            }

            // Refresh the data while maintaining context
            const nodes = await knowledgeTreeService.getRootNodes();
            setRootNodes(nodes);
            
            // Find the original node in the fresh data
            const refreshedNode = await knowledgeTreeService.getNode(currentNodeId);
            if (!refreshedNode) {
                throw new Error('Failed to find node after population');
            }
            
            // Update the selected node while maintaining context
            setSelectedSubtopic(refreshedNode);
            selectedSubtopicRef.current = refreshedNode;
            
            // Fetch and update children
            const newChildren = await knowledgeTreeService.getChildren(currentNodeId);
            if (newChildren) {
                setChildNodes(prev => ({
                    ...prev,
                    [currentNodeId]: newChildren
                }));
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Population request was cancelled');
            } else {
                console.error('Error populating content:', error);
                setError(error.message || 'Failed to populate content');
            }
        } finally {
            // Only clear populating state if we're still on the same node
            if (selectedSubtopicRef.current?.id === currentSubtopic.id) {
                setIsPopulating(false);
                populateRequestRef.current = null;
            }
        }
    }, [childNodes, knowledgeTreeService]); // Remove selectedSubtopic from dependencies

    useEffect(() => {
        const fetchRootNodes = async () => {
            try {
                console.log('Fetching root nodes...');
                const nodes = await knowledgeTreeService.getRootNodes();
                console.log('Root nodes received:', nodes);
                console.log('Learning Plan node:', nodes.find(n => n.name === 'Learning Plan'));
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

    // Navigation effect
    useEffect(() => {
        const state = location.state;
        
        // Skip if no navigation state or if already handled
        if (!state?.selectedNodeId || navigationHandled.current) {
            return;
        }

        const loadNodeAndParents = async () => {
            try {
                // Get the target node
                const node = await knowledgeTreeService.getNode(state.selectedNodeId);
                if (!node) {
                    console.error('Node not found:', state.selectedNodeId);
                    setError('Node not found');
                    return;
                }

                // Use provided parent chain if available, otherwise fetch it
                let parentChain = state.parentChain || [];
                if (!parentChain.length && node.parentId) {
                    // Get all parent nodes in a chain
                    let currentNode = { ...node };
                    while (currentNode.parentId) {
                        const parent = await knowledgeTreeService.getNode(currentNode.parentId);
                        if (parent) {
                            parentChain.unshift(parent);
                            currentNode = parent;
                        } else {
                            console.warn('Parent node not found:', currentNode.parentId);
                            break;
                        }
                    }
                }

                // First, set the selected node
                setSelectedSubtopic(node);
                
                // Then expand all nodes in one go
                const newExpanded = new Set([
                    ...parentChain.map(n => n.id),
                    node.id
                ]);
                setExpandedBranches(newExpanded);
                
                // Load all children in parallel
                const loadPromises = [...parentChain, node].map(async (n) => {
                    if (!n || !n.id) return null;
                    try {
                        const children = await knowledgeTreeService.getChildren(n.id);
                        if (children && children.length > 0) {
                            return [n.id, children];
                        }
                    } catch (error) {
                        console.warn(`Failed to load children for node ${n.id}:`, error);
                    }
                    return null;
                });

                const results = await Promise.all(loadPromises);
                const newChildNodes = {};
                results.forEach(result => {
                    if (result) {
                        const [id, children] = result;
                        newChildNodes[id] = children;
                    }
                });

                setChildNodes(prev => ({
                    ...prev,
                    ...newChildNodes
                }));

                // Mark this navigation as handled
                navigationHandled.current = true;

                // If shouldSuggest is true, trigger populate
                if (state.shouldSuggest && node) {
                    await handlePopulate();
                }
            } catch (error) {
                console.error('Error in navigation:', error);
                setError('Failed to load node details');
            }
        };

        // Only proceed if root nodes are loaded
        if (rootNodes.length > 0) {
            loadNodeAndParents();
        } else {
            // If root nodes aren't loaded yet, fetch them first
            const fetchRootNodes = async () => {
                try {
                    const nodes = await knowledgeTreeService.getRootNodes();
                    setRootNodes(nodes);
                    // Wait a bit for the state to update before proceeding
                    setTimeout(loadNodeAndParents, 100);
                } catch (error) {
                    console.error('Error fetching root nodes:', error);
                    setError('Failed to load knowledge tree');
                }
            };
            fetchRootNodes();
        }
    }, [location.state, rootNodes, handlePopulate, knowledgeTreeService]);

    // Reset navigation handled flag when location changes
    useEffect(() => {
        navigationHandled.current = false;
    }, [location.state]);

    const toggleBranch = useCallback(async (branchId) => {
        const newExpanded = new Set(expandedBranches);
        
        if (newExpanded.has(branchId)) {
            newExpanded.delete(branchId);
            setExpandedBranches(newExpanded);
            return;
        }
        
        newExpanded.add(branchId);
        setExpandedBranches(newExpanded);
        
        if (!childNodes[branchId]) {
            try {
                const children = await knowledgeTreeService.getChildren(branchId);
                if (children && children.length > 0) {
                    const childrenWithParent = children.map(child => ({
                        ...child,
                        parentId: branchId
                    }));
                    setChildNodes(prev => ({
                        ...prev,
                        [branchId]: childrenWithParent
                    }));
                }
            } catch (err) {
                console.error('Error fetching children:', err);
                setError('Failed to load children');
            }
        }
    }, [expandedBranches, childNodes, knowledgeTreeService]);

    const handleSubtopicClick = useCallback(async (node) => {
        if (selectedSubtopic?.id === node.id) return;
        
        setSelectedSubtopic(node);
        setIsEditing(false);

        if (node.childIds?.length > 0 && !childNodes[node.id]) {
            try {
                const children = await knowledgeTreeService.getChildren(node.id);
                if (children && children.length > 0) {
                    const childrenWithParent = children.map(child => ({
                        ...child,
                        parentId: node.id
                    }));
                    setChildNodes(prev => ({
                        ...prev,
                        [node.id]: childrenWithParent
                    }));
                }
            } catch (err) {
                console.error('Error fetching children:', err);
                setError('Failed to load children');
            }
        }

        // Only update expanded branches if needed
        const newExpanded = new Set(expandedBranches);
        let currentNode = node;
        let hasChanges = false;
        
        while (currentNode?.parentId) {
            if (!newExpanded.has(currentNode.parentId)) {
                hasChanges = true;
                newExpanded.add(currentNode.parentId);
            }
            currentNode = rootNodes.find(n => n.id === currentNode.parentId) ||
                         Object.values(childNodes).flat().find(n => n.id === currentNode.parentId);
        }
        
        if (hasChanges) {
            setExpandedBranches(newExpanded);
        }
    }, [selectedSubtopic, childNodes, expandedBranches, rootNodes, knowledgeTreeService]);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query.trim()) {
            try {
                console.log('Clearing search, fetching root nodes');
                const nodes = await knowledgeTreeService.getRootNodes();
                console.log('Root nodes received:', nodes);
                setRootNodes(nodes);
                // Don't reset selected topic when clearing search
                if (!isPopulating) {
                    setExpandedBranches(new Set());
                    setChildNodes({});
                }
            } catch (err) {
                console.error('Error fetching root nodes:', err);
                setError('Failed to load knowledge tree');
            }
        } else {
            try {
                console.log('Searching for:', query);
                const results = await knowledgeTreeService.searchNodes(query);
                console.log('Search results:', results);
                
                // Instead of replacing root nodes, find and expand to the search results
                if (results.length > 0) {
                    const node = results[0];
                    
                    // Get all parent nodes in a chain
                    const parentChain = [];
                    let currentNode = { ...node };
                    
                    while (currentNode.parentId) {
                        const parent = await knowledgeTreeService.getNode(currentNode.parentId);
                        if (parent) {
                            parentChain.unshift(parent);
                            currentNode = parent;
                        } else {
                            break;
                        }
                    }

                    // Set the selected node
                    setSelectedSubtopic(node);
                    
                    // Then expand all nodes in one go
                    const newExpanded = new Set([
                        ...parentChain.map(n => n.id),
                        node.id
                    ]);
                    setExpandedBranches(newExpanded);
                    
                    // Load all children in parallel
                    const loadPromises = [...parentChain, node].map(async (n) => {
                        const children = await knowledgeTreeService.getChildren(n.id);
                        if (children && children.length > 0) {
                            return [n.id, children];
                        }
                        return null;
                    });

                    const loadResults = await Promise.all(loadPromises);
                    const newChildNodes = {};
                    loadResults.forEach(result => {
                        if (result) {
                            const [id, children] = result;
                            newChildNodes[id] = children;
                        }
                    });

                    setChildNodes(prev => ({
                        ...prev,
                        ...newChildNodes
                    }));
                }
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to search knowledge tree');
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

    const getNodePath = useCallback((node) => {
        if (!node) return [];
        
        const path = [];
        let currentNode = { ...node }; // Create a copy to avoid mutations
        const processedIds = new Set(); // Track processed nodes to prevent loops
        
        // Helper function to find a node by ID in the entire tree
        const findNodeById = (id) => {
            // Check root nodes first
            let found = rootNodes.find(n => n.id === id);
            if (found) return { ...found };
            
            // Then check all loaded child nodes
            for (const parentId in childNodes) {
                found = childNodes[parentId].find(n => n.id === id);
                if (found) return { ...found };
            }
            
            return null;
        };
        
        // Build the path from current node up to root
        while (currentNode && !processedIds.has(currentNode.id)) {
            processedIds.add(currentNode.id);
            path.unshift(currentNode);
            
            if (currentNode.parentId) {
                const parentNode = findNodeById(currentNode.parentId);
                if (!parentNode || processedIds.has(parentNode.id)) break;
                currentNode = parentNode;
            } else {
                break;
            }
        }
        
        return path;
    }, [rootNodes, childNodes]);

    const renderBreadcrumbs = () => {
        if (!selectedSubtopic) return null;
        const path = getNodePath(selectedSubtopic);
        if (path.length === 0) return null;
        
        return (
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                {path.map((node, index) => (
                    <React.Fragment key={node.id}>
                        <span 
                            className="cursor-pointer hover:text-blue-600"
                            onClick={() => handleSubtopicClick(node)}
                        >
                            {node.name}
                        </span>
                        {index < path.length - 1 && (
                            <span className="text-gray-400">/</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const getRootNodeColor = (nodeName) => {
        const colors = {
            // Physical Health
            'Optimize Physical': 'bg-blue-50 text-blue-800 border-blue-200',
            'Productivity': 'bg-sky-50 text-sky-800 border-sky-200',
            'Career': 'bg-cyan-50 text-cyan-800 border-cyan-200',
            'Optimize Productivity': 'bg-sky-50 text-sky-800 border-sky-200',
            
            // Emotional Health
            'Optimize Emotional': 'bg-purple-50 text-purple-800 border-purple-200',
            'Relationships': 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
            'Family': 'bg-violet-50 text-violet-800 border-violet-200',
            
            // Mental Health
            'Optimize Mental': 'bg-green-50 text-green-800 border-green-200',
            'Learning': 'bg-emerald-50 text-emerald-800 border-emerald-200',
            'Creativity': 'bg-lime-50 text-lime-800 border-lime-200',
            'Core Learning Modules': 'bg-emerald-50 text-emerald-800 border-emerald-200',
            'Learning Plan': 'bg-lime-50 text-lime-800 border-lime-200',
            
            // Spiritual Health
            'Optimize Spiritual': 'bg-teal-50 text-teal-800 border-teal-200',
            'Purpose': 'bg-amber-50 text-amber-800 border-amber-200',
            'Values': 'bg-orange-50 text-orange-800 border-orange-200',
            'Meditation': 'bg-teal-50 text-teal-800 border-teal-200',
            'Mindfulness': 'bg-amber-50 text-amber-800 border-amber-200',
            'Gratitude': 'bg-orange-50 text-orange-800 border-orange-200',
            
            // Social Health
            'Optimize Social': 'bg-pink-50 text-pink-800 border-pink-200',
            'Community': 'bg-rose-50 text-rose-800 border-rose-200',
            'Networking': 'bg-red-50 text-red-800 border-red-200',
            
            // Financial Health
            'Optimize Financial': 'bg-yellow-50 text-yellow-800 border-yellow-200',
            'Wealth': 'bg-violet-50 text-violet-800 border-violet-200',
            'Investing': 'bg-purple-50 text-purple-800 border-purple-200',
            'Budgeting': 'bg-yellow-50 text-yellow-800 border-yellow-200',
            'Saving': 'bg-violet-50 text-violet-800 border-violet-200',
            'Income': 'bg-purple-50 text-purple-800 border-purple-200',
            
            'default': 'bg-gray-50 text-gray-800 border-gray-200'
        };
        return colors[nodeName] || colors.default;
    };

    const handleDragEnd = async (result) => {
        const { source, destination } = result;

        // Dropped outside the list or dropped in same position
        if (!destination || 
            (source.droppableId === destination.droppableId && 
             source.index === destination.index)) {
            return;
        }

        try {
            setError(null);
            console.log('Drag operation:', {
                source: {
                    droppableId: source.droppableId,
                    index: source.index
                },
                destination: {
                    droppableId: destination.droppableId,
                    index: destination.index
                }
            });

            // Get the source parent node ID
            const sourceParentId = source.droppableId === 'root' ? null : parseInt(source.droppableId);
            const destinationParentId = destination.droppableId === 'root' ? null : parseInt(destination.droppableId);

            // Get the source nodes array
            const sourceNodes = sourceParentId === null ? rootNodes : childNodes[sourceParentId] || [];
            
            // Get the dragged node
            const draggedNode = sourceNodes[source.index];
            if (!draggedNode) {
                console.error('Could not find dragged node');
                return;
            }

            console.log('Moving node:', {
                id: draggedNode.id,
                name: draggedNode.name,
                fromIndex: source.index,
                toIndex: destination.index,
                fromParent: sourceParentId,
                toParent: destinationParentId
            });

            // If trying to drop a node into itself or its descendants, prevent it
            if (destinationParentId === draggedNode.id) {
                console.error('Cannot drop a node into itself');
                return;
            }

            // If moving to a different parent
            if (sourceParentId !== destinationParentId) {
                const updatedNode = {
                    ...draggedNode,
                    parent: destinationParentId ? { id: destinationParentId } : null,
                    parentId: destinationParentId,
                    nodeOrder: destination.index
                };
                
                console.log('Updating node with new parent:', updatedNode);
                await knowledgeTreeService.updateNode(draggedNode.id, updatedNode);
            } else {
                // Just reordering within the same parent
                console.log('Reordering within same parent:', {
                    nodeId: draggedNode.id,
                    newOrder: destination.index
                });
                await knowledgeTreeService.updateNode(draggedNode.id, { 
                    nodeOrder: destination.index,
                    parentId: sourceParentId // Ensure parent ID is preserved
                });
            }

            // Refresh the tree while maintaining parent relationships
            console.log('Refreshing tree data...');
            const freshRootNodes = await knowledgeTreeService.getRootNodes();
            
            // Process the nodes to ensure parent relationships are maintained
            const processNodes = (nodes, level = 0) => {
                return nodes.map(node => ({
                    ...node,
                    level: level
                }));
            };
            
            setRootNodes(processNodes(freshRootNodes));
            setChildNodes({});

            // Re-fetch children for all expanded branches
            const expandedArray = Array.from(expandedBranches);
            for (const branchId of expandedArray) {
                const children = await knowledgeTreeService.getChildren(branchId);
                if (children && children.length > 0) {
                    setChildNodes(prev => ({
                        ...prev,
                        [branchId]: processNodes(children, 1)
                    }));
                }
            }

            // Restore the selected node
            if (selectedSubtopic) {
                const findNodeInTree = (nodes) => {
                    for (const node of nodes) {
                        if (node.id === selectedSubtopic.id) {
                            return node;
                        }
                    }
                    return null;
                };

                let foundNode = findNodeInTree(freshRootNodes);
                if (!foundNode) {
                    for (const branchId of expandedArray) {
                        const children = childNodes[branchId];
                        if (children) {
                            foundNode = findNodeInTree(children);
                            if (foundNode) break;
                        }
                    }
                }

                if (foundNode) {
                    setSelectedSubtopic(foundNode);
                }
            }

        } catch (error) {
            console.error('Error updating node position:', error);
            setError('Failed to update node position');
        }
    };

    const handleDelete = async () => {
        if (!selectedSubtopic) return;
        
        if (window.confirm(`Are you sure you want to delete "${selectedSubtopic.name}" and all its subtopics? This action cannot be undone.`)) {
            try {
                await knowledgeTreeService.deleteNode(selectedSubtopic.id);
                
                // Clear all state to force a complete refresh
                setRootNodes([]);
                setChildNodes({});
                setExpandedBranches(new Set());
                setSelectedSubtopic(null);
                
                // Fetch fresh data
                const nodes = await knowledgeTreeService.getRootNodes();
                setRootNodes(nodes);
                
                setError(null);
            } catch (error) {
                console.error('Error deleting node:', error);
                setError('Failed to delete node');
            }
        }
    };

    const renderTree = useCallback(() => (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable 
                droppableId="root"
                type="node"
            >
                {(provided) => (
                    <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-1"
                    >
                        {rootNodes.map((node, index) => (
                            <Branch
                                key={node.id}
                                node={node}
                                level={0}
                                index={index}
                                expandedBranches={expandedBranches}
                                childNodes={childNodes}
                                selectedSubtopic={selectedSubtopic}
                                onToggle={toggleBranch}
                                onNodeClick={handleSubtopicClick}
                                getRootNodeColor={getRootNodeColor}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    ), [rootNodes, expandedBranches, childNodes, selectedSubtopic, toggleBranch, handleSubtopicClick, handleDragEnd]);

    const renderContent = () => {
        if (!selectedSubtopic) {
            return <div className="text-gray-500">Select a topic to view its content</div>;
        }

        const hasChildren = selectedSubtopic.childIds && selectedSubtopic.childIds.length > 0;
        const children = hasChildren ? childNodes[selectedSubtopic.id] || [] : [];

        if (isEditing) {
            return (
                <div className="space-y-4">
                    {renderBreadcrumbs()}
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
            <div className="space-y-4">
                {renderBreadcrumbs()}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{selectedSubtopic.name}</h2>
                    <div className="flex space-x-2">
                        {!hasChildren && (
                            <button
                                onClick={handlePopulate}
                                disabled={isPopulating}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2"
                            >
                                {isPopulating ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Generating Learning Plan...</span>
                                    </>
                                ) : (
                                    'Suggest'
                                )}
                            </button>
                        )}
                        {!hasChildren && (
                            <button
                                onClick={handleEditClick}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Edit
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                        {error}
                    </div>
                )}
                {isPopulating && (
                    <div className="mb-4 p-4 bg-blue-50 text-blue-600 rounded-md flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating Learning Plan... This may take a minute.</span>
                    </div>
                )}
                {selectedSubtopic.description && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">Description</h3>
                        <p className="text-gray-700">{selectedSubtopic.description}</p>
                    </div>
                )}
                {hasChildren ? (
                    <div className="mb-6">
                        <div className="grid grid-cols-1 gap-2">
                            {children.map(child => (
                                <div
                                    key={child.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleSubtopicClick(child)}
                                >
                                    <h4 className="text-lg font-medium text-blue-600">{child.name}</h4>
                                    {child.description && (
                                        <p className="text-sm text-gray-600 mt-1">{child.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
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
                    </>
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
            <div className="w-1/3 border-r p-4 overflow-y-auto bg-gray-50">
                <input
                    type="text"
                    placeholder="Search knowledge tree..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full p-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {renderTree()}
            </div>
            <div className="w-2/3 p-4 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default KnowledgeTree; 