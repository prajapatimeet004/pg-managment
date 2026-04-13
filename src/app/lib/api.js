const API_BASE_URL = "http://localhost:8000";

const handleResponse = async (response) => {
    if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        return []; // Return empty array as fallback for most list endpoints
    }
    return response.json();
};

export const api = {
    getProperties: async () => {
        const response = await fetch(`${API_BASE_URL}/properties`);
        return handleResponse(response);
    },
    getTenants: async () => {
        const response = await fetch(`${API_BASE_URL}/tenants`);
        return handleResponse(response);
    },
    getComplaints: async () => {
        const response = await fetch(`${API_BASE_URL}/complaints`);
        return handleResponse(response);
    },
    getStats: async () => {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) return { total_properties: 0, total_tenants: 0, occupancy_rate: 0, monthly_revenue: 0, overdue_rents: 0, open_complaints: 0 };
        return response.json();
    },
    getAIInsight: async () => {
        const response = await fetch(`${API_BASE_URL}/ai/insight`);
        if (!response.ok) return { insight: "AI service currently unavailable." };
        return response.json();
    },
    postAIChat: async (message) => {
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        return response.json();
    },
    getNotices: async () => {
        const response = await fetch(`${API_BASE_URL}/notices`);
        return handleResponse(response);
    },
    createNotice: async (notice) => {
        const response = await fetch(`${API_BASE_URL}/notices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notice),
        });
        return response.json();
    },
    getRooms: async () => {
        const response = await fetch(`${API_BASE_URL}/rooms`);
        return handleResponse(response);
    },
    createRoom: async (room) => {
        const response = await fetch(`${API_BASE_URL}/rooms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(room),
        });
        return response.json();
    },
    getRentTransactions: async () => {
        const response = await fetch(`${API_BASE_URL}/rent-collection`);
        return handleResponse(response);
    },
    createProperty: async (property) => {
        const response = await fetch(`${API_BASE_URL}/properties`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(property),
        });
        return response.json();
    },
    createTenant: async (tenant) => {
        const response = await fetch(`${API_BASE_URL}/tenants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tenant),
        });
        return response.json();
    },
    createComplaint: async (complaint) => {
        const response = await fetch(`${API_BASE_URL}/complaints`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(complaint),
        });
        return response.json();
    },
};
