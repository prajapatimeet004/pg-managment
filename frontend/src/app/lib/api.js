const API_BASE_URL = "http://localhost:8000";

const handleResponse = async (response) => {
    if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        console.error(`API Error ${response.status}:`, errText);
        throw new Error(errText || `HTTP ${response.status}`);
    }
    return response.json();
};

export const api = {
    // ── Properties ───────────────────────────────────────────────
    getProperties: async () => {
        const r = await fetch(`${API_BASE_URL}/properties`);
        return handleResponse(r);
    },
    getProperty: async (id) => {
        const r = await fetch(`${API_BASE_URL}/properties/${id}`);
        return handleResponse(r);
    },
    createProperty: async (property) => {
        // 'property' should have: { name, address, manager, phone, floors: [{rooms:[{beds, rent_per_bed, has_ac}]}] }
        const r = await fetch(`${API_BASE_URL}/properties`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(property),
        });
        return handleResponse(r);
    },
    updateProperty: async (id, data) => {
        const r = await fetch(`${API_BASE_URL}/properties/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    deleteProperty: async (id) => {
        const r = await fetch(`${API_BASE_URL}/properties/${id}`, {
            method: "DELETE",
        });
        return handleResponse(r);
    },


    // ── Tenants ───────────────────────────────────────────────────
    getTenants: async (search = "") => {
        const url = search
            ? `${API_BASE_URL}/tenants?search=${encodeURIComponent(search)}`
            : `${API_BASE_URL}/tenants`;
        const r = await fetch(url);
        return handleResponse(r);
    },
    createTenant: async (tenant) => {
        const r = await fetch(`${API_BASE_URL}/tenants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tenant),
        });
        return handleResponse(r);
    },
    updateTenant: async (id, data) => {
        const r = await fetch(`${API_BASE_URL}/tenants/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },

    // ── Rooms ─────────────────────────────────────────────────────
    getRooms: async () => {
        const r = await fetch(`${API_BASE_URL}/rooms`);
        return handleResponse(r);
    },
    createRoom: async (room) => {
        const r = await fetch(`${API_BASE_URL}/rooms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(room),
        });
        return handleResponse(r);
    },

    // ── Complaints ────────────────────────────────────────────────
    getComplaints: async () => {
        const r = await fetch(`${API_BASE_URL}/complaints`);
        return handleResponse(r);
    },
    createComplaint: async (complaint) => {
        const r = await fetch(`${API_BASE_URL}/complaints`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(complaint),
        });
        return handleResponse(r);
    },
    updateComplaintStatus: async (id, status) => {
        const r = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        return handleResponse(r);
    },

    // ── Notices ───────────────────────────────────────────────────
    getNotices: async () => {
        const r = await fetch(`${API_BASE_URL}/notices`);
        return handleResponse(r);
    },
    createNotice: async (notice) => {
        const r = await fetch(`${API_BASE_URL}/notices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notice),
        });
        return handleResponse(r);
    },

    // ── Rent Collection ───────────────────────────────────────────
    getRentTransactions: async () => {
        const r = await fetch(`${API_BASE_URL}/rent-collection`);
        return handleResponse(r);
    },
    createRentTransaction: async (transaction) => {
        const r = await fetch(`${API_BASE_URL}/rent-collection`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction),
        });
        return handleResponse(r);
    },

    // ── Stats ─────────────────────────────────────────────────────
    getStats: async () => {
        const r = await fetch(`${API_BASE_URL}/stats`);
        if (!r.ok) return { total_properties: 0, total_tenants: 0, occupancy_rate: 0, monthly_revenue: 0, overdue_rents: 0, open_complaints: 0 };
        return r.json();
    },

    // ── AI Endpoints ──────────────────────────────────────────────
    getAIInsight: async () => {
        const r = await fetch(`${API_BASE_URL}/ai/insight`);
        if (!r.ok) return { insight: "AI service currently unavailable." };
        return r.json();
    },
    postAIChat: async (message) => {
        const r = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        return r.json();
    },
    /**
     * Send a message to the AI agent with full chat history for multi-turn memory.
     * @param {string} message - Current user message
     * @param {Array<{role:string, content:string}>} history - Previous turns
     */
    postAIAgent: async (message, history = []) => {
        const r = await fetch(`${API_BASE_URL}/ai/agent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, history }),
        });
        return r.json();
    },
    sendRentReminders: async () => {
        const r = await fetch(`${API_BASE_URL}/ai/send-rent-reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        return r.json();
    },
    propertyAnalysis: async () => {
        const r = await fetch(`${API_BASE_URL}/ai/property-analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        return r.json();
    },
    broadcastNotice: async (data) => {
        const r = await fetch(`${API_BASE_URL}/ai/broadcast-notice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },

    // ── Staff ─────────────────────────────────────────────────────
    getStaff: async () => {
        const r = await fetch(`${API_BASE_URL}/staff`);
        return handleResponse(r);
    },
    createStaff: async (staff) => {
        const r = await fetch(`${API_BASE_URL}/staff`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(staff),
        });
        return handleResponse(r);
    },
    deleteStaff: async (id) => {
        const r = await fetch(`${API_BASE_URL}/staff/${id}`, {
            method: "DELETE",
        });
        return handleResponse(r);
    },
};
