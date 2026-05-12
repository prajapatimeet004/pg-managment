import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Badge } from "../../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../../ui/dialog";
import { 
  Building2, MapPin, Users, IndianRupee, Plus, Phone, ArrowRight, Star, 
  ShieldCheck, Trash2, ArrowLeft, Mail, FileText, AlertCircle, Bed, ExternalLink,
  MessageSquare, Bell, DoorOpen, Sparkles
} from "lucide-react";
import { toast } from "sonner";
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


import { motion } from "motion/react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import { cn } from "../../ui/utils";
import { api } from "../../../lib/api";
import { useDataRefresh, notifyDataUpdated } from "../../../lib/dataEvents";
import { Skeleton } from "../../ui/skeleton";

const propertyImages = [
  "https://images.unsplash.com/photo-1702295297205-700e205030d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGhvc3RlbCUyMHBnJTIwcm9vbXxlbnwxfHx8fDE3NzU2NzQwODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1694151569569-8288e3118519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3N0ZWwlMjBidWlsZGluZyUyMHBnJTIwcm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc3NTY3NDA4OHww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1755678300059-11157219ba3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwYXBhcnRtZW50JTIwZXh0ZXJpb3IlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzU2NzQwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
];

export function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const [focusedPropertyData, setFocusedPropertyData] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [statsProperty, setStatsProperty] = useState(null);


  // Multi-step wizard state
  const [wizardStep, setWizardStep] = useState(1); // 1=basic, 2=floor_rooms, 3=room_config
  const [basicInfo, setBasicInfo] = useState({ name: "", address: "", manager: "", phone: "", numFloors: 1 });
  const [floorRooms, setFloorRooms] = useState([]); // [roomCount per floor]
  const [floorRoomsInput, setFloorRoomsInput] = useState({}); // { "1": "3", "2": "2" }
  const [roomConfigs, setRoomConfigs] = useState({}); // { "floor-room": { beds, rent, has_ac } }
  const [currentConfig, setCurrentConfig] = useState({ floor: 1, room: 1 }); // for step 3
  const [isSaving, setIsSaving] = useState(false);

  const resetWizard = () => {
    setWizardStep(1);
    setBasicInfo({ name: "", address: "", manager: "", phone: "", numFloors: 1 });
    setFloorRooms([]);
    setFloorRoomsInput({});
    setRoomConfigs({});
    setCurrentConfig({ floor: 1, room: 1 });
  };

  const totalRoomsForConfig = floorRooms.reduce((a, b) => a + b, 0);
  const configuredRoomsCount = Object.keys(roomConfigs).length;

  // Room numbering: floor=1,room=1 → "101"
  const roomNum = (f, r) => `${f}${String(r).padStart(2, '0')}`;

  // Advance to next unconfigured room
  const nextRoom = () => {
    const { floor, room } = currentConfig;
    const roomsOnFloor = floorRooms[floor - 1] || 0;
    if (room < roomsOnFloor) return { floor, room: room + 1 };
    if (floor < floorRooms.length) return { floor: floor + 1, room: 1 };
    return null; // all done
  };

  const handleSaveRoom = (beds, rent, has_ac) => {
    const key = `${currentConfig.floor}-${currentConfig.room}`;
    const updated = { ...roomConfigs, [key]: { beds: parseInt(beds), rent_per_bed: parseFloat(rent), has_ac } };
    setRoomConfigs(updated);
    const next = nextRoom();
    if (next) {
      setCurrentConfig(next);
    } else {
      // All rooms done — submit
      handleFinalSubmit(updated);
    }
  };

  const handleFinalSubmit = async (configs) => {
    setIsSaving(true);
    try {
      const floors = floorRooms.map((roomCount, floorIdx) => ({
        rooms: Array.from({ length: roomCount }, (_, roomIdx) => {
          const key = `${floorIdx + 1}-${roomIdx + 1}`;
          return configs[key] || { beds: 2, rent_per_bed: 8000, has_ac: false };
        })
      }));
      const payload = {
        name: basicInfo.name,
        address: basicInfo.address,
        manager: basicInfo.manager,
        phone: basicInfo.phone,
        floors,
      };
      const newProperty = await api.createProperty(payload);
      if (newProperty && newProperty.id) {
        setIsAddDialogOpen(false);
        resetWizard();
        setProperties(prev => [...prev, newProperty]);
        notifyDataUpdated("properties");
        toast.success(`Property created! ${totalRoomsForConfig} rooms auto-generated.`);
      } else {
        throw new Error("Failed to create property. Please check your data.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to create property");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchProperties = useCallback(async () => {
    try {
      const data = await api.getProperties();
      setProperties(data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsAddDialogOpen(true);
    }
  }, [searchParams]);

  useDataRefresh("properties", fetchProperties);

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    if (deleteConfirmName !== propertyToDelete.name) {
      alert("Property name doesn't match!");
      return;
    }

    setIsDeleting(true);
    try {
      const deletedId = propertyToDelete.id;
      await api.deleteProperty(deletedId);
      setPropertyToDelete(null);
      setDeleteConfirmName("");
      // Optimistic update: remove from local state instantly
      setProperties(prev => prev.filter(p => p.id !== deletedId));
      notifyDataUpdated("properties");
      toast.success("Property deleted successfully");
    } catch (error) {
      console.error("Failed to delete property:", error);
      toast.error("Failed to delete property");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoomsByFloor = (roomsList) => {
    if (!roomsList) return {};
    const grouped = {};
    roomsList.forEach(room => {
      if (!grouped[room.floor]) grouped[room.floor] = [];
      grouped[room.floor].push(room);
    });
    // Sort rooms within each floor numerically
    Object.keys(grouped).forEach(floor => {
      grouped[floor].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
    });
    return grouped;
  };

  const getTenantsInRoom = (roomNum, propertyId) => {
    if (!focusedPropertyData?.tenants) return [];
    return focusedPropertyData.tenants.filter(t => t.room_number === roomNum && t.property_id === propertyId);
  };



  // Removed blocking if (loading)

// ── Wizard Step Components ─────────────────────────────────────
const WizardStep1 = ({ onNext }) => (
  <form className="space-y-4" onSubmit={(e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nf = parseInt(fd.get("num_floors")) || 1;
    onNext({ 
      name: fd.get("name"), 
      address: fd.get("address"), 
      manager: fd.get("manager"), 
      phone: fd.get("phone"), 
      numFloors: nf 
    });
  }}>
    <div className="space-y-1">
      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Property Name</Label>
      <Input name="name" placeholder="e.g., Sunshine PG - Koramangala" className="h-11 rounded-xl bg-gray-50 border-none" required />
    </div>
    <div className="space-y-1">
      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Address</Label>
      <Input name="address" placeholder="Full address" className="h-11 rounded-xl bg-gray-50 border-none" required />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Manager</Label>
        <Input name="manager" placeholder="Full name" className="h-11 rounded-xl bg-gray-50 border-none" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Phone</Label>
        <Input name="phone" placeholder="+91..." className="h-11 rounded-xl bg-gray-50 border-none" required />
      </div>
    </div>
    <div className="space-y-1">
      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Number of Floors</Label>
      <Input name="num_floors" type="number" min="1" max="20" defaultValue="2" className="h-11 rounded-xl bg-gray-50 border-none" required />
    </div>
    <Button type="submit" size="lg" className="w-full rounded-2xl h-12 font-bold mt-2">Next: Configure Floors →</Button>
  </form>
);

const WizardStep2 = ({ basicInfo, floorRoomsInput, setFloorRoomsInput, onBack, onNext }) => {
  const floors = Array.from({ length: basicInfo.numFloors }, (_, i) => i + 1);
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const rooms = floors.map(f => parseInt(floorRoomsInput[f] || 0));
      if (rooms.some(r => !r || r < 1)) { alert("Please enter at least 1 room per floor."); return; }
      onNext(rooms);
    }}>
      <p className="text-sm text-muted-foreground font-medium">How many rooms are on each floor?</p>
      {floors.map(f => (
        <div key={f} className="flex items-center gap-3">
          <div className="w-24 shrink-0 bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Floor {f}</p>
          </div>
          <Input
            type="number" min="1" max="50"
            placeholder="Rooms count"
            className="h-11 rounded-xl bg-gray-50 border-none flex-1"
            value={floorRoomsInput[f] || ""}
            onChange={(e) => setFloorRoomsInput(prev => ({ ...prev, [f]: e.target.value }))}
            required
          />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1 rounded-2xl h-12" onClick={onBack}>← Back</Button>
        <Button type="submit" size="lg" className="flex-1 rounded-2xl h-12 font-bold">Next: Configure Rooms →</Button>
      </div>
    </form>
  );
};

const WizardStep3 = ({ 
  currentConfig, 
  roomConfigs, 
  onSaveRoom, 
  nextRoom, 
  isSaving, 
  totalRoomsForConfig, 
  configuredRoomsCount, 
  roomNum, 
  onBack 
}) => {
  const { floor, room } = currentConfig;
  const rNum = roomNum(floor, room);
  const key = `${floor}-${room}`;
  const existing = roomConfigs[key] || { beds: "", rent_per_bed: "", has_ac: false };
  
  const [localBeds, setLocalBeds] = useState(existing.beds || "");
  const [localRent, setLocalRent] = useState(existing.rent_per_bed || "");
  const [localAc, setLocalAc] = useState(existing.has_ac || false);
  
  useEffect(() => {
    setLocalBeds(existing.beds || "");
    setLocalRent(existing.rent_per_bed || "");
    setLocalAc(existing.has_ac || false);
  }, [key]);

  const progress = Math.round((configuredRoomsCount / totalRoomsForConfig) * 100);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
          Room {rNum} — Floor {floor}, Room {room}
        </p>
        <div className="h-2 bg-white rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{configuredRoomsCount} / {totalRoomsForConfig} rooms configured</p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Beds in Room {rNum}</Label>
        <Input type="number" min="1" max="20" placeholder="e.g. 3" className="h-11 rounded-xl bg-gray-50 border-none"
          value={localBeds} onChange={e => setLocalBeds(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Rent per Bed (₹)</Label>
        <Input type="number" min="0" placeholder="e.g. 8500" className="h-11 rounded-xl bg-gray-50 border-none"
          value={localRent} onChange={e => setLocalRent(e.target.value)} />
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
        <div>
          <p className="text-sm font-bold">AC Room?</p>
          <p className="text-xs text-muted-foreground">{localAc ? "❄️ Air Conditioned" : "🔆 Non-AC"}</p>
        </div>
        <Switch checked={localAc} onCheckedChange={setLocalAc} />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1 rounded-2xl h-12" onClick={onBack}>← Back</Button>
        <Button
          size="lg"
          className="flex-1 rounded-2xl h-12 font-bold"
          disabled={!localBeds || !localRent || isSaving}
          onClick={() => onSaveRoom(localBeds, localRent, localAc)}
        >
          {isSaving ? "Saving..." : nextRoom ? `Save & Next Room →` : `✅ Finish & Create`}
        </Button>
      </div>
    </div>
  );
};


  const wizardTitles = ["Basic Info", "Floor Layout", "Room Config"];
  const wizardIcons = ["🏠", "🏢", "🚪"];

  return (
    <div className="space-y-4 pb-6">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">My Properties</h1>

        </div>
        {/* Register Property button removed from top */}
      </div>



      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-600 dark:bg-indigo-950 rounded-[1.5rem] p-4 text-white relative overflow-hidden shadow-lg"

      >
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Building2 className="w-64 h-64" />
        </div>
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Portfolio Units", value: properties.length, icon: Building2 },
            { label: "Total Capacity", value: properties.reduce((acc, p) => acc + (p.total_beds || 0), 0), icon: Users },
            { 
              label: "Average Occupancy", 
              value: properties.length > 0 
                ? `${Math.round((properties.reduce((acc, p) => acc + (p.occupied_beds || 0), 0) / properties.reduce((acc, p) => acc + (p.total_beds || 1), 0)) * 100)}%`
                : "0%", 
              icon: Star 
            },
            { 
              label: "Annualized Revenue", 
              value: properties.length > 0
                ? `₹${Math.round((properties.reduce((acc, p) => acc + (p.monthly_revenue || 0), 0) * 12) / 100000)}L`
                : "₹0L",
              icon: IndianRupee 
            },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2 opacity-80 mb-1">
                <stat.icon className="w-3 h-3 text-indigo-300" />
                <span className="text-[8px] font-bold uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-2xl font-black">{stat.value}</p>

            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

            {loading ? (
              [1, 2, 3].map(i => (
                <Card key={i} className="rounded-[2rem] overflow-hidden border-none shadow-xl h-[500px]">
                   <Skeleton className="h-56 w-full" />
                   <CardContent className="p-6 space-y-6">
                      <div className="flex justify-between items-center">
                         <Skeleton className="h-4 w-3/4" />
                         <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <Skeleton className="h-16 w-full rounded-2xl" />
                         <Skeleton className="h-16 w-full rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                         <Skeleton className="h-2 w-full rounded-full" />
                         <Skeleton className="h-2 w-1/4 rounded-full" />
                      </div>
                      <div className="pt-6 border-t flex justify-between">
                         <div className="flex gap-2 items-center">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                         </div>
                      </div>
                   </CardContent>
                </Card>
              ))
            ) : properties.map((property, idx) => {
              const occupancyRate = Math.round((property.occupied_beds / property.total_beds) * 100);

              return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[1.5rem] bg-white dark:bg-gray-900 h-full flex flex-col">
                    {/* Image Section */}
                    <div className="h-32 relative overflow-hidden">


                      <ImageWithFallback
                        src={propertyImages[idx % propertyImages.length]}
                        alt={property.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-white/20 backdrop-blur-md border-none text-white font-bold px-3 py-1.5 rounded-full text-[10px] uppercase">
                          {property.total_rooms} Rooms
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="text-[10px] font-black uppercase">Premium Asset</span>
                          </div>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <h3 className="text-lg font-black text-white leading-tight cursor-help">{property.name}</h3>
                            </HoverCardTrigger>

                            <HoverCardContent className="w-80 rounded-2xl shadow-2xl border-none p-4 bg-white dark:bg-gray-900">
                               <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                        {property.manager.charAt(0)}
                                     </div>
                                     <div>
                                        <p className="text-sm font-black">{property.manager}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{property.address}</p>
                                     </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pt-2">
                                     <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground">Contact</p>
                                        <p className="text-xs font-bold">{property.phone}</p>
                                     </div>
                                     <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground">Occupancy</p>
                                        <p className="text-xs font-bold">{occupancyRate}%</p>
                                     </div>
                                  </div>
                               </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-3 space-y-3 flex-1 flex flex-col">
                      {/* Address & Trust */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-1.5 text-[15px] text-muted-foreground font-medium">
                          <MapPin className="w-4 h-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                          <span className="line-clamp-1">{property.address}</span>
                        </div>
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />

                      </div>

                      {/* High Level Metrics */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                          <p className="text-[12px] font-bold uppercase text-muted-foreground tracking-wider">Capacity</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[22px] font-black">{property.occupied_beds}</span>
                            <span className="text-[12px] text-muted-foreground font-bold">/ {property.total_beds}</span>
                          </div>
                        </div>
                        <div className="p-2 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col justify-center">
                          <p className="text-[12px] font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Rev</p>
                          <span className="text-[22px] font-black text-indigo-700 dark:text-indigo-400">₹{(property.monthly_revenue / 1000).toFixed(0)}k</span>
                        </div>

                      </div>

                      {/* Manager & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t dark:border-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-[14px] text-indigo-700 dark:text-indigo-300">
                            {property.manager.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Manager</p>
                            <p className="text-[14px] font-black truncate">{property.manager}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-7 h-7 rounded-full hover:bg-rose-50 text-rose-500"
                            onClick={(e) => {
                              e.preventDefault();
                              setPropertyToDelete(property);
                              setDeleteConfirmName("");
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-indigo-50 text-indigo-600">
                            <Phone className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-lg h-10 text-[14px] font-bold border-gray-200"
                          onClick={() => setStatsProperty(property)}
                        >
                          Stats
                        </Button>
                        <Link 
                          to={`/properties/${property.id}`}
                          className="flex-1"
                        >
                          <Button 
                            className="w-full rounded-lg h-10 text-[14px] font-bold group"
                          >
                            Manage <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                      </div>

                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Add Property Ghost Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Add New Location</h3>
              <p className="text-sm text-muted-foreground font-medium">Expand your portfolio by adding a new property to your management suite.</p>
            </motion.div>
      </motion.div>

      {/* Add Property Wizard Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetWizard();
        }}>
        <DialogContent className="max-w-xl rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl">
                  {wizardIcons[wizardStep - 1]}
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black">Register Property</DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Step {wizardStep} of 3: {wizardTitles[wizardStep - 1]}
                  </DialogDescription>
               </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            {wizardStep === 1 && (
              <WizardStep1 
                onNext={(info) => {
                  setBasicInfo(info);
                  setFloorRooms([]);
                  setFloorRoomsInput({});
                  setRoomConfigs({});
                  setWizardStep(2);
                }} 
              />
            )}
            {wizardStep === 2 && (
              <WizardStep2 
                basicInfo={basicInfo}
                floorRoomsInput={floorRoomsInput}
                setFloorRoomsInput={setFloorRoomsInput}
                onBack={() => setWizardStep(1)}
                onNext={(rooms) => {
                  setFloorRooms(rooms);
                  setCurrentConfig({ floor: 1, room: 1 });
                  setRoomConfigs({});
                  setWizardStep(3);
                }}
              />
            )}
            {wizardStep === 3 && (
              <WizardStep3 
                currentConfig={currentConfig}
                roomConfigs={roomConfigs}
                onSaveRoom={handleSaveRoom}
                nextRoom={nextRoom()}
                isSaving={isSaving}
                totalRoomsForConfig={totalRoomsForConfig}
                configuredRoomsCount={configuredRoomsCount}
                roomNum={roomNum}
                onBack={() => setWizardStep(2)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-rose-500">Delete Property?</DialogTitle>
            <DialogDescription className="sr-only">
              This action will permanently delete the property and all its associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-rose-500 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Extreme Warning</p>
                <p className="text-xs text-rose-600/80">
                  This will permanently delete <b>{propertyToDelete?.name}</b> and all its contents:
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>All room assignments & maps</li>
                    <li>All tenant records & history</li>
                    <li>All complaints & notices</li>
                    <li>All staff assignments</li>
                  </ul>
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Type the property name to confirm: <span className="text-rose-500">{propertyToDelete?.name}</span>
              </Label>
              <Input 
                placeholder="Type name here..." 
                className="h-12 rounded-xl border-rose-100 focus:ring-rose-500"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setPropertyToDelete(null)}>
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={deleteConfirmName !== propertyToDelete?.name || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Stats Modal */}
      <Dialog open={!!statsProperty} onOpenChange={(open) => !open && setStatsProperty(null)}>
        <DialogContent className="max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl">
                  📊
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black">{statsProperty?.name}</DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Location Performance Overview
                  </DialogDescription>
               </div>
            </div>
          </DialogHeader>
          
          {statsProperty && (
            <div className="space-y-8 py-4">
              {/* Occupancy Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Occupancy Rate</p>
                    <p className="text-3xl font-black text-indigo-600">
                      {Math.round((statsProperty.occupied_beds / statsProperty.total_beds) * 100)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground">
                      {statsProperty.occupied_beds} / {statsProperty.total_beds} Beds
                    </p>
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner p-1">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.round((statsProperty.occupied_beds / statsProperty.total_beds) * 100)}%` }}
                     transition={{ duration: 1, ease: "easeOut" }}
                     className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" 
                   />
                </div>
              </div>

              {/* Financial & Layout Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                          <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Revenue</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-800 dark:text-emerald-400">
                      ₹{(statsProperty.monthly_revenue / 1000).toFixed(1)}k
                    </p>
                    <p className="text-[9px] font-bold text-emerald-600/70 mt-1 uppercase">Monthly Generated</p>
                 </div>

                 <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-[1.5rem] border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Inventory</span>
                    </div>
                    <p className="text-2xl font-black text-blue-800 dark:text-blue-400">
                      {statsProperty.total_rooms}
                    </p>
                    <p className="text-[9px] font-bold text-blue-600/70 mt-1 uppercase">Total Room Units</p>
                 </div>
              </div>

              {/* Insights */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                 <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">
                      {statsProperty.occupied_beds / statsProperty.total_beds > 0.9 
                        ? "High demand detected! Consider optimizing rent for new vacancies."
                        : statsProperty.occupied_beds / statsProperty.total_beds < 0.5
                        ? "Low occupancy. Run a referral campaign for existing tenants."
                        : "Healthy performance. Maintain current service standards."}
                    </p>
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-14 rounded-2xl font-bold border-gray-200"
                  onClick={() => setStatsProperty(null)}
                >
                  Close
                </Button>
                <Link to={`/properties/${statsProperty.id}`} className="flex-1">
                   <Button className="w-full h-14 rounded-2xl font-bold bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none">
                      Manage Details
                   </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>

  );
}
