const API_BASE_URL = "http://localhost:8000";

const getOwnerId = () => {
    const id = localStorage.getItem("ownerId");
    return id ? parseInt(id, 10) : null;
};

const getUrlWithAuth = (path) => {
    const ownerId = getOwnerId();
    const url = new URL(`${API_BASE_URL}${path}`);
    if (ownerId) url.searchParams.append("owner_id", ownerId);
    return url.toString();
};

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
        const r = await fetch(getUrlWithAuth("/properties"));
        return handleResponse(r);
    },
    getProperty: async (id) => {
        const r = await fetch(getUrlWithAuth(`/properties/${id}`));
        return handleResponse(r);
    },
    createProperty: async (property) => {
        const r = await fetch(getUrlWithAuth("/properties"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...property, owner_id: getOwnerId() }),
        });
        return handleResponse(r);
    },
    updateProperty: async (id, data) => {
        const r = await fetch(getUrlWithAuth(`/properties/${id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    deleteProperty: async (id) => {
        const r = await fetch(getUrlWithAuth(`/properties/${id}`), {
            method: "DELETE",
        });
        return handleResponse(r);
    },


    // ── Tenants ───────────────────────────────────────────────────
    getTenants: async (search = "") => {
        const path = search ? `/tenants?search=${encodeURIComponent(search)}` : "/tenants";
        const r = await fetch(getUrlWithAuth(path));
        return handleResponse(r);
    },
    createTenant: async (tenant) => {
        const r = await fetch(getUrlWithAuth("/tenants"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...tenant, owner_id: getOwnerId() }),
        });
        return handleResponse(r);
    },
    updateTenant: async (id, data) => {
        const r = await fetch(getUrlWithAuth(`/tenants/${id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    transferTenant: async (id, transferData) => {
        const r = await fetch(getUrlWithAuth(`/tenants/${id}/transfer`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transferData),
        });
        return handleResponse(r);
    },
    deleteTenant: async (id) => {
        const r = await fetch(getUrlWithAuth(`/tenants/${id}`), {
            method: "DELETE",
        });
        return handleResponse(r);
    },

    // ── Rooms ─────────────────────────────────────────────────────
    getRooms: async () => {
        const r = await fetch(getUrlWithAuth("/rooms"));
        return handleResponse(r);
    },
    updateRoom: async (id, roomData) => {
        const r = await fetch(getUrlWithAuth(`/rooms/${id}`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(roomData),
        });
        return handleResponse(r);
    },
    createRoom: async (room) => {
        const r = await fetch(getUrlWithAuth("/rooms"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...room, owner_id: getOwnerId() }),
        });
        return handleResponse(r);
    },

    // ── Complaints ────────────────────────────────────────────────
    getComplaints: async () => {
        const r = await fetch(getUrlWithAuth("/complaints"));
        return handleResponse(r);
    },
    createComplaint: async (complaint) => {
        const r = await fetch(getUrlWithAuth("/complaints"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...complaint, owner_id: getOwnerId() }),
        });
        return handleResponse(r);
    },
    updateComplaintStatus: async (id, status) => {
        const r = await fetch(getUrlWithAuth(`/complaints/${id}/status`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        return handleResponse(r);
    },
    deleteComplaint: async (id) => {
        const r = await fetch(getUrlWithAuth(`/complaints/${id}`), {
            method: "DELETE",
        });
        return handleResponse(r);
    },

    // ── Notices ───────────────────────────────────────────────────
    getNotices: async () => {
        const r = await fetch(getUrlWithAuth("/notices"));
        return handleResponse(r);
    },
    createNotice: async (notice) => {
        const r = await fetch(getUrlWithAuth("/notices"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...notice, owner_id: getOwnerId() }),
        });
        return handleResponse(r);
    },

    // ── Rent Collection ───────────────────────────────────────────
    getRentTransactions: async () => {
        const r = await fetch(getUrlWithAuth("/rent-collection"));
        return handleResponse(r);
    },
    createRentTransaction: async (transaction) => {
        const r = await fetch(getUrlWithAuth("/rent-collection"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...transaction, owner_id: getOwnerId() }),
        });
        return handleResponse(r);
    },

    // ── Stats ─────────────────────────────────────────────────────
    getStats: async () => {
        const r = await fetch(getUrlWithAuth("/stats"));
        if (!r.ok) return { total_properties: 0, total_tenants: 0, occupancy_rate: 0, monthly_revenue: 0, overdue_rents: 0, open_complaints: 0 };
        return r.json();
    },

    // ── AI Endpoints ──────────────────────────────────────────────
    getAIInsight: async () => {
        const r = await fetch(getUrlWithAuth("/ai/insight"));
        if (!r.ok) return { insight: "AI service currently unavailable." };
        return r.json();
    },
    postAIChat: async (message) => {
        const r = await fetch(getUrlWithAuth("/ai/chat"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, owner_id: getOwnerId() }),
        });
        return r.json();
    },
    /**
     * Send a message to the AI agent with full chat history for multi-turn memory.
     * @param {string} message - Current user message
     * @param {Array<{role:string, content:string}>} history - Previous turns
     */
    postAIAgent: async (message, history = []) => {
        const r = await fetch(getUrlWithAuth("/ai/agent"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, history, owner_id: getOwnerId() }),
        });
        return r.json();
    },
    sendRentReminders: async () => {
        const r = await fetch(getUrlWithAuth("/ai/send-rent-reminders"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        return r.json();
    },
    propertyAnalysis: async () => {
        const r = await fetch(getUrlWithAuth("/ai/property-analysis"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        return r.json();
    },
    broadcastNotice: async (data) => {
        const r = await fetch(getUrlWithAuth("/ai/broadcast-notice"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, owner_id: getOwnerId() }),
        });
        return handleResponse(r);
    },

    // ── Staff ─────────────────────────────────────────────────────
    getStaff: async () => {
        const r = await fetch(getUrlWithAuth("/staff"));
        return handleResponse(r);
    },
    createStaff: async (staff) => {
        const r = await fetch(getUrlWithAuth("/staff"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...staff, owner_id: getOwnerId() }),
        });
        return handleResponse(r);
    },
    deleteStaff: async (id) => {
        const r = await fetch(getUrlWithAuth(`/staff/${id}`), {
            method: "DELETE",
        });
        return handleResponse(r);
    },

    // ── Auth ──────────────────────────────────────────────────────
    ownerLogin: async (credentials) => {
        const r = await fetch(`${API_BASE_URL}/owner/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });
        return handleResponse(r);
    },
    ownerSignup: async (data) => {
        const r = await fetch(`${API_BASE_URL}/owner/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    verifyOtp: async (data) => {
        const r = await fetch(`${API_BASE_URL}/owner/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    tenantLogin: async (credentials) => {
        const r = await fetch(`${API_BASE_URL}/tenant/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });
        return handleResponse(r);
    },
};
