const API_BASE_URL = 'http://localhost:8080/api/knowledge-tree';

export const knowledgeTreeService = {
    async getRootNodes() {
        const response = await fetch(`${API_BASE_URL}/roots`);
        if (!response.ok) {
            throw new Error('Failed to fetch root nodes');
        }
        const data = await response.json();
        return data;
    },

    async getChildren(parentId) {
        const response = await fetch(`${API_BASE_URL}/children/${parentId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch children');
        }
        const data = await response.json();
        return data;
    },

    async searchNodes(query) {
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Failed to search nodes');
        }
        const data = await response.json();
        return data;
    },

    async getNode(id) {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch node');
        }
        const data = await response.json();
        return data;
    },

    async createNode(node) {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(node),
        });
        if (!response.ok) {
            throw new Error('Failed to create node');
        }
        const data = await response.json();
        return data;
    },

    async updateNode(id, node) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(node),
        });
        if (!response.ok) {
            throw new Error('Failed to update node');
        }
        const data = await response.json();
        return data;
    },

    async deleteNode(id) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete node');
        }
    }
}; 