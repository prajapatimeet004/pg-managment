import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
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
  Map as MapIcon,
  Save,
  Loader2,
  Settings2,
  Wifi
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
import { BedMap } from "./BedMap";
import { toast } from "sonner";
import { useDataRefresh } from "../../../lib/dataEvents";

export function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
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

  const fetchProperty = async () => {
    try {
      const data = await api.getProperty(id);
      setProperty(data);
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

  const getTenantsInRoom = (roomNum, floorNum, propId) => {
    if (!property?.tenants) return [];
    return property.tenants.filter(t => 
      t.room_number === roomNum && 
      (t.floor === undefined || t.floor === null || Number(t.floor) === Number(floorNum)) &&
      t.property_id === Number(propId)
    );
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
          { label: "Total Revenue", value: `₹${(property.monthly_revenue / 1000).toFixed(0)}K`, icon: IndianRupee, color: "indigo", sub: "Monthly collection" },
          { label: "Active Rooms", value: property.total_rooms, icon: Bed, color: "blue", sub: "Operational units" },
          { label: "Complaints", value: property.complaints.filter(c => c.status !== 'resolved').length, icon: AlertCircle, color: "red", sub: "Needs attention" },
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
            <h3 className="text-xl font-black">Current Residents ({property.tenants.length})</h3>
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Resident
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {property.tenants.map((tenant) => (
              <Card key={tenant.id} className="border-none shadow-sm hover:shadow-lg transition-all rounded-[2rem] overflow-hidden group">
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
                        <span className="text-[10px] font-black">{tenant.email}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                     <Button variant="ghost" className="flex-1 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-bold ring-1 ring-inset ring-gray-200">View Profile</Button>
                     <Button variant="ghost" size="icon" className="rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                        <Phone className="w-4 h-4" />
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {property.tenants.length === 0 && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-muted-foreground font-bold">No active residents recorded for this location.</p>
                </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-8 pt-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-xl font-black">Room Inventory ({property.rooms.length})</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Live Unit Allocation</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                    <MapIcon className="w-4 h-4 mr-2" /> Interactive Map
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh]">
                   <BedMap property={property} />
                </DialogContent>
              </Dialog>
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
                      <div key={room.id} className="p-6 rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
                        <div className="flex items-center justify-between mb-5">
                          <p className="text-lg font-black tracking-tight text-gray-900">Room {room.room_number}</p>
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
                              onClick={() => {
                                setEditingRoom(room);
                                setIsEditRoomModalOpen(true);
                              }}
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: room.total_beds }, (_, i) => {
                            const roomTenants = getTenantsInRoom(room.room_number, room.floor, property.id);
                            const t = roomTenants[i];
                            return (
                              <Tooltip key={i} delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-help border-2",
                                    t 
                                      ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100" 
                                      : "bg-gray-50 border-gray-100"
                                  )}>
                                    <Bed className={cn(
                                      "w-5 h-5",
                                      t ? "text-white" : "text-gray-300"
                                    )} />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-bold bg-gray-900 text-white p-2">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", t ? "bg-emerald-400" : "bg-gray-400")} />
                                    {t ? `Bed ${String.fromCharCode(65 + i)}: ${t.name}` : `Bed ${String.fromCharCode(65 + i)}: Available`}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
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
          </div>

          {(property.staff || []).length === 0 ? (
            <div className="py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground font-bold">No staff assigned to this property yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(property.staff || []).map((member) => (
                <Card key={member.id} className="border-none shadow-sm hover:shadow-lg transition-all rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-6">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xl border-4 border-white shadow-sm transition-transform group-hover:scale-110">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-base leading-tight break-words">{member.name}</h4>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-0.5">{member.role}</p>
                      </div>
                      <Badge className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase shrink-0",
                        member.status === 'Active' ? 'bg-green-100 text-green-700' :
                        member.status === 'On Leave' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {member.status}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-muted-foreground">Email</span>
                        </div>
                        <span className="text-[10px] font-black truncate max-w-[140px]">{member.email}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-muted-foreground">Phone</span>
                        </div>
                        <span className="text-[10px] font-black">{member.phone}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold text-muted-foreground">Shift</span>
                        </div>
                        <span className="text-[10px] font-black text-indigo-700 uppercase">{member.shift}</span>
                      </div>
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
