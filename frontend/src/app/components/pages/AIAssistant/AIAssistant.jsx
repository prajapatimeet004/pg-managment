import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Bot, Send, User, Sparkles, X, CheckCircle2, Zap, Loader2, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../../lib/api";
import { notifyDataUpdated } from "../../../lib/dataEvents";

// ─────────────────────────────────────────────────────────────────
//  Validation helpers
// ─────────────────────────────────────────────────────────────────
const validators = {
  date: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) && !isNaN(Date.parse(v.trim())),
  phone: (v) => /^[+]?[\d\s\-]{7,15}$/.test(v.trim()),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  aadhar: (v) => /^\d{4}\s?\d{4}\s?\d{4}$/.test(v.trim()),
  number: (v) => !isNaN(parseFloat(String(v).replace(/[₹,\s]/g, ""))),
};

const validationMessages = {
  join_date:     "⚠️ Please use **YYYY-MM-DD** format *(e.g., 2026-04-14)*",
  rent_due_date: "⚠️ Please use **YYYY-MM-DD** format *(e.g., 2026-05-05)*",
  phone:         "⚠️ Enter a valid phone number *(e.g., +91 98765 43210)*",
  email:         "⚠️ Enter a valid email address *(e.g., name@gmail.com)*",
  aadhar_number: "⚠️ Enter a valid Aadhar number *(12 digits, e.g., 1234 5678 9012)*",
};

