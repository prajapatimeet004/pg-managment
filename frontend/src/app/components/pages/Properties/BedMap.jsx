import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Bed, 
  DoorOpen, 
  Map as MapIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Home,
  Settings2,
  Save,
  Wifi,
  Wind
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Badge } from "../../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { api } from "../../../lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../ui/tabs";
import { Search } from "lucide-react";

export function BedMap({ property }) {
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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
  const [allTenants, setAllTenants] = useState([]);
  const [searchTenant, setSearchTenant] = useState("");
  const [selectedExistingTenant, setSelectedExistingTenant] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Group rooms by floor
  const floors = useMemo(() => {
    const floorMap = {};
    if (property?.rooms) {
      property.rooms.forEach(room => {
        if (!floorMap[room.floor]) floorMap[room.floor] = [];
        floorMap[room.floor].push(room);
      });
    }
    return floorMap;
  }, [property?.rooms]);

  const handleSaveRoom = async (roomData) => {
    setEditLoading(true);
    try {
      await api.updateRoom(roomData.id, {
        total_beds: roomData.total_beds,
        rent_per_bed: roomData.rent_per_bed,
        amenities: roomData.amenities
      });
      toast.success("Room configuration updated!");
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to update room");
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenAssign = (room, bedLetter) => {
    setAssignmentTarget({
      property_id: room.property_id,
      room_number: room.room_number,
      bed_number: bedLetter,
      rent_amount: room.rent_per_bed
    });
    setNewTenant(prev => ({ ...prev, rent_amount: room.rent_per_bed }));
    setIsAssignDialogOpen(true);
    // Fetch all tenants for transfer option
    api.getTenants().then(setAllTenants).catch(console.error);
  };

  const handleRegisterNew = async () => {
    setAssignLoading(true);
    try {
      const tenantData = {
        ...newTenant,
        property_id: assignmentTarget.property_id,
        room_number: assignmentTarget.room_number,
        bed_number: assignmentTarget.bed_number,
        property_name: property.name,
        rent_status: "due"
      };
      await api.createTenant(tenantData);
      toast.success("Tenant registered and assigned!");
      setIsAssignDialogOpen(false);
    } catch (error) {
      toast.error("Registration failed: " + error.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleTransferExisting = async () => {
    if (!selectedExistingTenant) return toast.error("Please select a tenant");
    setAssignLoading(true);
    try {
      await api.transferTenant(selectedExistingTenant, {
        property_id: assignmentTarget.property_id,
        room_number: assignmentTarget.room_number,
        bed_number: assignmentTarget.bed_number
      });
      toast.success("Tenant transferred successfully!");
      setIsAssignDialogOpen(false);
    } catch (error) {
      toast.error("Transfer failed: " + error.message);
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    const sortedFloors = Object.keys(floors).sort((a, b) => a - b);
    if (selectedFloor === null && sortedFloors.length > 0) {
      setSelectedFloor(sortedFloors[0]);
    }
  }, [floors, selectedFloor]);

  const currentRooms = floors[selectedFloor] || [];

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-3xl overflow-hidden border border-gray-100">
      {/* Integrated Header */}
      <div className="p-6 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">{property.name}</h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Floor Visualizer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <LegendItem color="bg-emerald-500" label="Available" />
          <LegendItem color="bg-indigo-600" label="Occupied" />
          <LegendItem color="bg-amber-400" label="In Maintenance" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Simplified Sidebar */}
        <div className="w-24 bg-white border-r border-gray-100 flex flex-col items-center py-6 gap-3">
          <span className="text-[9px] font-black uppercase text-muted-foreground vertical-text mb-4 opacity-40">Floors</span>
          {Object.keys(floors).sort((a, b) => b - a).map(floor => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all",
                selectedFloor === floor 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110" 
                  : "bg-gray-50 text-muted-foreground hover:bg-gray-100"
              )}
            >
              F{floor}
            </button>
          ))}
        </div>

        {/* Standard Map Area */}
        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedFloor}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-7xl mx-auto pb-12"
            >
              {currentRooms.map(room => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  tenants={property.tenants} 
                  onEdit={() => {
                    setEditingRoom({...room});
                    setIsEditDialogOpen(true);
                  }}
                  onAssign={(bedId) => handleOpenAssign(room, bedId)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <EditRoomDialog 
        room={editingRoom}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveRoom}
        loading={editLoading}
      />

      <AssignTenantDialog 
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        target={assignmentTarget}
        newTenant={newTenant}
        setNewTenant={setNewTenant}
        allTenants={allTenants}
        searchTenant={searchTenant}
        setSearchTenant={setSearchTenant}
        selectedExistingTenant={selectedExistingTenant}
        setSelectedExistingTenant={setSelectedExistingTenant}
        onRegister={handleRegisterNew}
        onTransfer={handleTransferExisting}
        loading={assignLoading}
      />
    </div>
  );
}

function RoomCard({ room, tenants }) {
  const beds = Array.from({ length: room.total_beds }, (_, i) => {
    const bedLetter = String.fromCharCode(65 + i);
    const occupant = tenants.find(t => 
      t.room_number === room.room_number && 
      t.bed_number === bedLetter &&
      (t.floor === undefined || t.floor === null || Number(t.floor) === Number(room.floor))
    );
    return {
      id: bedLetter,
      occupied: !!occupant,
      occupant: occupant
    };
  });

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="font-black text-xl leading-none">Room {room.room_number}</h4>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2 block opacity-60">
            {room.total_beds} Sharing &bull; Floor {room.floor}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "rounded-full px-4 py-1 text-[9px] font-black uppercase border-none",
            room.status === 'full' ? "bg-red-50 text-red-600" :
            room.status === 'partial' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
          )}>
            {room.status}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            onClick={(e) => {
               e.stopPropagation();
               onEdit();
            }}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {beds.map(bed => (
          <BedUnit 
            key={bed.id} 
            bed={bed} 
            roomNumber={room.room_number} 
            onClick={() => !bed.occupied && onAssign(bed.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BedUnit({ bed, roomNumber, onClick }) {
  const isOccupied = bed.occupied;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
              "aspect-square rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer transition-all relative",
              isOccupied 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "bg-gray-50 text-gray-400 border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-500"
            )}
          >
            <Bed className={cn("w-6 h-6", isOccupied ? "opacity-100" : "opacity-30")} />
            <span className="text-[10px] font-black mt-1">Bed {bed.id}</span>
            
            {isOccupied && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <div className="w-2 h-2 bg-indigo-600 rounded-full" />
              </div>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="rounded-2xl p-4 bg-gray-900 text-white border-none shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Unit {roomNumber}{bed.id}</span>
              <Badge className={cn("text-[8px] font-black uppercase border-none", isOccupied ? "bg-indigo-500" : "bg-emerald-500")}>
                {isOccupied ? "Occupied" : "Available"}
              </Badge>
            </div>
            {isOccupied ? (
              <div className="flex gap-3 pt-1">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-xs shrink-0">
                  {bed.occupant.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">{bed.occupant.name}</p>
                  <p className="text-[10px] opacity-60 mt-1 uppercase font-bold tracking-tight">{bed.occupant.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-[10px] font-bold opacity-60 uppercase">Ready for Check-in</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────
//  EDIT ROOM DIALOG
// ─────────────────────────────────────────────────────────────────

function EditRoomDialog({ room, isOpen, onOpenChange, onSave, loading }) {
  const [formData, setFormData] = useState(room || {});

  useEffect(() => {
    if (room) setFormData(room);
  }, [room]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl">
               🏨
            </div>
            <div>
               <DialogTitle className="text-2xl font-black">Edit Room {room?.room_number}</DialogTitle>
               <DialogDescription className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                 Floor {room?.floor} Configuration
               </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Total Capacity</Label>
              <div className="relative">
                <Bed className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="number"
                  className="h-12 pl-11 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-600"
                  value={formData.total_beds || ""}
                  onChange={(e) => setFormData({...formData, total_beds: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rent Per Bed</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <Input 
                  type="number"
                  className="h-12 pl-8 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-600"
                  value={formData.rent_per_bed || ""}
                  onChange={(e) => setFormData({...formData, rent_per_bed: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amenities (Comma separated)</Label>
            <div className="relative">
              <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                className="h-12 pl-11 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-600"
                placeholder="WiFi, AC, TV..."
                value={formData.amenities || ""}
                onChange={(e) => setFormData({...formData, amenities: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 flex gap-3">
             <Button 
               type="button" 
               variant="outline" 
               className="flex-1 h-14 rounded-2xl font-bold border-gray-100"
               onClick={() => onOpenChange(false)}
             >
               Cancel
             </Button>
             <Button 
               type="submit" 
               className="flex-1 h-14 rounded-2xl font-bold bg-indigo-600 shadow-lg shadow-indigo-100"
               disabled={loading}
             >
               {loading ? "Saving..." : "Save Configuration"}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ASSIGN TENANT DIALOG
// ─────────────────────────────────────────────────────────────────

function AssignTenantDialog({ 
  isOpen, onOpenChange, target, newTenant, setNewTenant, 
  allTenants, searchTenant, setSearchTenant, selectedExistingTenant, 
  setSelectedExistingTenant, onRegister, onTransfer, loading 
}) {
  const filteredExisting = allTenants.filter(t => 
    t.name.toLowerCase().includes(searchTenant.toLowerCase()) ||
    t.phone.includes(searchTenant)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white">
          <DialogHeader>
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                  👤
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black">Assign Tenant</DialogTitle>
                  <DialogDescription className="text-indigo-100 font-bold opacity-80">
                    Room {target?.room_number} &bull; Bed {target?.bed_number}
                  </DialogDescription>
               </div>
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="w-full h-14 bg-gray-100 rounded-none p-1">
            <TabsTrigger value="new" className="flex-1 rounded-none font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">New Registration</TabsTrigger>
            <TabsTrigger value="existing" className="flex-1 rounded-none font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600">Existing Tenant Transfer</TabsTrigger>
          </TabsList>

          <div className="p-8">
            <TabsContent value="new" className="mt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input 
                    placeholder="Tenant Name" 
                    className="h-12 rounded-xl bg-gray-50 border-none"
                    value={newTenant.name}
                    onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                  <Input 
                    placeholder="+91..." 
                    className="h-12 rounded-xl bg-gray-50 border-none"
                    value={newTenant.phone}
                    onChange={e => setNewTenant({...newTenant, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <Input 
                    placeholder="email@example.com" 
                    className="h-12 rounded-xl bg-gray-50 border-none"
                    value={newTenant.email}
                    onChange={e => setNewTenant({...newTenant, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Aadhar Number</Label>
                  <Input 
                    placeholder="1234 5678 9012" 
                    className="h-12 rounded-xl bg-gray-50 border-none"
                    value={newTenant.aadhar_number}
                    onChange={e => setNewTenant({...newTenant, aadhar_number: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 rounded-2xl font-black bg-indigo-600 shadow-lg shadow-indigo-100"
                onClick={onRegister}
                disabled={loading}
              >
                {loading ? "Registering..." : "Confirm Assignment"}
              </Button>
            </TabsContent>

            <TabsContent value="existing" className="mt-0 space-y-6">
               <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Search by name or phone..." 
                      className="h-12 pl-12 rounded-xl bg-gray-50 border-none"
                      value={searchTenant}
                      onChange={e => setSearchTenant(e.target.value)}
                    />
                  </div>
                  
                  <div className="max-h-[200px] overflow-y-auto border rounded-2xl p-2 space-y-1">
                    {filteredExisting.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => setSelectedExistingTenant(t.id)}
                        className={cn(
                          "p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between",
                          selectedExistingTenant === t.id ? "bg-indigo-50 border-indigo-200" : "hover:bg-gray-50 border-transparent"
                        )}
                      >
                        <div>
                          <p className="font-bold text-sm">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground">{t.property_name} &bull; Room {t.room_number}</p>
                        </div>
                        {selectedExistingTenant === t.id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                    ))}
                  </div>
               </div>
               <Button 
                className="w-full h-14 rounded-2xl font-black bg-indigo-600 shadow-lg shadow-indigo-100"
                onClick={onTransfer}
                disabled={loading}
              >
                {loading ? "Transferring..." : "Complete Transfer"}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-3 h-3 rounded-full", color)} />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}
