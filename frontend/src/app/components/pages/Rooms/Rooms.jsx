import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Bed, Users, DoorOpen, ArrowLeft, Info, Search } from "lucide-react";
import { api } from "../../../lib/api";
import { useDataRefresh } from "../../../lib/dataEvents";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { cn } from "../../ui/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../ui/tabs";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Skeleton } from "../../ui/skeleton";
import { toast } from "sonner";

export function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Assignment Modal State
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignmentTarget, setAssignmentTarget] = useState(null); // { property_id, room_number, bed_number, rent_amount }
  const [newTenant, setNewTenant] = useState({
    name: "", phone: "", email: "", aadhar_number: "",
    join_date: new Date().toISOString().split('T')[0],
    rent_due_date: "5", // Default to 5th
    advance: 0,
    rent_amount: 0
  });
  const [selectedExistingTenant, setSelectedExistingTenant] = useState("");
  const [searchTenant, setSearchTenant] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsData, tenantsData, propsData] = await Promise.all([
        api.getRooms(),
        api.getTenants(),
        api.getProperties()
      ]);
      setRooms(roomsData);
      setTenants(tenantsData);
      setProperties(propsData);
    } catch (error) {
      console.error("Failed to fetch rooms data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(["rooms", "properties", "tenants"], fetchData);

  const sortedRooms = [...rooms].sort((a, b) => 
    a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
  );

  const filteredRooms = sortedRooms.filter((room) => {
    const matchesProperty = filterProperty === "all" || room.property_id === Number(filterProperty);
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    return matchesProperty && matchesStatus;
  });

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const getTenantsInRoom = (roomNum, propertyId) => {
    return tenants.filter(t => t.room_number === roomNum && t.property_id === propertyId);
  };


  const handleOpenAssign = (room, bedIndex) => {
    const bedLetter = String.fromCharCode(65 + bedIndex);
    setAssignmentTarget({
      property_id: room.property_id,
      room_number: room.room_number,
      bed_number: bedLetter,
      rent_amount: room.rent_per_bed
    });
    setNewTenant(prev => ({ ...prev, rent_amount: room.rent_per_bed }));
    setIsAssignDialogOpen(true);
  };

  const handleRegisterNew = async () => {
    try {
      const tenantData = {
        ...newTenant,
        property_id: assignmentTarget.property_id,
        room_number: assignmentTarget.room_number,
        bed_number: assignmentTarget.bed_number,
        property_name: properties.find(p => p.id === assignmentTarget.property_id)?.name || "",
        rent_status: "due"
      };
      await api.createTenant(tenantData);
      toast.success("Tenant registered and assigned successfully!");
      setIsAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to register tenant: " + error.message);
    }
  };

  const handleTransferExisting = async () => {
    if (!selectedExistingTenant) return toast.error("Please select a tenant");
    try {
      await api.transferTenant(selectedExistingTenant, {
        property_id: assignmentTarget.property_id,
        room_number: assignmentTarget.room_number,
        bed_number: assignmentTarget.bed_number
      });
      toast.success("Tenant transferred successfully!");
      setIsAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to transfer tenant: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-500";
      case "full":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">Available</Badge>;
      case "partial":
        return <Badge className="bg-amber-100 text-amber-700 border-none font-bold">Partial</Badge>;
      case "full":
        return <Badge className="bg-rose-100 text-rose-700 border-none font-bold">Full</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoomsByFloor = (roomsList) => {
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

  const getRoomsByProperty = (roomsList) => {
    const grouped = {};
    roomsList.forEach(room => {
      const propName = room.property_name || "Unknown Property";
      if (!grouped[propName]) grouped[propName] = [];
      grouped[propName].push(room);
    });
    return grouped;
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold mb-2">Rooms & Beds</h1>
        <p className="text-gray-600">Manage room allocations and bed availability</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-12" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
                  <p className="text-3xl font-semibold">{rooms.length}</p>
                </div>
                <DoorOpen className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Beds</p>
                  <p className="text-3xl font-semibold">
                    {rooms.reduce((acc, room) => acc + (room.total_beds || 0), 0)}
                  </p>
                </div>
                <Bed className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Occupied</p>
                  <p className="text-3xl font-semibold">
                    {rooms.reduce((acc, room) => acc + (room.occupied_beds || 0), 0)}
                  </p>
                </div>
                <Users className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available</p>
                  <p className="text-3xl font-semibold">
                    {rooms.reduce((acc, room) => acc + ((room.total_beds - room.occupied_beds) || 0), 0)}
                  </p>
                </div>
                <Bed className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger>
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(p => (
                   <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="partial">Partially Occupied</SelectItem>
                <SelectItem value="full">Fully Occupied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {selectedRoomId && selectedRoom ? (
          <motion.div
            key="focused-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pt-4"
          >
            <Button 
              variant="ghost" 
              onClick={() => setSelectedRoomId(null)}
              className="mb-4 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Rooms
            </Button>
            
            <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="bg-white/20 hover:bg-white/30 border-none text-white mb-2">
                       Floor {selectedRoom.floor}
                    </Badge>
                    <h2 className="text-4xl font-black">Room {selectedRoom.room_number}</h2>
                    <p className="text-blue-100 font-medium">{selectedRoom.property_name}</p>
                  </div>
                  {getStatusBadge(selectedRoom.status)}
                </div>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Bed Occupancy
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: selectedRoom.total_beds }, (_, i) => {
                          const roomTenants = getTenantsInRoom(selectedRoom.room_number, selectedRoom.property_id);
                          const tenant = roomTenants[i];
                          return (
                            <div key={i} className={`p-4 rounded-2xl border-2 transition-all ${
                              tenant ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100 dashed"
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  tenant ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                                } shadow-sm`}>
                                  <Bed className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bed {String.fromCharCode(65 + i)}</p>
                                  <p className="font-bold">{tenant ? tenant.name : "Available"}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t">
                       <h3 className="font-bold mb-4">Quick Statistics</h3>
                       <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Rent</p>
                            <p className="text-lg font-black">₹{selectedRoom.rent_per_bed}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                            <p className="text-sm font-bold uppercase">{selectedRoom.status}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Revenue</p>
                            <p className="text-lg font-black text-emerald-600">₹{selectedRoom.occupied_beds * selectedRoom.rent_per_bed}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold mb-3">Room Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.amenities.split(", ").map((a, i) => (
                          <Badge key={i} variant="secondary" className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 italic text-amber-900 text-sm">
                       "Ensure all amenities are checked during weekly maintenance visits. Residents in Room {selectedRoom.room_number} have priority for electrical audits this month."
                    </div>
                    <div className="flex gap-4">
                       <Button 
                        className="flex-1 rounded-xl h-12 font-bold shadow-lg" 
                        disabled={selectedRoom.status === 'full'}
                        onClick={() => {
                          // Find first available bed index
                          const roomTenants = getTenantsInRoom(selectedRoom.room_number, selectedRoom.property_id);
                          // For simplicity, find first index i where roomTenants[i] is missing
                          let firstAvail = 0;
                          for(let i=0; i<selectedRoom.total_beds; i++) {
                            if(!roomTenants[i]) { firstAvail = i; break; }
                          }
                          handleOpenAssign(selectedRoom, firstAvail);
                        }}
                      >
                          Assign Tenant
                       </Button>
                       <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold">
                          Maintenance
                       </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            layout
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <TooltipProvider>
              {loading ? (
                <div className="space-y-12">
                   {[1, 2].map(floor => (
                     <div key={floor} className="space-y-6">
                        <Skeleton className="h-8 w-48 rounded-xl" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[1,2,3,4].map(i => (
                            <Card key={i} className="h-64 rounded-[2rem]">
                              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                              <CardContent className="space-y-4">
                                <div className="flex gap-2"><Skeleton className="w-8 h-8 rounded-lg" /><Skeleton className="w-8 h-8 rounded-lg" /></div>
                                <Skeleton className="h-10 w-full rounded-xl" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                     </div>
                   ))}
                </div>
              ) : Object.entries(getRoomsByProperty(filteredRooms)).map(([propName, propRooms]) => (
                <div key={propName} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">{propName}</h2>
                    <Badge variant="outline" className="rounded-full border-indigo-100 text-indigo-600 font-bold px-3">
                      {propRooms.length} Units
                    </Badge>
                  </div>

                  {Object.entries(getRoomsByFloor(propRooms)).sort(([a],[b]) => Number(a) - Number(b)).map(([floor, floorRooms]) => (
                    <div key={floor} className="space-y-6 pl-4 border-l-2 border-gray-100">
                      {/* Centered Floor Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-gray-100" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-[#fefefe] px-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                            Floor {floor}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {floorRooms.map((room) => (
                          <Card key={room.id} className="group hover:shadow-2xl transition-all duration-300 border border-gray-100 shadow-sm rounded-[2rem] overflow-hidden bg-white h-full flex flex-col hover:-translate-y-1">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <div className="cursor-help">
                                      <CardTitle className="flex items-center gap-2 text-xl font-black">
                                        Room {room.room_number}
                                      </CardTitle>
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80 rounded-2xl shadow-2xl border-none p-4 bg-white z-50">
                                    <h4 className="text-sm font-black mb-2">Room {room.room_number} Residents</h4>
                                    <div className="space-y-2">
                                      {getTenantsInRoom(room.room_number, room.property_id).map((t, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <span className="font-bold">{t.name}</span>
                                          <span className="text-muted-foreground">(Bed {String.fromCharCode(65 + idx)})</span>
                                        </div>
                                      ))}
                                      {Array.from({ length: room.total_beds - room.occupied_beds }).map((_, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs opacity-50">
                                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                                          <span className="font-medium text-muted-foreground">Available Bed</span>
                                        </div>
                                      ))}
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                                <Badge className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full font-bold border-none",
                                  room.occupied_beds === 0 ? "bg-emerald-100 text-emerald-700" :
                                  room.occupied_beds === room.total_beds ? "bg-rose-100 text-rose-700" :
                                  "bg-amber-100 text-amber-700"
                                )}>
                                  {room.occupied_beds}/{room.total_beds}
                                </Badge>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-2 flex-1 flex flex-col px-6">
                              {/* Bed Heat-Map */}
                              <div className="flex flex-wrap gap-2">
                                {Array.from({ length: room.total_beds }, (_, i) => {
                                  const roomTenants = getTenantsInRoom(room.room_number, room.property_id);
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

                              <div className="flex gap-3 pt-4 border-t">
                                <Button 
                                  variant="outline" 
                                  className="flex-1 rounded-xl h-10 font-bold border-gray-100 hover:bg-gray-50" 
                                  size="sm"
                                  onClick={() => setSelectedRoomId(room.id)}
                                >
                                  Details
                                </Button>
                                {room.status !== "full" && (
                                  <Button 
                                    className="flex-1 rounded-xl h-10 font-bold shadow-indigo-100" 
                                    size="sm"
                                    onClick={() => {
                                      const roomTenants = getTenantsInRoom(room.room_number, room.property_id);
                                      let firstAvail = 0;
                                      for(let i=0; i<room.total_beds; i++) {
                                        if(!roomTenants[i]) { firstAvail = i; break; }
                                      }
                                      handleOpenAssign(room, firstAvail);
                                    }}
                                  >
                                    Assign
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </TooltipProvider>

            {filteredRooms.length === 0 && (
              <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                <DoorOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-bold text-gray-900">No rooms found</p>
                <p className="text-muted-foreground">Adjust your filters to see more units.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>


      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">AI Room Management Insights</h3>
              <p className="text-sm opacity-90 mb-4">
                Based on current occupancy patterns, rooms 102 and 202 have the highest turnover.
                Consider optimizing pricing or amenities for these rooms to improve retention.
                Your overall occupancy rate is strong at{" "}
                {Math.round(
                  (rooms.reduce((acc, r) => acc + (r.occupied_beds || 0), 0) /
                    (rooms.reduce((acc, r) => acc + (r.total_beds || 0), 0) || 1)) *
                  100
                )}
                %.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Modal */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2rem] overflow-hidden p-0 border-none shadow-2xl">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white">
            <DialogTitle className="text-2xl font-black">Assign bed</DialogTitle>
            <DialogDescription className="text-indigo-100">
              Assigning {assignmentTarget?.room_number} - Bed {assignmentTarget?.bed_number}
            </DialogDescription>
          </div>
          
          <div className="p-6">
            <Tabs defaultValue="transfer" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="transfer" className="rounded-lg font-bold">Existing Tenant</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg font-bold">Register New</TabsTrigger>
              </TabsList>

              <TabsContent value="transfer" className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Select Tenant</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name..." 
                      className="pl-9 rounded-xl border-gray-100" 
                      value={searchTenant}
                      onChange={(e) => setSearchTenant(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1 mt-2 border rounded-xl p-2 bg-gray-50/50">
                    {tenants
                      .filter(t => t.name.toLowerCase().includes(searchTenant.toLowerCase()))
                      .map(t => (
                        <div 
                          key={t.id}
                          onClick={() => setSelectedExistingTenant(t.id)}
                          className={cn(
                            "p-3 rounded-lg cursor-pointer transition-all flex justify-between items-center group",
                            selectedExistingTenant === t.id 
                              ? "bg-indigo-600 text-white shadow-lg" 
                              : "hover:bg-white hover:shadow-md bg-transparent"
                          )}
                        >
                          <div>
                            <p className="font-bold text-sm">{t.name}</p>
                            <p className={cn("text-[10px]", selectedExistingTenant === t.id ? "text-indigo-100" : "text-muted-foreground")}>
                              Currently: {t.property_name} - {t.room_number}
                            </p>
                          </div>
                          {selectedExistingTenant === t.id && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                        </div>
                      ))
                    }
                  </div>
                </div>
                <Button className="w-full rounded-xl h-12 font-bold shadow-lg mt-4" onClick={handleTransferExisting}>
                  Confirm Move
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider">Full Name</Label>
                    <Input placeholder="John Doe" className="rounded-xl border-gray-100 h-11" value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider">Phone</Label>
                    <Input placeholder="+91 ..." className="rounded-xl border-gray-100 h-11" value={newTenant.phone} onChange={e => setNewTenant({...newTenant, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider">Email</Label>
                    <Input placeholder="john@email.com" className="rounded-xl border-gray-100 h-11" value={newTenant.email} onChange={e => setNewTenant({...newTenant, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider">Aadhar Number</Label>
                    <Input placeholder="1234 5678 9012" className="rounded-xl border-gray-100 h-11" value={newTenant.aadhar_number} onChange={e => setNewTenant({...newTenant, aadhar_number: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider">Join Date</Label>
                    <Input type="date" className="rounded-xl border-gray-100 h-11" value={newTenant.join_date} onChange={e => setNewTenant({...newTenant, join_date: e.target.value})} />
                  </div>
                   <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-wider">Rent Due (Day of Month)</Label>
                    <Input type="number" className="rounded-xl border-gray-100 h-11" value={newTenant.rent_due_date} onChange={e => setNewTenant({...newTenant, rent_due_date: e.target.value})} />
                  </div>
                </div>
                <Button className="w-full rounded-xl h-12 font-bold shadow-lg mt-4" onClick={handleRegisterNew}>
                  Register & Assign
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