function validateField(field, rawValue) {
  const key = field.key;
  const type = field.type;

  if (type === "number") {
    if (!validators.number(rawValue)) return "⚠️ Please enter a **valid number**.";
    return null;
  }
  if (type === "text") {
    if (!rawValue.trim()) return "⚠️ This field **cannot be empty**.";
    if ((key === "join_date" || key === "rent_due_date") && !validators.date(rawValue))
      return validationMessages[key];
    if (key === "phone" && !validators.phone(rawValue))
      return validationMessages.phone;
    if (key === "email" && !validators.email(rawValue))
      return validationMessages.email;
    if (key === "aadhar_number" && !validators.aadhar(rawValue))
      return validationMessages.aadhar_number;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
//  Entity creation flows
// ─────────────────────────────────────────────────────────────────
const ENTITY_FLOWS = {
  create_property: {
    label: "Property", icon: "🏠",
    apiCall: null, // handled dynamically via pg state machine
    fields: [
      { key: "name",    question: "What's the property name?\n*(e.g., Sunshine PG - Koramangala)*", type: "text" },
      { key: "address", question: "Full address of the property?",                                   type: "text" },
      { key: "manager", question: "Manager's full name?",                                            type: "text" },
      { key: "phone",   question: "Manager's phone number? *(e.g., +91 98765 43210)*",              type: "text" },
      // sentinel — triggers dynamic floor/room configuration
      { key: "__pg_config__", question: "", type: "pg_config" },
    ],
  },
  create_tenant: {
    label: "Tenant", icon: "👤",
    apiCall: (data) => api.createTenant({ ...data, rent_status: "due" }),
    fields: [
      { key: "name",          question: "Tenant's full name?",                                              type: "text" },
      { key: "phone",         question: "Phone number? *(e.g., +91 98765 43210)*",                         type: "text" },
      { key: "email",         question: "Email address?",                                                   type: "text" },
      { key: "property_id",   question: "Which property will they stay in?",                                type: "property_select" },
      { key: "room_number",   question: "Which room will they stay in?",                                    type: "room_select" },
      { key: "bed_number",    question: "Which bed would you like to assign?",                              type: "bed_select" },
      { key: "rent_amount",   question: "Monthly rent amount in ₹?",                                        type: "number" },
      { key: "join_date",     question: "Join date? *(format: YYYY-MM-DD, e.g., 2026-04-14)*",             type: "text" },
      { key: "rent_due_date", question: "Rent due date each month? *(format: YYYY-MM-DD)*",                type: "text" },
      { key: "advance",       question: "Security/advance deposit amount in ₹?",                           type: "number" },
      { key: "aadhar_number", question: "Aadhar number? *(12 digits, e.g., 1234 5678 9012)*",              type: "text" },
    ],
  },
  create_room: {
    label: "Room", icon: "🚪",
    apiCall: (data) => api.createRoom({ ...data, occupied_beds: 0 }),
    fields: [
      { key: "property_id",  question: "Which property is this room in?",                             type: "property_select" },
      { key: "room_number",  question: "Room number? *(e.g., 301)*",                                  type: "text" },
      { key: "floor",        question: "Which floor? *(enter a number)*",                             type: "number" },
      { key: "total_beds",   question: "Total beds in this room?",                                    type: "number" },
      { key: "rent_per_bed", question: "Rent per bed per month in ₹?",                               type: "number" },
      { key: "amenities",    question: "Amenities? *(e.g., AC, WiFi, Attached Bathroom)*",           type: "text" },
      { key: "status",       question: "Room status?\nType: **available**, **partial**, or **full**", type: "text" },
    ],
  },
  create_complaint: {
    label: "Complaint", icon: "🔧",
    apiCall: (data) => api.createComplaint({ ...data, status: "open" }),
    fields: [
      { key: "tenant_id",   question: "Which tenant is raising this complaint?",                                            type: "tenant_select" },
      { key: "category",    question: "Category? Choose one:\n• Maintenance\n• Electrical\n• Plumbing\n• Cleaning\n• Other", type: "text" },
      { key: "title",       question: "Brief complaint title?",                                                              type: "text" },
      { key: "description", question: "Describe the issue in detail.",                                                       type: "text" },
      { key: "priority",    question: "Priority level?\nType: **low**, **medium**, or **high**",                            type: "text" },
    ],
  },
  create_notice: {
    label: "Notice", icon: "📢",
    apiCall: (data) => api.createNotice({ ...data, created_by: "Owner" }),
    fields: [
      { key: "title",       question: "Notice title?",                             type: "text" },
      { key: "content",     question: "What's the notice message?",                type: "text" },
      { key: "property_id", question: "Which property is this notice for?",        type: "property_select" },
      { key: "urgent",      question: "Is this urgent?\nType **yes** or **no**",   type: "boolean" },
    ],
  },
  create_rent: {
    label: "Rent Transaction", icon: "💰",
    apiCall: (data) => api.createRentTransaction({ ...data, paid_date: new Date().toISOString().split("T")[0] }),
    fields: [
      { key: "tenant_id",      question: "Which tenant made the payment?",                               type: "tenant_select" },
      { key: "amount",         question: "Amount paid in ₹?",                                            type: "number" },
      { key: "month",          question: "For which month? *(e.g., April 2026)*",                        type: "text" },
      { key: "payment_mode",   question: "Payment mode?\n*(UPI, Cash, Bank Transfer, Cheque)*",          type: "text" },
      { key: "receipt_number", question: "Receipt number? *(e.g., REC-1002)*",                           type: "text" },
    ],
  },
  create_broadcast: {
    label: "Broadcast Notice", icon: "📡",
    apiCall: (data) => api.broadcastNotice(data),
    fields: [
      { key: "property_id", question: "Which property do you want to broadcast to?",          type: "property_select" },
      { key: "title",       question: "Brief title for this broadcast?",                      type: "text" },
      { key: "content",     question: "Message content? *(This will be sent via WA/SMS)*",    type: "text" },
    ],
  },
  // ── Edit flows ────────────────────────────────────────────────
  update_complaint: {
    label: "Update Complaint", icon: "🔄",
    apiCall: async (data) => {
      await api.updateComplaintStatus(data.complaint_id, data.status);
      return { ok: true };
    },
    fields: [
      { key: "complaint_id", question: "Which complaint do you want to update?",                                                         type: "complaint_select" },
      { key: "status",       question: "New status?\nType: **open**, **in-progress**, **resolved**, or **closed**",                      type: "text" },
    ],
  },
  mark_paid: {
    label: "Mark Rent Paid", icon: "✅",
    apiCall: async (data) => {
      await api.updateTenant(data.tenant_id, { rent_status: "paid" });
      return { ok: true };
    },
    fields: [
      { key: "tenant_id", question: "Which tenant's rent status do you want to mark as paid?", type: "tenant_select" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────
//  Quick-action chips
// ─────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Add Tenant",       message: "add new tenant",         icon: "👤" },
  { label: "Add Property",     message: "add new property",       icon: "🏠" },
  { label: "Add Room",         message: "add new room",           icon: "🚪" },
  { label: "Broadcast Message",message: "broadcast a notice",     icon: "📡" },
  { label: "Record Payment",   message: "record rent payment",    icon: "💰" },
  { label: "Add Complaint",    message: "register complaint",     icon: "🔧" },
  { label: "Send Notice",      message: "create notice",          icon: "📢" },
  { label: "Resolve Complaint",message: "update complaint status",icon: "🔄" },
  { label: "Mark Rent Paid",   message: "mark rent as paid",      icon: "✅" },
  { label: "Send Reminders",   message: "send rent reminders",    icon: "🔔" },
  { label: "View Stats",       message: "show business stats",    icon: "📊" },
];

// ─────────────────────────────────────────────────────────────────
//  Intent detection
// ─────────────────────────────────────────────────────────────────
function detectIntent(msg) {
  const m = msg.toLowerCase();
  if (/add.*(new\s+)?property|new.*property|create.*property/.test(m))              return "create_property";
  if (/add.*(new\s+)?tenant|new.*tenant|register.*tenant|add tenant/.test(m))       return "create_tenant";
  if (/add.*(new\s+)?room|new.*room|create.*room/.test(m))                           return "create_room";
  if (/add.*complaint|register.*complaint|new.*complaint|report.*complaint/.test(m)) return "create_complaint";
  if (/add.*notice|send.*notice|create.*notice|new.*notice/.test(m))                return "create_notice";
  if (/broadcast|notify.*all|message.*all/.test(m))                                 return "create_broadcast";
  if (/record.*payment|record.*rent|rent.*paid|add.*rent/.test(m))                  return "create_rent";
  if (/update.*complaint|resolve.*complaint|complaint.*status|close.*complaint/.test(m)) return "update_complaint";
  if (/mark.*paid|rent.*paid|paid.*rent|mark.*rent/.test(m))                        return "mark_paid";
  if (/send.*reminder|reminder.*rent/.test(m))                                       return "send_reminders";
  if (/search.*tenant|find.*tenant|look.*tenant|which.*tenant/.test(m))             return "search_tenant";
  if (/search.*propert|find.*propert/.test(m))                                      return "search_property";
  if (/show.*tenant|list.*tenant|view.*tenant|all.*tenant/.test(m))                 return "view_tenants";
  if (/show.*propert|list.*propert|view.*propert/.test(m))                          return "view_properties";
  if (/show.*complaint|list.*complaint|view.*complaint/.test(m))                    return "view_complaints";
  if (/show.*room|list.*room|view.*room/.test(m))                                   return "view_rooms";
  if (/show.*notice|list.*notice|view.*notice/.test(m))                             return "view_notices";
  if (/stat|revenue|occupancy|business.*overview|overview|analytics/.test(m))       return "view_stats";
  return "query";
}

// ─────────────────────────────────────────────────────────────────
//  Markdown renderer (**bold**, *italic*, \n)
// ─────────────────────────────────────────────────────────────────
function renderMd(content) {
  return content.split("\n").map((line, li, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return (
      <span key={li}>
        {parts.map((p, i) => {
          if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
          if (p.startsWith("*")  && p.endsWith("*"))  return <em key={i}>{p.slice(1, -1)}</em>;
          return p;
        })}
        {li < arr.length - 1 && <br />}
      </span>
    );
  });
}

// ─────────────────────────────────────────────────────────────────
//  localStorage helpers
// ─────────────────────────────────────────────────────────────────
const LS_KEY = "ai_pg_chat_history";

function loadPersistedMessages() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Restore Date objects
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return null;
  }
}

function saveMessages(msgs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(msgs));
  } catch { /* quota exceeded — ignore */ }
}

// ─────────────────────────────────────────────────────────────────
//  WELCOME message
// ─────────────────────────────────────────────────────────────────
const WELCOME = {
  id: "welcome",
  role: "assistant",
  timestamp: new Date(),
  content:
    "Namaste! 🙏 I'm your **AI Owner Assistant** with full access to your PG management system.\n\n" +
    "**New Feature: Multichannel Messaging 📡**\n" +
    "I can now send **Real WhatsApp & SMS** messages directly to your tenants' phones!\n\n" +
    "I can help you:\n" +
    "• **Broadcast** notices to all tenants of a property via WA/SMS\n" +
    "• **Send** rent reminders manually or in bulk\n" +
    "• **Add** tenants, properties, rooms, complaints, notices & rent records\n" +
    "• **Search** for anything across your database\n\n" +
    "💡 *To use WhatsApp Sandbox, have tenants send:* **join <your-sandbox-name>** *to your Twilio number.*",
};

// ─────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────
export function AIAssistant() {
  const persistedMsgs = loadPersistedMessages();
  const [messages, setMessages] = useState(persistedMsgs && persistedMsgs.length > 0 ? persistedMsgs : [WELCOME]);
  const [input, setInput]           = useState("");
  const [isTyping, setIsTyping]     = useState(false);
  const [confirmation, setConfirmation] = useState(null); // { mode, data, flow }
  const [convState, setConvState]   = useState({
    mode: null,
    fieldIndex: 0,
    collected: {},
    propertyOptions: [],
    tenantOptions: [],
    complaintOptions: [],
    // Dynamic property-config state machine
    pgPhase: null,   // null | 'num_floors' | 'floor_rooms' | 'room_beds' | 'room_rent' | 'room_ac'
    pgData: null,    // { numFloors, floorRooms[], floorIdx, roomsByFloor{}, curFloor, curRoom }
    propertyDetails: null, // For room/bed selection in AI flow
    roomOptions: [],
    bedOptions: [],
  });

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, confirmation]);

  // Persist messages whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // ── helpers ─────────────────────────────────────────────────────
  const addBot  = useCallback((content) =>
    setMessages(p => [...p, { id: `b${Date.now()}`, role: "assistant", content, timestamp: new Date() }]), []);
  const addUser = useCallback((content) =>
    setMessages(p => [...p, { id: `u${Date.now()}`, role: "user",      content, timestamp: new Date() }]), []);
  const resetConv = useCallback(() =>
    setConvState({ mode: null, fieldIndex: 0, collected: {}, propertyOptions: [], tenantOptions: [], complaintOptions: [], pgPhase: null, pgData: null }), []);

  // Build history array for AI memory (assistant + user turns only, last 30 msgs)
  const buildHistory = useCallback((currentMsgs) =>
    currentMsgs
      .filter((m) => m.id !== "welcome" && (m.role === "user" || m.role === "assistant"))
      .slice(-30)
      .map((m) => ({ role: m.role, content: m.content })),
    []
  );

  // ── clear chat ───────────────────────────────────────────────
  const handleClearChat = () => {
    setMessages([WELCOME]);
    resetConv();
    setConfirmation(null);
    localStorage.removeItem(LS_KEY);
  };

  // ── cancel flow ──────────────────────────────────────────────
  const handleCancel = () => {
    setConfirmation(null);
    resetConv();
    addBot("❌ Operation cancelled. No changes were made.\n\nWhat else can I help you with?");
  };

  // ── confirm & save ───────────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirmation) return;
    const { mode, data, flow } = confirmation;
    setConfirmation(null);
    resetConv();
    setIsTyping(true);
    try {
      await flow.apiCall(data);
      const entityMap = {
        property: "properties",
        tenant: "tenants",
        complaint: "complaints",
        notice: "notices",
        rent: "rent",
        staff: "staff"
      };
      const entity = mode.split("_")[1];
      notifyDataUpdated(entityMap[entity] || entity || "all");
      addBot(`🎉 **${flow.label} saved successfully!** It's now in the system.\n\nWhat would you like to do next?`);
    } catch (e) {
      addBot(`❌ Error saving ${flow.label}: ${e.message || "Unknown error"}. Please try again.`);
    } finally {
      setIsTyping(false);
    }
  };

  // ── advance to next field ─────────────────────────────────────
  const advanceField = async (newCollected, nextIdx, mode) => {
    const flow = ENTITY_FLOWS[mode];

    if (nextIdx >= flow.fields.length) {
      setConvState(p => ({ ...p, collected: newCollected, fieldIndex: nextIdx }));
      setConfirmation({ mode, data: newCollected, flow });
      addBot(`✅ I have all the details for **${flow.label}** ${flow.icon}.\nPlease **review and confirm** below before saving.`);
      return;
    }

    const field    = flow.fields[nextIdx];
    const progress = `*(${nextIdx + 1}/${flow.fields.length})*`;

    // ── property_select ────────────────────────────────────────
    if (field.type === "property_select") {
      setIsTyping(true);
      try {
        const props = await api.getProperties();
        setConvState(p => ({ ...p, collected: newCollected, fieldIndex: nextIdx, propertyOptions: props }));
        const list = props.map((pr, i) => `**${i + 1}.** ${pr.name}\n   📍 ${pr.address}`).join("\n");
        addBot(`${progress} ${field.question}\n\n${list || "No properties found. Add a property first."}\n\nEnter the **number** of your choice.`);
      } finally { setIsTyping(false); }
      return;
    }

    // ── tenant_select ──────────────────────────────────────────
    if (field.type === "tenant_select") {
      setIsTyping(true);
      try {
        const tenants = await api.getTenants();
        setConvState(p => ({ ...p, collected: newCollected, fieldIndex: nextIdx, tenantOptions: tenants }));
        const list = tenants.map((t, i) => `**${i + 1}.** ${t.name} — ${t.property_name} | Room ${t.room_number} | *${t.rent_status}*`).join("\n");
        addBot(`${progress} ${field.question}\n\n${list || "No tenants found."}\n\nEnter the **number** of your choice.`);
      } finally { setIsTyping(false); }
      return;
    }

    // ── complaint_select ────────────────────────────────────────
    if (field.type === "complaint_select") {
      setIsTyping(true);
      try {
        const complaints = await api.getComplaints();
        setConvState(p => ({ ...p, collected: newCollected, fieldIndex: nextIdx, complaintOptions: complaints }));
        const list = complaints.map((c, i) =>
          `**${i + 1}.** [${c.priority?.toUpperCase()}] ${c.title}\n   👤 ${c.tenant_name} | *${c.status}*`
        ).join("\n");
        addBot(`${progress} ${field.question}\n\n${list || "No complaints found."}\n\nEnter the **number** of your choice.`);
      } finally { setIsTyping(false); }
      return;
    }

    // ── room_select ─────────────────────────────────────────────
    if (field.type === "room_select") {
      setIsTyping(true);
      try {
        const details = await api.getProperty(newCollected.property_id);
        const rooms = details.rooms || [];
        setConvState(p => ({ ...p, collected: newCollected, fieldIndex: nextIdx, propertyDetails: details, roomOptions: rooms }));
        const list = rooms.map((r, i) => {
          const isFull = r.occupied_beds >= r.total_beds;
          return `**${i + 1}.** Room ${r.room_number} — ${r.occupied_beds}/${r.total_beds} beds occupied ${isFull ? '🔴 **Full**' : '🟢 **Available**'}`;
        }).join("\n");
        addBot(`${progress} ${field.question}\n\n${list || "No rooms found in this property."}\n\nEnter the **number** of your choice.`);
      } finally { setIsTyping(false); }
      return;
    }

    // ── bed_select ──────────────────────────────────────────────
    if (field.type === "bed_select") {
      const details = convState.propertyDetails;
      const room = details.rooms.find(r => r.room_number === newCollected.room_number);
      if (!room) {
        addBot("⚠️ System error: Room data lost. Please start over.");
        resetConv();
        return;
      }
      const beds = Array.from({ length: room.total_beds }, (_, i) => String.fromCharCode(65 + i)); // A, B, C...
      const occupiedInThisRoom = details.tenants
        .filter(t => t.room_number === newCollected.room_number)
        .map(t => t.bed_number);
      
      const bedOptions = beds.map(b => ({
        bed: b,
        isOccupied: occupiedInThisRoom.includes(b)
      }));

      setConvState(p => ({ ...p, collected: newCollected, fieldIndex: nextIdx, bedOptions }));
      
      const list = bedOptions.map((opt, i) => 
        `**${i + 1}.** Bed ${opt.bed} — ${opt.isOccupied ? '🔴 **Occupied**' : '🟢 **Available**'}`
      ).join("\n");
      
      addBot(`${progress} ${field.question}\n\n${list}\n\nEnter the **number** of your choice.`);
      return;
    }

    // ── pg_config — begins dynamic floor/room state machine ──────
    if (field.type === "pg_config") {
      const pgData = { numFloors: 0, floorRooms: [], floorIdx: 0, roomsByFloor: {}, curFloor: 1, curRoom: 1 };
      setConvState(p => ({ ...p, collected: newCollected, fieldIndex: nextIdx, pgPhase: 'num_floors', pgData }));
      addBot(`Great! Now let's set up the floor & room layout 🏗️\n\nHow many **floors** does this property have?`);
      return;
    }

    // Regular field
    setConvState(p => ({ ...p, collected: newCollected, fieldIndex: nextIdx }));
    addBot(`${progress} ${field.question}`);
  };

  // ── Dynamic PG floor/room state machine handler ───────────────
  const handlePgReply = async (userInput, state) => {
    if (/^(cancel|stop|quit|exit|abort)$/i.test(userInput.trim())) {
      handleCancel();
      return;
    }

    const { pgPhase, pgData, collected } = state;

    // ── Phase: ask number of floors ───────────────────────────
    if (pgPhase === 'num_floors') {
      const n = parseInt(userInput);
      if (isNaN(n) || n < 1 || n > 20) { addBot("⚠️ Please enter a valid number of floors (1–20)."); return; }
      const newPgData = { ...pgData, numFloors: n, floorIdx: 0, floorRooms: [] };
      setConvState(p => ({ ...p, pgPhase: 'floor_rooms', pgData: newPgData }));
      addBot(`This PG has **${n} floor(s)**. 🏢\n\n**Floor 1** — How many rooms are on Floor 1?`);
      return;
    }

    // ── Phase: ask rooms per floor (one floor at a time) ──────
    if (pgPhase === 'floor_rooms') {
      const n = parseInt(userInput);
      if (isNaN(n) || n < 1 || n > 50) { addBot("⚠️ Please enter a valid number of rooms (1–50)."); return; }
      const updatedRooms = [...pgData.floorRooms, n];
      const nextFloorIdx = pgData.floorIdx + 1;
      if (nextFloorIdx < pgData.numFloors) {
        // Ask for next floor
        const newPgData = { ...pgData, floorRooms: updatedRooms, floorIdx: nextFloorIdx };
        setConvState(p => ({ ...p, pgPhase: 'floor_rooms', pgData: newPgData }));
        addBot(`**Floor ${nextFloorIdx + 1}** — How many rooms are on Floor ${nextFloorIdx + 1}?`);
      } else {
        // All floors collected → start room configuration
        const newPgData = { ...pgData, floorRooms: updatedRooms, roomsByFloor: {}, curFloor: 1, curRoom: 1 };
        const roomNum = `${1}${String(1).padStart(2,'0')}`; // "101"
        setConvState(p => ({ ...p, pgPhase: 'room_beds', pgData: newPgData }));
        addBot(
          `All floors collected! ✅\n\nNow let's configure each room one by one.\n\n` +
          `**Room ${roomNum}** (Floor 1, Room 1):\n🛏 How many **beds** are in this room?`
        );
      }
      return;
    }

    // ── Phase: beds for current room ─────────────────────────
    if (pgPhase === 'room_beds') {
      const n = parseInt(userInput);
      if (isNaN(n) || n < 1 || n > 20) { addBot("⚠️ Please enter a valid number of beds (1–20)."); return; }
      const newPgData = { ...pgData, _tempBeds: n };
      const roomNum = `${pgData.curFloor}${String(pgData.curRoom).padStart(2,'0')}`;
      setConvState(p => ({ ...p, pgPhase: 'room_rent', pgData: newPgData }));
      addBot(`💰 Monthly **rent per bed** in ₹ for Room ${roomNum}?`);
      return;
    }

    // ── Phase: rent for current room ─────────────────────────
    if (pgPhase === 'room_rent') {
      const n = parseFloat(userInput.replace(/[₹,\s]/g, ''));
      if (isNaN(n) || n < 0) { addBot("⚠️ Please enter a valid rent amount."); return; }
      const newPgData = { ...pgData, _tempRent: n };
      const roomNum = `${pgData.curFloor}${String(pgData.curRoom).padStart(2,'0')}`;
      setConvState(p => ({ ...p, pgPhase: 'room_ac', pgData: newPgData }));
      addBot(`❄️ Is Room ${roomNum} **AC** or **Non-AC**?\nType **yes** for AC, **no** for Non-AC.`);
      return;
    }

    // ── Phase: AC status for current room ────────────────────
    if (pgPhase === 'room_ac') {
      const hasAc = /^(yes|y|true|1|haan|ac)$/i.test(userInput.trim());

      // Save room config
      const floorKey = pgData.curFloor;
      const roomsByFloor = { ...pgData.roomsByFloor };
      if (!roomsByFloor[floorKey]) roomsByFloor[floorKey] = [];
      roomsByFloor[floorKey].push({ beds: pgData._tempBeds, rent_per_bed: pgData._tempRent, has_ac: hasAc });

      const roomNum = `${pgData.curFloor}${String(pgData.curRoom).padStart(2,'0')}`;
      const acLabel = hasAc ? '❄️ AC' : '🔆 Non-AC';
      addBot(`✅ Room ${roomNum}: ${pgData._tempBeds} beds, ₹${pgData._tempRent}/bed, ${acLabel} — Saved!`);

      // Find next room
      const totalRoomsOnFloor = pgData.floorRooms[pgData.curFloor - 1];
      let nextFloor = pgData.curFloor;
      let nextRoom = pgData.curRoom + 1;
      if (nextRoom > totalRoomsOnFloor) {
        nextFloor += 1;
        nextRoom = 1;
      }

      if (nextFloor > pgData.numFloors) {
        // All rooms configured → submit
        const newPgData = { ...pgData, roomsByFloor, _tempBeds: undefined, _tempRent: undefined };
        setConvState(p => ({ ...p, pgPhase: 'done', pgData: newPgData }));

        // Build floors array for API
        const floors = Object.values(roomsByFloor).map(rooms => ({ rooms }));
        const payload = { ...collected, floors };

        setConfirmation({
          mode: 'create_property',
          data: payload,
          flow: {
            label: 'Property',
            icon: '🏠',
            apiCall: (d) => api.createProperty(d),
          }
        });
        addBot(`🏠 All rooms are configured! Here's a summary:\n\n` +
          Object.entries(roomsByFloor).map(([floor, rooms]) =>
            `**Floor ${floor}:** ${rooms.length} room(s)\n` +
            rooms.map((r, i) => `   Room ${floor}${String(i+1).padStart(2,'0')}: ${r.beds} beds, ₹${r.rent_per_bed}/bed, ${r.has_ac ? '❄️ AC' : '🔆 Non-AC'}`).join('\n')
          ).join('\n\n') +
          `\n\nPlease **review and confirm** below to save the property!`);
      } else {
        // Ask about next room
        const nextPgData = { ...pgData, roomsByFloor, curFloor: nextFloor, curRoom: nextRoom, _tempBeds: undefined, _tempRent: undefined };
        const nextRoomNum = `${nextFloor}${String(nextRoom).padStart(2,'0')}`;
        setConvState(p => ({ ...p, pgPhase: 'room_beds', pgData: nextPgData }));
        addBot(`**Room ${nextRoomNum}** (Floor ${nextFloor}, Room ${nextRoom}):\n🛏 How many **beds** are in this room?`);
      }
      return;
    }
  };

  // ── handle user reply during a flow ──────────────────────────
  const handleFieldReply = async (userInput, state) => {
    if (/^(cancel|stop|quit|exit|abort)$/i.test(userInput.trim())) {
      handleCancel();
      return;
    }

    // Route to PG dynamic handler if in a pg phase
    if (state.pgPhase && state.pgPhase !== 'done') {
      await handlePgReply(userInput, state);
      return;
    }

    const { mode, fieldIndex: fi, collected, propertyOptions, tenantOptions, complaintOptions } = state;
    const flow  = ENTITY_FLOWS[mode];
    const field = flow.fields[fi];

    if (field.type === "property_select") {
      const idx = parseInt(userInput) - 1;
      if (isNaN(idx) || idx < 0 || idx >= propertyOptions.length) {
        addBot("⚠️ Please enter a **valid number** from the list above."); return;
      }
      const prop = propertyOptions[idx];
      await advanceField({ ...collected, property_id: prop.id, property_name: prop.name }, fi + 1, mode);
      return;
    }

    if (field.type === "tenant_select") {
      const idx = parseInt(userInput) - 1;
      if (isNaN(idx) || idx < 0 || idx >= tenantOptions.length) {
        addBot("⚠️ Please enter a **valid number** from the list above."); return;
      }
      const t = tenantOptions[idx];
      await advanceField({
        ...collected,
        tenant_id: t.id, tenant_name: t.name,
        property_id: t.property_id, property_name: t.property_name,
      }, fi + 1, mode);
      return;
    }

    if (field.type === "complaint_select") {
      const idx = parseInt(userInput) - 1;
      if (isNaN(idx) || idx < 0 || idx >= complaintOptions.length) {
        addBot("⚠️ Please enter a **valid number** from the list above."); return;
      }
      const c = complaintOptions[idx];
      await advanceField({ ...collected, complaint_id: c.id, complaint_title: c.title }, fi + 1, mode);
      return;
    }

    if (field.type === "room_select") {
      const idx = parseInt(userInput) - 1;
      const { roomOptions } = state;
      if (isNaN(idx) || idx < 0 || idx >= roomOptions.length) {
        addBot("⚠️ Please enter a **valid number** from the list above."); return;
      }
      const room = roomOptions[idx];
      if (room.occupied_beds >= room.total_beds) {
        addBot(`⚠️ **Room ${room.room_number} is full.** Please choose another room.`);
        return;
      }
      await advanceField({ ...collected, room_number: room.room_number }, fi + 1, mode);
      return;
    }

    if (field.type === "bed_select") {
      const idx = parseInt(userInput) - 1;
      const { bedOptions } = state;
      if (isNaN(idx) || idx < 0 || idx >= bedOptions.length) {
        addBot("⚠️ Please enter a **valid number** from the list above."); return;
      }
      const opt = bedOptions[idx];
      if (opt.isOccupied) {
        addBot(`⚠️ **Bed ${opt.bed} is already occupied.** Please choose another bed.`);
        return;
      }
      await advanceField({ ...collected, bed_number: opt.bed }, fi + 1, mode);
      return;
    }

    if (field.type === "boolean") {
      const val = /^(yes|y|true|1|haan)$/i.test(userInput.trim());
      await advanceField({ ...collected, [field.key]: val }, fi + 1, mode);
      return;
    }

    if (field.type === "number") {
      const num = parseFloat(userInput.replace(/[₹,\s]/g, ""));
      if (isNaN(num)) { addBot("⚠️ Please enter a **valid number**."); return; }
      await advanceField({ ...collected, [field.key]: num }, fi + 1, mode);
      return;
    }

    // text — with validation
    const validationError = validateField(field, userInput);
    if (validationError) { addBot(validationError); return; }
    await advanceField({ ...collected, [field.key]: userInput.trim() }, fi + 1, mode);
  };

  // ── start a creation/edit flow ────────────────────────────────
  const startFlow = async (mode) => {
    const flow       = ENTITY_FLOWS[mode];
    const firstField = flow.fields[0];
    const newState   = { mode, fieldIndex: 0, collected: {}, propertyOptions: [], tenantOptions: [], complaintOptions: [], pgPhase: null, pgData: null };
    setConvState(newState);

    const intro = `Sure! Let's **${flow.label}** ${flow.icon}.\nI'll ask you each detail one by one — type **cancel** anytime to stop.\n\n*(1/${flow.fields.length})* ${firstField.question}`;

    if (firstField.type === "property_select") {
      setIsTyping(true);
      try {
        const props = await api.getProperties();
        setConvState(p => ({ ...p, propertyOptions: props }));
        const list = props.map((pr, i) => `**${i + 1}.** ${pr.name}\n   📍 ${pr.address}`).join("\n");
        addBot(`Sure! Let's **${flow.label}** ${flow.icon}.\n\n*(1/${flow.fields.length})* ${firstField.question}\n\n${list}\n\nEnter the **number** of your choice.`);
      } finally { setIsTyping(false); }
    } else if (firstField.type === "tenant_select") {
      setIsTyping(true);
      try {
        const tenants = await api.getTenants();
        setConvState(p => ({ ...p, tenantOptions: tenants }));
        const list = tenants.map((t, i) => `**${i + 1}.** ${t.name} — ${t.property_name} | Room ${t.room_number} | *${t.rent_status}*`).join("\n");
        addBot(`Sure! Let's **${flow.label}** ${flow.icon}.\n\n*(1/${flow.fields.length})* ${firstField.question}\n\n${list}\n\nEnter the **number** of your choice.`);
      } finally { setIsTyping(false); }
    } else if (firstField.type === "complaint_select") {
      setIsTyping(true);
      try {
        const complaints = await api.getComplaints();
        setConvState(p => ({ ...p, complaintOptions: complaints }));
        const list = complaints.map((c, i) =>
          `**${i + 1}.** [${c.priority?.toUpperCase()}] ${c.title}\n   👤 ${c.tenant_name} | *${c.status}*`
        ).join("\n");
        addBot(`Sure! Let's **${flow.label}** ${flow.icon}.\n\n*(1/${flow.fields.length})* ${firstField.question}\n\n${list}\n\nEnter the **number** of your choice.`);
      } finally { setIsTyping(false); }
    } else {
      addBot(intro);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── view data intents ─────────────────────────────────────────
  const handleView = async (type) => {
    setIsTyping(true);
    try {
      const handlers = {
        stats: async () => {
          const s = await api.getStats();
          return `📊 **Business Overview:**\n\n🏠 Properties: **${s.total_properties}** | 👥 Tenants: **${s.total_tenants}**\n📈 Occupancy: **${s.occupancy_rate}%** | 💰 Revenue: **₹${s.monthly_revenue?.toLocaleString("en-IN")}**\n⚠️ Overdue Rents: **${s.overdue_rents}** | 🔧 Open Complaints: **${s.open_complaints}**`;
        },
        tenants: async () => {
          const d = await api.getTenants();
          if (!d.length) return "No tenants found in the system.";
          return `👥 **Tenants (${d.length} total):**\n\n${d.map((t, i) =>
            `**${i + 1}. ${t.name}**\n   ${t.property_name} | Room ${t.room_number}${t.bed_number} | ₹${t.rent_amount?.toLocaleString()} | *${t.rent_status}*`
          ).join("\n\n")}`;
        },
        properties: async () => {
          const d = await api.getProperties();
          if (!d.length) return "No properties found.";
          return `🏠 **Properties (${d.length} total):**\n\n${d.map(p =>
            `**${p.name}**\n📍 ${p.address}\n🛏 Beds: ${p.occupied_beds}/${p.total_beds} | 💰 ₹${p.monthly_revenue?.toLocaleString("en-IN")}/mo | 👤 Mgr: ${p.manager}`
          ).join("\n\n")}`;
        },
        complaints: async () => {
          const d = await api.getComplaints();
          if (!d.length) return "No complaints found! Everything looks good 🎉";
          return `🔧 **Complaints (${d.length} total):**\n\n${d.map(c =>
            `**[${c.priority?.toUpperCase()}]** ${c.title}\n👤 ${c.tenant_name} | 🏠 ${c.property_name} | Status: *${c.status}*`
          ).join("\n\n")}`;
        },
        rooms: async () => {
          const d = await api.getRooms();
          if (!d.length) return "No rooms found.";
          return `🚪 **Rooms (${d.length} total):**\n\n${d.map(r =>
            `Room **${r.room_number}** — ${r.property_name}\n🛏 ${r.occupied_beds}/${r.total_beds} beds | ₹${r.rent_per_bed}/bed | *${r.status}*`
          ).join("\n\n")}`;
        },
        notices: async () => {
          const d = await api.getNotices();
          if (!d.length) return "No notices found.";
          return `📢 **Notices (${d.length} total):**\n\n${d.map(n =>
            `${n.urgent ? "🚨" : "📢"} **${n.title}**\n${n.property_name} | By: ${n.created_by}`
          ).join("\n\n")}`;
        },
      };
      if (handlers[type]) addBot(await handlers[type]());
      else addBot("I couldn't find that. Please try again.");
    } catch {
      addBot("Sorry, I couldn't fetch that data. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  // ── search intent handler ─────────────────────────────────────
  const handleSearch = async (type, userMsg) => {
    // Extract search query from message
    const m = userMsg.toLowerCase();
    // Try to extract name after keywords like "find tenant named X" or "search for X"
    const queryMatch = m.match(/(?:named?|for|called|search|find|look)\s+(.+)/);
    const query = queryMatch ? queryMatch[1].trim() : "";

    if (!query) {
      addBot(`What ${type === "tenant" ? "tenant" : "property"} are you looking for? Please type the **name or keyword**.`);
      return;
    }

    setIsTyping(true);
    try {
      if (type === "tenant") {
        const results = await api.getTenants(query);
        if (!results.length) {
          addBot(`🔍 No tenants found matching **"${query}"**.\n\nTry a different name or check the spelling.`);
        } else {
          addBot(
            `🔍 Found **${results.length}** tenant(s) matching "**${query}**":\n\n` +
            results.map((t, i) =>
              `**${i + 1}. ${t.name}**\n   ${t.property_name} | Room ${t.room_number}${t.bed_number}\n   ₹${t.rent_amount?.toLocaleString()}/mo | Status: *${t.rent_status}*\n   📞 ${t.phone} | ✉️ ${t.email}`
            ).join("\n\n")
          );
        }
      } else {
        const all = await api.getProperties();
        const results = all.filter(p =>
          p.name.toLowerCase().includes(query) || p.address.toLowerCase().includes(query)
        );
        if (!results.length) {
          addBot(`🔍 No properties found matching **"${query}"**.`);
        } else {
          addBot(
            `🔍 Found **${results.length}** property(ies) matching "**${query}**":\n\n` +
            results.map(p =>
              `**${p.name}**\n📍 ${p.address}\n🛏 ${p.occupied_beds}/${p.total_beds} beds | 💰 ₹${p.monthly_revenue?.toLocaleString("en-IN")}/mo`
            ).join("\n\n")
          );
        }
      }
    } catch {
      addBot("Sorry, search failed. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  // ── handle idle message ───────────────────────────────────────
  const handleIdleMsg = async (msg) => {
    const intent = detectIntent(msg);

    if (intent.startsWith("create_") || intent === "update_complaint" || intent === "mark_paid") {
      await startFlow(intent); return;
    }

    if (intent === "send_reminders") {
      setIsTyping(true);
      try {
        const r = await api.sendRentReminders();
        addBot(r.tenants?.length > 0
          ? `✅ Rent reminders sent to **${r.tenants.length}** tenant(s):\n\n${r.tenants.map(t => `• ${t}`).join("\n")}`
          : "ℹ️ No tenants with overdue or due rent right now. Everyone is up to date! 🎉");
      } catch { addBot("Sorry, couldn't send reminders. Please try again."); }
      finally { setIsTyping(false); }
      return;
    }

    if (intent.startsWith("view_")) { await handleView(intent.replace("view_", "")); return; }

    if (intent === "search_tenant") { await handleSearch("tenant", msg); return; }
    if (intent === "search_property") { await handleSearch("property", msg); return; }

    // Free-form AI query — send with chat history for multi-turn memory
    setIsTyping(true);
    try {
      const history = buildHistory(messages);
      const r = await api.postAIAgent(msg, history);
      addBot(r.response || "I'm not sure about that. Could you rephrase?");
    } catch { addBot("I'm having trouble connecting to my AI brain. Please try again."); }
    finally { setIsTyping(false); }
  };

  // ── main send handler ─────────────────────────────────────────
  const handleSend = async () => {
    const userMsg = input.trim();
    if (!userMsg || isTyping || confirmation) return;
    setInput("");
    addUser(userMsg);
    inputRef.current?.focus();

    if (convState.mode) {
      await handleFieldReply(userMsg, { ...convState });
    } else {
      await handleIdleMsg(userMsg);
    }

  };

  const chipClick = async (msg) => {
    if (isTyping || convState.mode || confirmation) return;
    addUser(msg);
    await handleIdleMsg(msg);
  };

  // ── derived ──────────────────────────────────────────────────
  const activeFlow        = convState.mode ? ENTITY_FLOWS[convState.mode] : null;
  // For PG config phase, override progress label
  const isPgPhase = convState.pgPhase && convState.pgPhase !== 'done';
  const totalFields       = activeFlow?.fields.length || 0;
  const progressPct       = isPgPhase
    ? ({ num_floors: 20, floor_rooms: 40, room_beds: 60, room_rent: 75, room_ac: 90 }[convState.pgPhase] || 50)
    : totalFields > 0 ? Math.round((convState.fieldIndex / totalFields) * 100) : 0;
  const currentFieldLabel = isPgPhase
    ? `Floor ${convState.pgData?.curFloor} / Room ${convState.pgData?.curRoom} config`
    : activeFlow?.fields[convState.fieldIndex]?.key?.replace(/_/g, " ") || "";

  // ── render ───────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-1">
            AI Owner Assistant <Sparkles className="w-6 h-6 text-indigo-500 fill-indigo-500" />
          </h1>
          <p className="text-muted-foreground text-sm">
            Conversational AI · Full CRUD · Search · Live DB · Chat Memory
          </p>
        </div>
        <div className="flex items-center gap-2">
          {convState.mode && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 py-1.5 px-3 rounded-full flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {activeFlow?.label}…
            </Badge>
          )}
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 py-1.5 px-3 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse inline-block" />
            AI Online · Owner Role
          </Badge>
        </div>
      </div>

      {/* Main chat card */}
      <Card className="border-none shadow-2xl bg-white dark:bg-gray-950 overflow-hidden flex flex-col rounded-3xl" style={{ height: "700px" }}>

        {/* Card header */}
        <CardHeader className="flex-shrink-0 border-b py-3 px-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-950 rounded-full" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Smart AI Owner Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">Full CRUD · Search · Edit · Live DB · Chat Memory</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {convState.mode && (
                <Button variant="ghost" size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl gap-1.5 text-xs"
                  onClick={handleCancel}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
              )}
              {!convState.mode && (
                <Button variant="ghost" size="sm"
                  id="clear-chat-btn"
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl gap-1.5 text-xs"
                  onClick={handleClearChat}
                  title="Clear chat history">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {convState.mode && totalFields > 0 && (
            <div className="mt-2.5">
              <div className="flex justify-between mb-1 text-[10px] text-muted-foreground font-medium">
                <span>{activeFlow?.label} {activeFlow?.icon} — step {Math.min(convState.fieldIndex + 1, totalFields)} of {totalFields}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </CardHeader>

        {/* Messages area */}
        <CardContent className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-900/10">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}>
                  {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-[78%] md:max-w-[68%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm"
                      : "bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-tl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{renderMd(msg.content)}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div key="typing"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex gap-3 items-start"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.span key={i} className="w-2 h-2 rounded-full bg-indigo-400 inline-block"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Confirmation panel */}
        <AnimatePresence>
          {confirmation && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              className="flex-shrink-0 border-t bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Review before saving — {confirmation.flow.label} {confirmation.flow.icon}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 max-h-36 overflow-y-auto pr-1">
                {Object.entries(confirmation.data).map(([key, value]) => (
                  <div key={key} className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-emerald-100 dark:border-gray-700 shadow-sm">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-semibold truncate" title={String(value)}>{String(value)}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  id="confirm-save-btn"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-semibold shadow"
                  onClick={handleConfirm} disabled={isTyping}>
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Save
                </Button>
                <Button variant="outline"
                  id="cancel-save-btn"
                  className="flex-1 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl gap-2 font-semibold"
                  onClick={handleCancel} disabled={isTyping}>
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="flex-shrink-0 p-4 border-t bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm space-y-3">

          {/* Quick action chips — only when idle */}
          {!convState.mode && !confirmation && (
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button key={i}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => chipClick(action.message)}
                  disabled={isTyping}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{action.icon}</span> {action.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Text input */}
          <div className="relative">
            {!convState.mode && !confirmation && (
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            )}
            <Input
              ref={inputRef}
              id="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={!!confirmation}
              placeholder={
                confirmation
                  ? "Review and confirm or cancel above…"
                  : convState.mode
                    ? `Your answer for "${currentFieldLabel}"… (or type cancel)`
                    : "Ask anything — 'Find tenant Rahul', 'Add tenant', 'Show stats'…"
              }
              className={`h-12 rounded-2xl border bg-white dark:bg-gray-800 shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500/30 text-sm pr-14 ${
                !convState.mode && !confirmation ? "pl-10" : "pl-4"
              }`}
            />
            <Button
              id="chatbot-send"
              onClick={handleSend}
              disabled={!input.trim() || isTyping || !!confirmation}
              className="absolute right-1.5 top-1.5 h-9 w-9 p-0 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Cancel hint during flow */}
          {convState.mode && (
            <p className="text-[10px] text-center text-muted-foreground">
              Guiding you through <strong>{activeFlow?.label}</strong> step by step •{" "}
              <button className="text-red-500 font-semibold hover:underline" onClick={handleCancel}>cancel</button>
            </p>
          )}
        </div>
      </Card>

      {/* Bottom info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Role",          value: "Owner Access",  icon: <Sparkles className="w-5 h-5" />,     from: "from-indigo-500",  to: "to-purple-600", bg: "bg-indigo-50 dark:bg-indigo-900/10",   text: "text-indigo-600" },
          { label: "Capabilities",  value: "Full CRUD",     icon: <CheckCircle2 className="w-5 h-5" />, from: "from-emerald-500", to: "to-teal-600",   bg: "bg-emerald-50 dark:bg-emerald-900/10", text: "text-emerald-600" },
          { label: "Entity Types",  value: "6 Supported",   icon: <Zap className="w-5 h-5" />,          from: "from-purple-500",  to: "to-pink-600",   bg: "bg-purple-50 dark:bg-purple-900/10",   text: "text-purple-600" },
          { label: "Chat Memory",   value: "Persistent",    icon: <Bot className="w-5 h-5" />,          from: "from-rose-500",    to: "to-orange-500", bg: "bg-rose-50 dark:bg-rose-900/10",       text: "text-rose-600" },
        ].map((card) => (
          <Card key={card.label} className={`border-none shadow-sm rounded-2xl ${card.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${card.from} ${card.to} text-white rounded-xl flex items-center justify-center shadow`}>
                {card.icon}
              </div>
              <div>
                <p className={`text-[10px] uppercase tracking-widest font-bold ${card.text}`}>{card.label}</p>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
