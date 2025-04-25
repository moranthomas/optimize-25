const API_BASE_URL = 'http://localhost:8080/api/knowledge';

export const knowledgeTreeService = {
    async getRootNodes() {
        const response = await fetch(`${API_BASE_URL}/root`);
        return await response.json();
    },

    async getChildren(parentId) {
        const response = await fetch(`${API_BASE_URL}/children/${parentId}`);
        return await response.json();
    },

    async searchNodes(query) {
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
        return await response.json();
    },

    async getNode(id) {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        return await response.json();
    },

    async createNode(node) {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(node),
        });
        return await response.json();
    },

    async updateNode(id, node) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(node),
        });
        return await response.json();
    },

    async deleteNode(id) {
        await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });
    }
}; 