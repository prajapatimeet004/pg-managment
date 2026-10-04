import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { 
  Building2, 
  MapPin, 
  Users, 
  Bed, 
  IndianRupee, 
  ArrowLeft, 
  ShieldCheck, 
  Plus, 
  AlertCircle,
  Phone,
  Mail,
  ChevronRight,
  Home,
  Save,
  Loader2,
  Settings2,
  Wifi,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  Search,
  Check,
  Pencil,
  Edit,
  Clock
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../lib/api";
import { cn } from "../../ui/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { toast } from "sonner";
import { useDataRefresh, notifyDataUpdated } from "../../../lib/dataEvents";

export function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Property State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    manager: "",
    phone: ""
  });

  // Add Unit State
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [addUnitLoading, setAddUnitLoading] = useState(false);
  const [unitForm, setUnitForm] = useState({
    floor: "1",
    room_number: "",
    total_beds: "2",
    rent_per_bed: "8000",
    has_ac: false
  });

  // Edit Room State
  const [editingRoom, setEditingRoom] = useState(null);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [roomEditLoading, setRoomEditLoading] = useState(false);

  // Add Resident / Tenant State
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [addTenantLoading, setAddTenantLoading] = useState(false);
  const [selectedTenantRoom, setSelectedTenantRoom] = useState("");
  const [tenantRentAmount, setTenantRentAmount] = useState("");
  const [tenantForm, setTenantForm] = useState({
    name: "",
    phone: "",
    email: "",
    bed_number: "",
    advance: "0",
    join_date: new Date().toISOString().split("T")[0],
    rent_due_date: "5",
    aadhar_number: "",
    rent_status: "paid"
  });

  // Room Bed & Resident Allocation State
  const [allTenants, setAllTenants] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRoomForAssign, setSelectedRoomForAssign] = useState(null);
  const [selectedBedForAssign, setSelectedBedForAssign] = useState("A");
  const [assignModalMode, setAssignModalMode] = useState("existing"); // "existing" | "new"
  const [selectedExistingTenantId, setSelectedExistingTenantId] = useState("");
  const [searchExistingTenant, setSearchExistingTenant] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [newResidentForm, setNewResidentForm] = useState({
    name: "",
    phone: "",
    email: "",
    aadhar_number: "",
    rent_amount: "8000",
    advance: "0",
    join_date: new Date().toISOString().split("T")[0],
    rent_due_date: "5",
    rent_status: "paid"
  });

  // Staff Edit / Profile Modal State
  const [selectedStaffMember, setSelectedStaffMember] = useState(null);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [isStaffProfileModalOpen, setIsStaffProfileModalOpen] = useState(false);
  const [staffEditLoading, setStaffEditLoading] = useState(false);
  const [staffEditForm, setStaffEditForm] = useState({
    name: "",
    role: "Property Manager",
    email: "",
    phone: "",
    status: "Active",
    shift: "Day"
  });

  const STAFF_ROLES = ["Admin", "Property Manager", "Housekeeping Head", "Security Guard", "Maintenance", "Warden", "Cook"];
  const STAFF_SHIFTS = ["Day", "Night", "Rotating", "Morning", "Evening", "Full Day"];
  const STAFF_STATUSES = ["Active", "On Leave", "Terminated"];

  const handleOpenEditStaff = (member) => {
    setSelectedStaffMember(member);
    setStaffEditForm({
      name: member.name || "",
      role: member.role || "Property Manager",
      email: member.email || "",
      phone: member.phone || "",
      status: member.status || "Active",
      shift: member.shift || "Day"
    });
    setIsEditStaffModalOpen(true);
  };

  const handleOpenStaffProfile = (member) => {
    setSelectedStaffMember(member);
    setIsStaffProfileModalOpen(true);
  };

  const handleUpdateStaffSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffMember) return;
    setStaffEditLoading(true);
    try {
      await api.updateStaff(selectedStaffMember.id, {
        name: staffEditForm.name.trim(),
        role: staffEditForm.role,
        email: staffEditForm.email.trim().toLowerCase(),
        phone: staffEditForm.phone.trim(),
        status: staffEditForm.status,
        shift: staffEditForm.shift
      });
      toast.success("Staff details updated successfully!");
      setIsEditStaffModalOpen(false);
      setIsStaffProfileModalOpen(false);
      fetchProperty();
      notifyDataUpdated("staff");
      notifyDataUpdated("properties");
    } catch (error) {
      toast.error(error.message || "Failed to update staff details");
    } finally {
      setStaffEditLoading(false);
    }
  };

  const handleRoomSelect = (roomNumber) => {
    setSelectedTenantRoom(roomNumber);
    const room = (property?.rooms || []).find(r => String(r.room_number) === String(roomNumber));
    if (room) {
      setTenantRentAmount(String(room.rent_per_bed || ""));
      setTenantForm(prev => ({
        ...prev,
        bed_number: "",
        advance: String(room.rent_per_bed || "0")
      }));
    } else {
      setTenantRentAmount("");
      setTenantForm(prev => ({ ...prev, bed_number: "" }));
    }
  };

  const handleAddTenantSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTenantRoom || !tenantForm.bed_number) {
      toast.error("Please select a room and bed number");
      return;
    }
    setAddTenantLoading(true);
    try {
      const room = (property?.rooms || []).find(r => String(r.room_number) === String(selectedTenantRoom));
      const tenantData = {
        name: tenantForm.name.trim(),
        phone: tenantForm.phone.trim(),
        email: tenantForm.email.trim().toLowerCase(),
        property_id: Number(id),
        property_name: property?.name || "",
        room_number: selectedTenantRoom,
        floor: room?.floor || 1,
        bed_number: tenantForm.bed_number,
        rent_amount: parseFloat(tenantRentAmount) || 0,
        advance: parseFloat(tenantForm.advance) || 0,
        rent_status: tenantForm.rent_status || "paid",
        join_date: tenantForm.join_date || new Date().toISOString().split("T")[0],
        rent_due_date: tenantForm.rent_due_date || "5",
        aadhar_number: tenantForm.aadhar_number || ""
      };

      const created = await api.createTenant(tenantData);
      toast.success(`Resident ${created.name} registered successfully!`);
      setIsAddTenantModalOpen(false);
      // Reset form
      setSelectedTenantRoom("");
      setTenantRentAmount("");
      setTenantForm({
        name: "",
        phone: "",
        email: "",
        bed_number: "",
        advance: "0",
        join_date: new Date().toISOString().split("T")[0],
        rent_due_date: "5",
        aadhar_number: "",
        rent_status: "paid"
      });
      fetchProperty();
      notifyDataUpdated("tenants");
      notifyDataUpdated("rooms");
      notifyDataUpdated("properties");
    } catch (error) {
      toast.error(error.message || "Failed to register resident");
    } finally {
      setAddTenantLoading(false);
    }
  };

  const handleOpenRoomAssign = (room, bedLetter = null, mode = "existing") => {
    setSelectedRoomForAssign(room);
    setAssignModalMode(mode);

    const roomTenants = getTenantsInRoom(room.room_number, room.floor, property?.id);
    const occupiedLetters = roomTenants.map(t => {
      const raw = String(t.bed_number || "").trim().toUpperCase();
      return raw.replace(/^BED\s*[-_]?\s*/i, "");
    });

    let targetBed = bedLetter;
    if (!targetBed) {
      for (let i = 0; i < (room.total_beds || 1); i++) {
        const letter = String.fromCharCode(65 + i);
        if (!occupiedLetters.includes(letter)) {
          targetBed = letter;
          break;
        }
      }
      if (!targetBed) targetBed = "A";
    }
    setSelectedBedForAssign(targetBed);

    setNewResidentForm({
      name: "",
      phone: "",
      email: "",
      aadhar_number: "",
      rent_amount: String(room.rent_per_bed || "8000"),
      advance: String(room.rent_per_bed || "0"),
      join_date: new Date().toISOString().split("T")[0],
      rent_due_date: "5",
      rent_status: "paid"
    });

    setSelectedExistingTenantId("");
    setSearchExistingTenant("");
    setIsAssignModalOpen(true);
  };

  const handleAssignExistingSubmit = async () => {
    if (!selectedExistingTenantId) {
      toast.error("Please select a resident to assign");
      return;
    }
    if (!selectedRoomForAssign || !selectedBedForAssign) {
      toast.error("Please pick a room and bed");
      return;
    }

    setAssignLoading(true);
    try {
      await api.transferTenant(selectedExistingTenantId, {
        property_id: Number(id),
        room_number: String(selectedRoomForAssign.room_number),
        bed_number: selectedBedForAssign
      });

      const assignedTenant = allTenants.find(t => String(t.id) === String(selectedExistingTenantId));
      toast.success(`${assignedTenant?.name || "Resident"} assigned to Room ${selectedRoomForAssign.room_number} (Bed ${selectedBedForAssign})!`);
      setIsAssignModalOpen(false);
      fetchProperty();
      notifyDataUpdated("tenants");
      notifyDataUpdated("rooms");
      notifyDataUpdated("properties");
    } catch (error) {
      toast.error(error.message || "Failed to assign resident");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAddNewResidentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedRoomForAssign || !selectedBedForAssign) {
      toast.error("Please select a room and bed");
      return;
    }
    if (!newResidentForm.name.trim() || !newResidentForm.phone.trim() || !newResidentForm.email.trim()) {
      toast.error("Please enter Name, Phone, and Email");
      return;
    }

    setAssignLoading(true);
    try {
      const tenantData = {
        name: newResidentForm.name.trim(),
        phone: newResidentForm.phone.trim(),
        email: newResidentForm.email.trim().toLowerCase(),
        property_id: Number(id),
        property_name: property?.name || "",
        room_number: String(selectedRoomForAssign.room_number),
        floor: selectedRoomForAssign.floor || 1,
        bed_number: selectedBedForAssign,
        rent_amount: parseFloat(newResidentForm.rent_amount) || selectedRoomForAssign.rent_per_bed || 0,
        advance: parseFloat(newResidentForm.advance) || 0,
        rent_status: newResidentForm.rent_status || "paid",
        join_date: newResidentForm.join_date || new Date().toISOString().split("T")[0],
        rent_due_date: newResidentForm.rent_due_date || "5",
        aadhar_number: newResidentForm.aadhar_number.trim()
      };

      const created = await api.createTenant(tenantData);
      toast.success(`Resident ${created.name} registered & assigned to Room ${selectedRoomForAssign.room_number} (Bed ${selectedBedForAssign})!`);
      setIsAssignModalOpen(false);
      fetchProperty();
      notifyDataUpdated("tenants");
      notifyDataUpdated("rooms");
      notifyDataUpdated("properties");
    } catch (error) {
      toast.error(error.message || "Failed to register resident");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleBedClick = (room, bedIndex) => {
    const bedLetter = String.fromCharCode(65 + bedIndex);
    const roomTenants = getTenantsInRoom(room.room_number, room.floor, property?.id);
    const existingTenant = findTenantForBed(roomTenants, bedIndex);

    if (existingTenant) {
      navigate(`/tenants/${existingTenant.id}`);
    } else {
      handleOpenRoomAssign(room, bedLetter, "existing");
    }
  };

  const fetchProperty = async () => {
    try {
      const [data, allTenantsData] = await Promise.all([
        api.getProperty(id),
        api.getTenants().catch(() => [])
      ]);
      setProperty(data);
      setAllTenants(allTenantsData || []);
      setEditForm({
        name: data.name,
        address: data.address,
        manager: data.manager,
        phone: data.phone
      });
    } catch (error) {
      console.error("Failed to fetch property details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  useDataRefresh(["properties", "tenants", "rooms", "complaints"], fetchProperty);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.updateProperty(id, editForm);
      toast.success("Property updated successfully");
      setIsEditModalOpen(false);
      fetchProperty();
    } catch (error) {
      toast.error(error.message || "Failed to update property");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddUnitSubmit = async (e) => {
    e.preventDefault();
    setAddUnitLoading(true);
    try {
      const amenities = unitForm.has_ac ? "AC, WiFi, Attached Bathroom" : "WiFi, Attached Bathroom";
      await api.createRoom({
        ...unitForm,
        property_id: Number(id),
        floor: Number(unitForm.floor),
        total_beds: Number(unitForm.total_beds),
        rent_per_bed: Number(unitForm.rent_per_bed),
        amenities: amenities,
        status: "available",
        occupied_beds: 0
      });
      toast.success("Unit added successfully");
      setIsAddUnitModalOpen(false);
      setUnitForm({
        floor: "1",
        room_number: "",
        total_beds: "2",
        rent_per_bed: "8000",
        has_ac: false
      });
      fetchProperty();
    } catch (error) {
      toast.error(error.message || "Failed to add unit");
    } finally {
      setAddUnitLoading(false);
    }
  };

  const handleUpdateRoom = async (roomData) => {
    setRoomEditLoading(true);
    try {
      await api.updateRoom(roomData.id, {
        total_beds: roomData.total_beds,
        rent_per_bed: roomData.rent_per_bed,
        amenities: roomData.amenities
      });
      toast.success("Room updated successfully!");
      setIsEditRoomModalOpen(false);
      fetchProperty();
    } catch (error) {
      toast.error("Failed to update room: " + error.message);
    } finally {
      setRoomEditLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center font-bold animate-pulse">Synchronizing Asset Data...</div>;
  if (!property) return <div className="p-12 text-center">Property not found.</div>;

  const getRoomsByFloor = (roomsList) => {
    if (!roomsList) return {};
    const grouped = {};
    roomsList.forEach(room => {
      if (!grouped[room.floor]) grouped[room.floor] = [];
      grouped[room.floor].push(room);
    });
    Object.keys(grouped).forEach(f => {
      grouped[f].sort((a,b) => a.room_number.localeCompare(b.room_number, undefined, {numeric: true}));
    });
    return grouped;
  };

  const getTenantsInRoom = (roomNum, floorNum = null, propId = null) => {
    const list = (property?.tenants && property.tenants.length > 0) ? property.tenants : (allTenants || []);
    const targetPropId = propId || property?.id;
    return list.filter(t => {
      const matchRoom = String(t.room_number || "").trim().toLowerCase() === String(roomNum || "").trim().toLowerCase();
      const matchProp = !targetPropId || Number(t.property_id) === Number(targetPropId);
      return matchRoom && matchProp;
    });
  };

  const findTenantForBed = (roomTenants, bedIndex) => {
    if (!roomTenants || !roomTenants.length) return undefined;
    const bedLetter = String.fromCharCode(65 + bedIndex);
    const numStr = String(bedIndex + 1);

    const found = roomTenants.find(t => {
      const raw = String(t.bed_number || "").trim().toUpperCase();
      const clean = raw.replace(/^BED\s*[-_]?\s*/i, "");
      return clean === bedLetter || clean === numStr || raw === bedLetter || raw === numStr;
    });
    if (found) return found;

    const unmapped = roomTenants.filter(x => {
      const raw = String(x.bed_number || "").trim().toUpperCase().replace(/^BED\s*[-_]?\s*/i, "");
      return !['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(raw);
    });
    return unmapped[bedIndex];
  };

  const occupancyRate = Math.round((property.occupied_beds / property.total_beds) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between">
        <Link to="/properties">
          <Button variant="ghost" className="rounded-full hover:bg-white/50 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Properties
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl border-2 font-bold"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Details
          </Button>
          <Button 
            className="rounded-xl font-bold shadow-lg shadow-indigo-100"
            onClick={() => setIsAddUnitModalOpen(true)}
          >
            Add Unit
          </Button>
        </div>
      </div>

      {/* Property Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Building2 className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center shrink-0">
            <Home className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-none uppercase text-[10px] font-black tracking-widest">
                  Active Asset
                </Badge>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">{property.name}</h1>
              <div className="flex items-center gap-2 mt-2 opacity-80 font-medium">
                <MapPin className="w-4 h-4" />
                <span>{property.address}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-60">Manager</p>
                  <p className="font-bold">{property.manager}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-60">Contact</p>
                  <p className="font-bold">{property.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Occupancy Rate", value: `${occupancyRate}%`, icon: Users, color: "emerald", sub: `${property.occupied_beds}/${property.total_beds} beds filled` },
          { label: "Total Revenue", value: `₹${(property.monthly_revenue / 1000).toFixed(1)}K`, icon: IndianRupee, color: "indigo", sub: "Monthly collection" },
          { label: "Active Rooms", value: property.total_rooms, icon: Bed, color: "blue", sub: "Operational units" },
          { label: "Complaints", value: (property.complaints || []).filter(c => c.status !== 'resolved').length, icon: AlertCircle, color: "red", sub: "Needs attention" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-950 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="h-1.5 w-12 bg-gray-100 rounded-full overflow-hidden">
                   <div className={`h-full bg-${stat.color}-500 w-2/3`} />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black">{stat.value}</h3>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList className="bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200 h-14">
          <TabsTrigger value="tenants" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm h-full">Tenants</TabsTrigger>
          <TabsTrigger value="rooms" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm h-full">Rooms Units</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm h-full">Staff Team</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm h-full">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black">Current Residents ({(property.tenants || []).length})</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl font-bold bg-indigo-50/60 hover:bg-indigo-50 border-indigo-200 text-indigo-600 hover:text-indigo-700 shadow-sm"
              onClick={() => setIsAddTenantModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Resident
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(property.tenants || []).map((tenant) => (
              <Card key={tenant.id} className="border-none shadow-sm hover:shadow-lg transition-all rounded-[2rem] overflow-hidden group bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xl border-4 border-white shadow-sm transition-transform group-hover:scale-110">
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-lg">{tenant.name}</h4>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Room {tenant.room_number} &bull; Bed {tenant.bed_number}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-muted-foreground">Rent Status</span>
                        </div>
                        <Badge className={cn(
                            "rounded-full px-3 py-0.5 text-[9px] font-black uppercase",
                            tenant.rent_status === 'paid' ? "bg-emerald-100 text-emerald-600" : 
                            tenant.rent_status === 'overdue' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                        )}>
                            {tenant.rent_status}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-muted-foreground">Email</span>
                        </div>
                        <span className="text-[10px] font-black truncate max-w-[150px]">{tenant.email}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                     <Link to={`/tenants/${tenant.id}`} className="flex-1">
                       <Button variant="ghost" className="w-full rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-bold ring-1 ring-inset ring-gray-200">View Profile</Button>
                     </Link>
                     <a href={`tel:${tenant.phone}`}>
                       <Button variant="ghost" size="icon" className="rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                          <Phone className="w-4 h-4" />
                       </Button>
                     </a>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(property.tenants || []).length === 0 && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-muted-foreground font-bold mb-4">No active residents recorded for this location.</p>
                    <Button 
                      size="sm" 
                      className="rounded-xl font-bold bg-indigo-600 text-white shadow-md"
                      onClick={() => setIsAddTenantModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Resident
                    </Button>
                </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-8 pt-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-black">Room Inventory ({(property.rooms || []).length})</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Live Unit Allocation</p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="rounded-xl font-bold"
                onClick={() => setIsAddUnitModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Units
              </Button>
            </div>
          </div>
          
          <div className="space-y-10">
            <TooltipProvider>
              {Object.entries(getRoomsByFloor(property.rooms)).sort(([a],[b]) => Number(a) - Number(b)).map(([floor, floorRooms]) => (
                <div key={floor} className="space-y-6">
                  {/* Centered Floor Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-100" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-gray-50 dark:bg-gray-900 px-4 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                        Floor {floor}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {floorRooms.map((room) => (
                      <div 
                        key={room.id} 
                        onClick={() => handleOpenRoomAssign(room)}
                        className="p-6 rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-lg font-black tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                                Room {room.room_number}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                                Floor {room.floor} &bull; ₹{room.rent_per_bed || 0}/mo
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={cn(
                                "text-[10px] px-2.5 py-0.5 rounded-full font-bold border-none",
                                room.occupied_beds === 0 ? "bg-emerald-100 text-emerald-700" :
                                room.occupied_beds === room.total_beds ? "bg-rose-100 text-rose-700" :
                                "bg-amber-100 text-amber-700"
                              )}>
                                {room.occupied_beds}/{room.total_beds}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-7 h-7 rounded-full transition-opacity bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRoom(room);
                                  setIsEditRoomModalOpen(true);
                                }}
                              >
                                <Settings2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                            {Array.from({ length: room.total_beds }, (_, i) => {
                              const roomTenants = getTenantsInRoom(room.room_number, room.floor, property?.id || property.id);
                              const bedLetter = String.fromCharCode(65 + i);
                              const t = findTenantForBed(roomTenants, i);

                              return (
                                <Tooltip key={i} delayDuration={100}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleBedClick(room, i)}
                                      className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 active:scale-95 group/bed relative",
                                        t 
                                          ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:scale-110" 
                                          : "bg-gray-50 border-gray-100 hover:border-indigo-400 hover:bg-indigo-50/80 hover:scale-110"
                                      )}
                                    >
                                      <Bed className={cn(
                                        "w-5 h-5 transition-colors",
                                        t ? "text-white" : "text-gray-300 group-hover/bed:text-indigo-600"
                                      )} />
                                      {!t && (
                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] font-black opacity-0 group-hover/bed:opacity-100 transition-opacity shadow-sm">
                                          +
                                        </span>
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="rounded-xl font-bold bg-gray-900 text-white p-2.5 shadow-xl border-none">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", t ? "bg-emerald-400" : "bg-indigo-400")} />
                                        <span className="font-black text-xs">
                                          {t ? `Bed ${bedLetter}: ${t.name}` : `Bed ${bedLetter}: Available`}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-gray-400 font-bold">
                                        {t ? "Click to view resident profile" : "✨ Click to assign resident"}
                                      </span>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>

                        {/* Two Quick Action Buttons on Every Room Card */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex-1 text-[11px] font-bold h-8 rounded-xl border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-1 shadow-xs"
                            onClick={() => handleOpenRoomAssign(room, null, "existing")}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Assign
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="flex-1 text-[11px] font-bold h-8 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-1 shadow-sm shadow-indigo-100"
                            onClick={() => handleOpenRoomAssign(room, null, "new")}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            + Add
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TooltipProvider>
          </div>
        </TabsContent>

        {/* Staff Team Tab */}
        <TabsContent value="staff" className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-black">Assigned Staff ({(property.staff || []).length})</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">All personnel assigned to this property</p>
            </div>
            <Link to="/staff">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold bg-indigo-50/60 hover:bg-indigo-50 border-indigo-200 text-indigo-600 hover:text-indigo-700 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Manage All Staff
              </Button>
            </Link>
          </div>

          {(property.staff || []).length === 0 ? (
            <div className="py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground font-bold mb-4">No staff assigned to this property yet.</p>
              <Link to="/staff">
                <Button size="sm" className="rounded-xl font-bold bg-indigo-600 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Add Staff Member
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(property.staff || []).map((member) => (
                <Card key={member.id} className="border-none shadow-sm hover:shadow-lg transition-all rounded-[2rem] overflow-hidden group bg-white flex flex-col justify-between">
                  <CardContent className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      {/* Avatar + Name + Quick Edit */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xl border-4 border-white shadow-sm transition-transform group-hover:scale-110">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-base leading-tight break-words">{member.name}</h4>
                          <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-0.5">{member.role}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className={cn(
                            "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase shrink-0 border-none",
                            member.status === 'Active' ? 'bg-green-100 text-green-700' :
                            member.status === 'On Leave' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {member.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            onClick={() => handleOpenEditStaff(member)}
                            title="Edit Staff Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-muted-foreground">Email</span>
                          </div>
                          <span className="text-[10px] font-black truncate max-w-[140px]">{member.email || "No email"}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-muted-foreground">Phone</span>
                          </div>
                          <span className="text-[10px] font-black">{member.phone || "No phone"}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-muted-foreground">Shift</span>
                          </div>
                          <span className="text-[10px] font-black text-indigo-700 uppercase">{member.shift || "Day"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit Details & View Profile */}
                    <div className="flex gap-2 mt-5 pt-3 border-t border-gray-100">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl text-xs font-bold border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-1.5"
                        onClick={() => handleOpenEditStaff(member)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Details
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700"
                        onClick={() => handleOpenStaffProfile(member)}
                      >
                        Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Issues */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Active Maintenance
                    </h3>
                    <div className="space-y-3">
                        {property.complaints.map(complaint => (
                            <div key={complaint.id} className="p-4 bg-white rounded-3xl shadow-sm border border-gray-50 flex gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center",
                                    complaint.priority === 'high' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                                )}>
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold truncate">{complaint.title}</h4>
                                        <Badge variant="outline" className="rounded-full text-[8px] font-black uppercase py-0">{complaint.status}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium line-clamp-2 mb-2">{complaint.description}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                        <span>{complaint.tenant_name}</span>
                                        <span>&bull;</span>
                                        <span>{complaint.category}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Operations Summary */}
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-gray-900 text-white p-8">
                    <h3 className="text-xl font-black mb-6">Asset Health Analysis</h3>
                    <div className="space-y-6">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4">AI Smart Insight</p>
                            <p className="text-lg font-medium leading-relaxed italic text-indigo-200">
                                "This asset is performing at {occupancyRate}% efficiency. Increasing occupancy in Floor 2 could unlock an additional ₹28,000 in monthly revenue."
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-white/5 rounded-3xl text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Waitlist</p>
                                <p className="text-3xl font-black">12</p>
                                <p className="text-[8px] font-bold text-indigo-400 mt-1">PROSPECTIVE TENANTS</p>
                            </div>
                            <div className="p-5 bg-white/5 rounded-3xl text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Expense</p>
                                <p className="text-3xl font-black">₹4.2k</p>
                                <p className="text-[8px] font-bold text-red-400 mt-1">MAINTENANCE AVG</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

      {/* Edit Property Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Edit Asset Details</DialogTitle>
            <DialogDescription>Update the core information for this property.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Property Name</Label>
              <Input 
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                placeholder="e.g. Skyline PG"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Address</Label>
              <Input 
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                placeholder="Full address"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Manager</Label>
                <Input 
                  value={editForm.manager}
                  onChange={(e) => setEditForm({...editForm, manager: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  placeholder="Name"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contact</Label>
                <Input 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  placeholder="Phone"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 font-black" disabled={editLoading}>
                {editLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Unit Dialog */}
      <Dialog open={isAddUnitModalOpen} onOpenChange={setIsAddUnitModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Add New Unit</DialogTitle>
            <DialogDescription>Add a new room to this property.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUnitSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Floor</Label>
                <Select value={unitForm.floor} onValueChange={(val) => setUnitForm({...unitForm, floor: val})}>
                  <SelectTrigger className="rounded-xl h-12 bg-gray-50 border-none font-bold">
                    <SelectValue placeholder="Floor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    {[0,1,2,3,4,5,6,7,8,9,10].map(f => (
                      <SelectItem key={f} value={f.toString()}>Floor {f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Room Number</Label>
                <Input 
                  value={unitForm.room_number}
                  onChange={(e) => setUnitForm({...unitForm, room_number: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  placeholder="e.g. 101"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Beds</Label>
                <Input 
                  type="number"
                  value={unitForm.total_beds}
                  onChange={(e) => setUnitForm({...unitForm, total_beds: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  min="1"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rent per Bed</Label>
                <Input 
                  type="number"
                  value={unitForm.rent_per_bed}
                  onChange={(e) => setUnitForm({...unitForm, rent_per_bed: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-sm font-bold">Air Conditioned?</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black">{unitForm.has_ac ? "❄️ AC Included" : "🔆 Non-AC"}</p>
              </div>
              <Switch checked={unitForm.has_ac} onCheckedChange={(val) => setUnitForm({...unitForm, has_ac: val})} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsAddUnitModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 font-black" disabled={addUnitLoading}>
                {addUnitLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Add Unit</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Room Dialog */}
      <Dialog open={isEditRoomModalOpen} onOpenChange={setIsEditRoomModalOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl">🏨</div>
              <div>
                 <DialogTitle className="text-2xl font-black">Edit Room {editingRoom?.room_number}</DialogTitle>
                 <DialogDescription className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                   Configuration Manager
                 </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingRoom && (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateRoom(editingRoom); }} className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Total Capacity</Label>
                  <Input 
                    type="number"
                    className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold"
                    value={editingRoom.total_beds}
                    onChange={(e) => setEditingRoom({...editingRoom, total_beds: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rent Per Bed</Label>
                  <Input 
                    type="number"
                    className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold"
                    value={editingRoom.rent_per_bed}
                    onChange={(e) => setEditingRoom({...editingRoom, rent_per_bed: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amenities</Label>
                <Input 
                  className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold"
                  value={editingRoom.amenities || ""}
                  placeholder="WiFi, AC, TV..."
                  onChange={(e) => setEditingRoom({...editingRoom, amenities: e.target.value})}
                />
              </div>
              <DialogFooter className="pt-4 flex gap-3">
                 <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsEditRoomModalOpen(false)}>Cancel</Button>
                 <Button type="submit" className="flex-1 h-14 rounded-2xl font-bold bg-indigo-600 shadow-lg text-white" disabled={roomEditLoading}>
                   {roomEditLoading ? "Saving..." : "Save Changes"}
                 </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Resident Dialog */}
      <Dialog open={isAddTenantModalOpen} onOpenChange={setIsAddTenantModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Register New Resident</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                  {property?.name} &bull; Resident Onboarding
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddTenantSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                <Input 
                  placeholder="e.g. Rahul Sharma"
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                <Input 
                  placeholder="e.g. 9876543210"
                  value={tenantForm.phone}
                  onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                <Input 
                  type="email"
                  placeholder="e.g. rahul@gmail.com"
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Aadhar / National ID (Optional)</Label>
                <Input 
                  placeholder="12-digit Aadhar Number"
                  value={tenantForm.aadhar_number}
                  onChange={(e) => setTenantForm({...tenantForm, aadhar_number: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Room</Label>
                <Select value={selectedTenantRoom} onValueChange={handleRoomSelect}>
                  <SelectTrigger className="rounded-xl h-12 bg-gray-50 border-none font-bold">
                    <SelectValue placeholder="Choose a room" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl max-h-60">
                    {(property?.rooms || []).map((rm) => (
                      <SelectItem key={rm.id} value={String(rm.room_number)}>
                        <div className="flex items-center justify-between gap-4 font-bold">
                          <span>Room {rm.room_number} (Floor {rm.floor})</span>
                          <span className="text-[10px] text-muted-foreground font-black">₹{rm.rent_per_bed}/mo &bull; {rm.occupied_beds}/{rm.total_beds} beds</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Bed</Label>
                <Select 
                  value={tenantForm.bed_number} 
                  onValueChange={(val) => setTenantForm({...tenantForm, bed_number: val})}
                  disabled={!selectedTenantRoom}
                >
                  <SelectTrigger className="rounded-xl h-12 bg-gray-50 border-none font-bold disabled:opacity-50">
                    <SelectValue placeholder={selectedTenantRoom ? "Choose bed" : "Select room first"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {(() => {
                      const room = (property?.rooms || []).find(r => String(r.room_number) === String(selectedTenantRoom));
                      if (!room) return null;
                      const beds = Array.from({ length: room.total_beds || 1 }, (_, i) => String.fromCharCode(65 + i));
                      const occupiedBeds = ((property?.tenants && property.tenants.length > 0) ? property.tenants : (allTenants || []))
                        .filter(t => String(t.room_number || "").trim().toLowerCase() === String(selectedTenantRoom || "").trim().toLowerCase())
                        .map(t => String(t.bed_number || "").trim().toUpperCase().replace(/^BED\s*[-_]?\s*/i, ""));
                      
                      return beds.map((bed) => {
                        const isOccupied = occupiedBeds.includes(bed);
                        return (
                          <SelectItem key={bed} value={bed} disabled={isOccupied}>
                            <div className="flex items-center justify-between w-full gap-4 font-bold">
                              <span>Bed {bed}</span>
                              <span className={`text-[10px] font-black uppercase ${isOccupied ? 'text-red-500' : 'text-emerald-600'}`}>
                                {isOccupied ? 'Occupied' : 'Available'}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      });
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Monthly Rent (₹)</Label>
                <Input 
                  type="number"
                  placeholder="8000"
                  value={tenantRentAmount}
                  onChange={(e) => setTenantRentAmount(e.target.value)}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Advance (₹)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={tenantForm.advance}
                  onChange={(e) => setTenantForm({...tenantForm, advance: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Joining Date</Label>
                <Input 
                  type="date"
                  value={tenantForm.join_date}
                  onChange={(e) => setTenantForm({...tenantForm, join_date: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rent Due Date</Label>
                <Input 
                  type="text"
                  placeholder="5th of month"
                  value={tenantForm.rent_due_date}
                  onChange={(e) => setTenantForm({...tenantForm, rent_due_date: e.target.value})}
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Initial Rent Status</Label>
                <Select value={tenantForm.rent_status} onValueChange={(val) => setTenantForm({...tenantForm, rent_status: val})}>
                  <SelectTrigger className="rounded-xl h-12 bg-gray-50 border-none font-bold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="due">Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="outline" className="flex-1 rounded-2xl h-14 font-bold" onClick={() => setIsAddTenantModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100" disabled={addTenantLoading}>
                {addTenantLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 mr-2" /> Add Resident</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Room Bed & Resident Allocation Dialog (Two Buttons: Assign Existing or Add New) */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 p-7 text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                  <Bed className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    Room {selectedRoomForAssign?.room_number}
                    <Badge className="bg-white/20 text-white border-none font-bold text-[10px] uppercase">
                      Floor {selectedRoomForAssign?.floor}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-indigo-100 text-xs font-semibold mt-0.5">
                    {property?.name} &bull; ₹{selectedRoomForAssign?.rent_per_bed || 0}/bed/mo
                  </DialogDescription>
                </div>
              </div>
              <Badge className="bg-white text-indigo-900 font-black text-xs px-3 py-1 rounded-full shadow-sm">
                Bed {selectedBedForAssign} Selected
              </Badge>
            </div>
          </div>

          <div className="p-7 space-y-6">
            {/* Step 1: Bed Selector */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Select Bed to Allocate:
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(() => {
                  if (!selectedRoomForAssign) return null;
                  const roomTenants = getTenantsInRoom(selectedRoomForAssign.room_number, selectedRoomForAssign.floor, property?.id);
                  return Array.from({ length: selectedRoomForAssign.total_beds || 1 }, (_, i) => {
                    const bedLetter = String.fromCharCode(65 + i);
                    const occupiedTenant = findTenantForBed(roomTenants, i);
                    const isSelected = selectedBedForAssign === bedLetter;

                    return (
                      <button
                        key={bedLetter}
                        type="button"
                        onClick={() => setSelectedBedForAssign(bedLetter)}
                        className={cn(
                          "p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between min-h-[72px]",
                          occupiedTenant 
                            ? "bg-purple-50/70 border-purple-200 cursor-pointer hover:border-purple-300"
                            : isSelected
                              ? "bg-indigo-50 border-indigo-600 shadow-md shadow-indigo-100 scale-[1.02]"
                              : "bg-gray-50/80 border-gray-200/80 hover:border-indigo-300 hover:bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-gray-900">Bed {bedLetter}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />}
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold truncate block mt-1",
                          occupiedTenant ? "text-purple-700" : "text-emerald-600"
                        )}>
                          {occupiedTenant ? `Occupied (${occupiedTenant.name})` : "Available"}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Step 2: The Two Action Mode Buttons */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Choose Action:
              </Label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl border border-gray-200/60">
                <button
                  type="button"
                  onClick={() => setAssignModalMode("existing")}
                  className={cn(
                    "py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 tracking-wide",
                    assignModalMode === "existing"
                      ? "bg-white text-indigo-700 shadow-md shadow-indigo-100 scale-[1.01]"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <UserCheck className="w-4 h-4" />
                  Assign Existing Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setAssignModalMode("new")}
                  className={cn(
                    "py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 tracking-wide",
                    assignModalMode === "new"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.01]"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Add New Tenant
                </button>
              </div>
            </div>

            {/* Mode 1: Assign Existing Tenant */}
            {assignModalMode === "existing" && (
              <div className="space-y-4 pt-1 animate-in fade-in-50 duration-200">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Search tenant by name, phone, or current room..."
                    value={searchExistingTenant}
                    onChange={(e) => setSearchExistingTenant(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200 font-bold text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="max-h-[260px] overflow-y-auto space-y-1.5 border border-gray-100 rounded-2xl p-2 bg-gray-50/50">
                  {allTenants
                    .filter(t => {
                      const q = searchExistingTenant.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        (t.name && t.name.toLowerCase().includes(q)) ||
                        (t.phone && t.phone.toLowerCase().includes(q)) ||
                        (t.email && t.email.toLowerCase().includes(q)) ||
                        (t.room_number && String(t.room_number).toLowerCase().includes(q)) ||
                        (t.property_name && t.property_name.toLowerCase().includes(q))
                      );
                    })
                    .map(t => {
                      const isSelected = String(selectedExistingTenantId) === String(t.id);
                      const isCurrentRoom = String(t.room_number) === String(selectedRoomForAssign?.room_number) && Number(t.property_id) === Number(id);

                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedExistingTenantId(t.id)}
                          className={cn(
                            "p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between border",
                            isSelected 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                              : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-xs"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm",
                              isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                            )}>
                              {t.name ? t.name.charAt(0).toUpperCase() : "T"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-sm leading-tight">{t.name}</p>
                                {isCurrentRoom && (
                                  <Badge className={cn(
                                    "text-[9px] px-1.5 py-0 border-none font-bold",
                                    isSelected ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"
                                  )}>
                                    In this room
                                  </Badge>
                                )}
                              </div>
                              <p className={cn(
                                "text-xs font-semibold mt-0.5",
                                isSelected ? "text-indigo-100" : "text-muted-foreground"
                              )}>
                                {t.phone || "No phone"} &bull; Currently: {t.property_name || "PG"} - Room {t.room_number || "Unassigned"} (Bed {t.bed_number || "-"})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {allTenants.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-sm font-bold">
                      No residents found in database.
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 rounded-2xl h-14 font-bold" 
                    onClick={() => setIsAssignModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1 rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100" 
                    disabled={assignLoading || !selectedExistingTenantId}
                    onClick={handleAssignExistingSubmit}
                  >
                    {assignLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5 mr-2" />
                        Assign to Bed {selectedBedForAssign}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Mode 2: Add New Tenant */}
            {assignModalMode === "new" && (
              <form onSubmit={handleAddNewResidentSubmit} className="space-y-4 pt-1 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                    <Input 
                      placeholder="e.g. Rahul Sharma"
                      value={newResidentForm.name}
                      onChange={(e) => setNewResidentForm({...newResidentForm, name: e.target.value})}
                      className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                    <Input 
                      placeholder="e.g. 9876543210"
                      value={newResidentForm.phone}
                      onChange={(e) => setNewResidentForm({...newResidentForm, phone: e.target.value})}
                      className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                    <Input 
                      type="email"
                      placeholder="e.g. rahul@gmail.com"
                      value={newResidentForm.email}
                      onChange={(e) => setNewResidentForm({...newResidentForm, email: e.target.value})}
                      className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Aadhar / National ID (Optional)</Label>
                    <Input 
                      placeholder="12-digit Aadhar"
                      value={newResidentForm.aadhar_number}
                      onChange={(e) => setNewResidentForm({...newResidentForm, aadhar_number: e.target.value})}
                      className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Monthly Rent (₹)</Label>
                    <Input 
                      type="number"
                      placeholder="8000"
                      value={newResidentForm.rent_amount}
                      onChange={(e) => setNewResidentForm({...newResidentForm, rent_amount: e.target.value})}
                      className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Advance (₹)</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={newResidentForm.advance}
                      onChange={(e) => setNewResidentForm({...newResidentForm, advance: e.target.value})}
                      className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Joining Date</Label>
                    <Input 
                      type="date"
                      value={newResidentForm.join_date}
                      onChange={(e) => setNewResidentForm({...newResidentForm, join_date: e.target.value})}
                      className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rent Due Date</Label>
                    <Input 
                      type="text"
                      placeholder="e.g. 5"
                      value={newResidentForm.rent_due_date}
                      onChange={(e) => setNewResidentForm({...newResidentForm, rent_due_date: e.target.value})}
                      className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 rounded-2xl h-14 font-bold" 
                    onClick={() => setIsAssignModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100" 
                    disabled={assignLoading}
                  >
                    {assignLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Register & Assign to Bed {selectedBedForAssign}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Profile Dialog */}
      <Dialog open={isStaffProfileModalOpen} onOpenChange={setIsStaffProfileModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-7 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Staff Profile</DialogTitle>
          </DialogHeader>
          {selectedStaffMember && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-100">
                  {selectedStaffMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">{selectedStaffMember.name}</h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-0.5">{selectedStaffMember.role}</p>
                  <Badge className={cn(
                    "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border-none mt-2",
                    selectedStaffMember.status === 'Active' ? 'bg-green-100 text-green-700' :
                    selectedStaffMember.status === 'On Leave' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {selectedStaffMember.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-muted-foreground">Email</span>
                  </div>
                  <span className="text-xs font-black">{selectedStaffMember.email || "No email"}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-muted-foreground">Phone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black">{selectedStaffMember.phone || "No phone"}</span>
                    {selectedStaffMember.phone && (
                      <a href={`tel:${selectedStaffMember.phone}`} className="text-indigo-600 hover:text-indigo-700">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-muted-foreground">Working Shift</span>
                  </div>
                  <span className="text-xs font-black uppercase text-indigo-700">{selectedStaffMember.shift || "Day"}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-muted-foreground">Assigned Property</span>
                  </div>
                  <span className="text-xs font-black">{property?.name || "This Property"}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl font-bold h-12 border-gray-200"
                  onClick={() => setIsStaffProfileModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-2xl font-bold h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  onClick={() => {
                    handleOpenEditStaff(selectedStaffMember);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Details Dialog */}
      <Dialog open={isEditStaffModalOpen} onOpenChange={setIsEditStaffModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-7 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Edit Staff Details</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Update personal details, role, and shift for this team member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStaffSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input
                value={staffEditForm.name}
                onChange={(e) => setStaffEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Staff Member Name"
                className="rounded-xl h-11 bg-gray-50 border-none font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Role</Label>
                <Select
                  value={staffEditForm.role}
                  onValueChange={(val) => setStaffEditForm(prev => ({ ...prev, role: val }))}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-gray-50 border-none font-bold">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {STAFF_ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Shift</Label>
                <Select
                  value={staffEditForm.shift}
                  onValueChange={(val) => setStaffEditForm(prev => ({ ...prev, shift: val }))}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-gray-50 border-none font-bold">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {STAFF_SHIFTS.map(shift => (
                      <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Phone</Label>
                <Input
                  value={staffEditForm.phone}
                  onChange={(e) => setStaffEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                  className="rounded-xl h-11 bg-gray-50 border-none font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select
                  value={staffEditForm.status}
                  onValueChange={(val) => setStaffEditForm(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-gray-50 border-none font-bold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {STAFF_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={staffEditForm.email}
                onChange={(e) => setStaffEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="staff@example.com"
                className="rounded-xl h-11 bg-gray-50 border-none font-bold"
                required
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-2xl font-bold h-12 border-gray-200"
                onClick={() => setIsEditStaffModalOpen(false)}
                disabled={staffEditLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-2xl font-bold h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
                disabled={staffEditLoading}
              >
                {staffEditLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserIcon({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
