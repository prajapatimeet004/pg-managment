import { API_BASE_URL, AUTH_API_BASE_URL } from "./apiConfig";

let jwtToken = localStorage.getItem("jwtToken") || null;

export const setToken = (token) => {
    jwtToken = token;
    if (token) {
        localStorage.setItem("jwtToken", token);
    } else {
        localStorage.removeItem("jwtToken");
    }
};

const getOwnerId = () => {
    // Deprecated: rely on JWT
    return null;
};

const getPropertyId = () => {
    const id = localStorage.getItem("propertyId");
    return id ? parseInt(id, 10) : null;
};

const getHeaders = () => {
    return jwtToken ? { "Authorization": `Bearer ${jwtToken}` } : {};
};

const getUrlWithAuth = (path) => {
    const propertyId = localStorage.getItem("propertyIds") || getPropertyId();
    const url = new URL(path.startsWith("/") ? path : `/${path}`, `${API_BASE_URL}/`);
    if (propertyId) url.searchParams.append("property_id", propertyId);
    return url.toString();
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("isTenantAuthenticated");
        localStorage.removeItem("jwtToken");
        window.location.href = '/login';
        throw new Error("Unauthorized");
    }
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
        const r = await fetch(getUrlWithAuth("/properties"), { headers: getHeaders() });
        return handleResponse(r);
    },
    getProperty: async (id) => {
        const r = await fetch(getUrlWithAuth(`/properties/${id}`), { headers: getHeaders() });
        return handleResponse(r);
    },
    createProperty: async (property) => {
        const r = await fetch(getUrlWithAuth("/properties"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(property),
        });
        return handleResponse(r);
    },
    updateProperty: async (id, data) => {
        const r = await fetch(getUrlWithAuth(`/properties/${id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    deleteProperty: async (id) => {
        const r = await fetch(getUrlWithAuth(`/properties/${id}`), {
            method: "DELETE",
            headers: getHeaders(),
        });
        return handleResponse(r);
    },


    // ── Tenants ───────────────────────────────────────────────────
    getTenants: async (search = "") => {
        const path = search ? `/tenants?search=${encodeURIComponent(search)}` : "/tenants";
        const r = await fetch(getUrlWithAuth(path), { headers: getHeaders() });
        return handleResponse(r);
    },
    createTenant: async (tenant) => {
        const r = await fetch(getUrlWithAuth("/tenants"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(tenant),
        });
        return handleResponse(r);
    },
    updateTenant: async (id, data) => {
        const r = await fetch(getUrlWithAuth(`/tenants/${id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    transferTenant: async (id, transferData) => {
        const r = await fetch(getUrlWithAuth(`/tenants/${id}/transfer`), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(transferData),
        });
        return handleResponse(r);
    },
    deleteTenant: async (id) => {
        const r = await fetch(getUrlWithAuth(`/tenants/${id}`), {
            method: "DELETE",
            headers: getHeaders(),
        });
        return handleResponse(r);
    },

    // ── Rooms ─────────────────────────────────────────────────────
    getRooms: async () => {
        const r = await fetch(getUrlWithAuth("/rooms"), { headers: getHeaders() });
        return handleResponse(r);
    },
    updateRoom: async (id, roomData) => {
        const r = await fetch(getUrlWithAuth(`/rooms/${id}`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(roomData),
        });
        return handleResponse(r);
    },
    createRoom: async (room) => {
        const r = await fetch(getUrlWithAuth("/rooms"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(room),
        });
        return handleResponse(r);
    },

    // ── Complaints ────────────────────────────────────────────────
    getComplaints: async () => {
        const r = await fetch(getUrlWithAuth("/complaints"), { headers: getHeaders() });
        return handleResponse(r);
    },
    createComplaint: async (complaint) => {
        const r = await fetch(getUrlWithAuth("/complaints"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(complaint),
        });
        return handleResponse(r);
    },
    updateComplaintStatus: async (id, status) => {
        const r = await fetch(getUrlWithAuth(`/complaints/${id}/status`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify({ status }),
        });
        return handleResponse(r);
    },
    deleteComplaint: async (id) => {
        const r = await fetch(getUrlWithAuth(`/complaints/${id}`), {
            method: "DELETE",
            headers: getHeaders(),
        });
        return handleResponse(r);
    },

    // ── Notices ───────────────────────────────────────────────────
    getNotices: async () => {
        const r = await fetch(getUrlWithAuth("/notices"), { headers: getHeaders() });
        return handleResponse(r);
    },
    createNotice: async (notice) => {
        const r = await fetch(getUrlWithAuth("/notices"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(notice),
        });
        return handleResponse(r);
    },
    updateNotice: async (id, notice) => {
        const r = await fetch(getUrlWithAuth(`/notices/${id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(notice),
        });
        return handleResponse(r);
    },
    deleteNotice: async (id) => {
        const r = await fetch(getUrlWithAuth(`/notices/${id}`), {
            method: "DELETE",
            headers: getHeaders(),
        });
        return handleResponse(r);
    },

    // ── Rent Collection ───────────────────────────────────────────
    getRentTransactions: async () => {
        const r = await fetch(getUrlWithAuth("/rent-collection"), { headers: getHeaders() });
        return handleResponse(r);
    },
    createRentTransaction: async (transaction) => {
        const r = await fetch(getUrlWithAuth("/rent-collection"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(transaction),
        });
        return handleResponse(r);
    },

    // ── Stats ─────────────────────────────────────────────────────
    getStats: async () => {
        const r = await fetch(getUrlWithAuth("/stats"), { headers: getHeaders() });
        if (!r.ok) return { total_properties: 0, total_tenants: 0, occupancy_rate: 0, monthly_revenue: 0, overdue_rents: 0, open_complaints: 0 };
        return r.json();
    },

    // ── AI Endpoints ──────────────────────────────────────────────
    getAIInsight: async () => {
        const r = await fetch(getUrlWithAuth("/ai/insight"), { headers: getHeaders() });
        if (!r.ok) return { insight: "AI service currently unavailable." };
        return r.json();
    },
    postAIChat: async (message) => {
        const r = await fetch(getUrlWithAuth("/ai/chat"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
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
        const r = await fetch(getUrlWithAuth("/ai/agent"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify({ message, history }),
        });
        return r.json();
    },
    sendRentReminders: async () => {
        const r = await fetch(getUrlWithAuth("/ai/send-rent-reminders"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
        });
        return r.json();
    },
    propertyAnalysis: async () => {
        const r = await fetch(getUrlWithAuth("/ai/property-analysis"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
        });
        return r.json();
    },
    broadcastNotice: async (data) => {
        const r = await fetch(getUrlWithAuth("/ai/broadcast-notice"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },

    // ── Staff ─────────────────────────────────────────────────────
    getStaff: async () => {
        const r = await fetch(getUrlWithAuth("/staff"), { headers: getHeaders() });
        return handleResponse(r);
    },
    createStaff: async (staff) => {
        const r = await fetch(getUrlWithAuth("/staff"), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(staff),
        });
        return handleResponse(r);
    },
    updateStaff: async (id, data) => {
        const r = await fetch(getUrlWithAuth(`/staff/${id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    deleteStaff: async (id) => {
        const r = await fetch(getUrlWithAuth(`/staff/${id}`), {
            method: "DELETE",
            headers: getHeaders(),
        });
        return handleResponse(r);
    },

    // ── Auth ──────────────────────────────────────────────────────
    ownerLogin: async (credentials) => {
        const r = await fetch(`${API_BASE_URL}/owner/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(credentials),
        });
        return handleResponse(r);
    },
    ownerSignup: async (data) => {
        const r = await fetch(`${API_BASE_URL}/owner/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(data),
        });
        return handleResponse(r);
    },
    verifyOtp: async (data) => {
        const r = await fetch(`${API_BASE_URL}/owner/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
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
    getTenantDashboard: async (id) => {
        const r = await fetch(getUrlWithAuth(`/tenant/dashboard/${id}`), { headers: getHeaders() });
        return handleResponse(r);
    },

    // ── PDF Services ──────────────────────────────────────────────
    generateReceiptPDF: async (data) => {
        const r = await fetch(`${AUTH_API_BASE_URL}/api/pdf/generate-receipt`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getHeaders() },
            body: JSON.stringify(data),
        });
        if (!r.ok) throw new Error("Failed to generate PDF");
        return r.blob();
    },
};
