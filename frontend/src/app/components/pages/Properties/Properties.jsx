import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Badge } from "../../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { 
  Building2, MapPin, Users, IndianRupee, Plus, Phone, ArrowRight, Star, 
  ShieldCheck, Trash2, ArrowLeft, Mail, FileText, AlertCircle, Bed, ExternalLink,
  MessageSquare, Bell, DoorOpen
} from "lucide-react";
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [focusedPropertyData, setFocusedPropertyData] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);


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
        setProperties(prev => [...prev, newProperty]);
        setIsAddDialogOpen(false);
        resetWizard();
        notifyDataUpdated("properties");
        alert(`✅ Property created! ${totalRoomsForConfig} rooms auto-generated.`);
      } else {
        throw new Error("Failed to create property. Please check your data.");
      }
    } catch (error) {
      alert(`Error: ${error.message || "Something went wrong"}`);
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

  const fetchFocusedProperty = useCallback(async (id) => {
    setIsDataLoading(true);
    try {
      const data = await api.getProperty(id);
      setFocusedPropertyData(data);
    } catch (error) {
      console.error("Failed to fetch property details:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchFocusedProperty(selectedPropertyId);
    } else {
      setFocusedPropertyData(null);
    }
  }, [selectedPropertyId, fetchFocusedProperty]);

  useDataRefresh(["properties"], () => {
    fetchProperties();
    if (selectedPropertyId) fetchFocusedProperty(selectedPropertyId);
  });

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    if (deleteConfirmName !== propertyToDelete.name) {
      alert("Property name doesn't match!");
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteProperty(propertyToDelete.id);
      notifyDataUpdated("properties");
      setPropertyToDelete(null);
      setDeleteConfirmName("");
    } catch (error) {
      console.error("Failed to delete property:", error);
      alert("Failed to delete property.");
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
  const WizardStep1 = () => (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const nf = parseInt(fd.get("num_floors")) || 1;
      setBasicInfo({ name: fd.get("name"), address: fd.get("address"), manager: fd.get("manager"), phone: fd.get("phone"), numFloors: nf });
      setFloorRooms([]);
      setFloorRoomsInput({});
      setRoomConfigs({});
      setWizardStep(2);
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

  const WizardStep2 = () => {
    const floors = Array.from({ length: basicInfo.numFloors }, (_, i) => i + 1);
    return (
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        const rooms = floors.map(f => parseInt(floorRoomsInput[f] || 0));
        if (rooms.some(r => !r || r < 1)) { alert("Please enter at least 1 room per floor."); return; }
        setFloorRooms(rooms);
        setCurrentConfig({ floor: 1, room: 1 });
        setRoomConfigs({});
        setWizardStep(3);
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
          <Button type="button" variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => setWizardStep(1)}>← Back</Button>
          <Button type="submit" size="lg" className="flex-1 rounded-2xl h-12 font-bold">Next: Configure Rooms →</Button>
        </div>
      </form>
    );
  };

  const WizardStep3 = () => {
    const { floor, room } = currentConfig;
    const rNum = roomNum(floor, room);
    const key = `${floor}-${room}`;
    const existing = roomConfigs[key] || { beds: "", rent: "", has_ac: false };
    const [localBeds, setLocalBeds] = useState(existing.beds || "");
    const [localRent, setLocalRent] = useState(existing.rent_per_bed || "");
    const [localAc, setLocalAc] = useState(existing.has_ac || false);
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
          <Button type="button" variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => setWizardStep(2)}>← Back</Button>
          <Button
            size="lg"
            className="flex-1 rounded-2xl h-12 font-bold"
            disabled={!localBeds || !localRent || isSaving}
            onClick={() => handleSaveRoom(localBeds, localRent, localAc)}
          >
            {isSaving ? "Saving..." : nextRoom() ? `Save & Next Room →` : `✅ Finish & Create`}
          </Button>
        </div>
      </div>
    );
  };

  const wizardTitles = ["Basic Info", "Floor Layout", "Room Config"];
  const wizardIcons = ["🏠", "🏢", "🚪"];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 px-3 py-1 rounded-full border-indigo-200 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 font-bold uppercase tracking-widest text-[10px]">
            Portfolio Management
          </Badge>
          <h1 className="text-4xl font-black tracking-tight mb-2">My Properties</h1>
          <p className="text-muted-foreground max-w-lg font-medium">
            Review and manage your real estate assets, monitor occupancy, and optimize revenue streams across all PG locations.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetWizard(); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-2xl h-14 px-8 font-bold shadow-xl shadow-indigo-100 dark:shadow-none transition-all hover:scale-105">
              <Plus className="w-5 h-5 mr-2" />
              Register Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold">New Property Registration</DialogTitle>
              {/* Step indicators */}
              <div className="flex items-center gap-2 mt-3">
                {wizardTitles.map((title, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i + 1 === wizardStep ? "bg-indigo-600 text-white" :
                      i + 1 < wizardStep ? "bg-emerald-500 text-white" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {i + 1 < wizardStep ? "✓" : wizardIcons[i]}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${i + 1 === wizardStep ? "text-indigo-600" : "text-muted-foreground"}`}>{title}</span>
                    {i < wizardTitles.length - 1 && <div className="w-4 h-px bg-gray-200 mx-1" />}
                  </div>
                ))}
              </div>
            </DialogHeader>
            {wizardStep === 1 && <WizardStep1 />}
            {wizardStep === 2 && <WizardStep2 />}
            {wizardStep === 3 && <WizardStep3 />}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-600 dark:bg-indigo-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Building2 className="w-64 h-64" />
        </div>
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Portfolio Units", value: properties.length, icon: Building2 },
            { label: "Total Capacity", value: properties.reduce((acc, p) => acc + p.total_beds, 0), icon: Users },
            { label: "Average Occupancy", value: "88%", icon: Star },
            { label: "Annualized Revenue", value: "₹93L", icon: IndianRupee },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2 opacity-80 mb-2">
                <stat.icon className="w-4 h-4 text-indigo-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-4xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div layout>
        {selectedPropertyId && focusedPropertyData ? (
          <motion.div
            key="focused-property"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-8"
          >
            {/* Focused Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedPropertyId(null)}
                className="w-fit hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portfolio
              </Button>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 font-bold">
                  LIVE STATUS
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Property Hero Section */}
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-gray-900">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="h-64 lg:h-full relative">
                   <ImageWithFallback
                    src={propertyImages[properties.findIndex(p => p.id === selectedPropertyId) % propertyImages.length]}
                    alt={focusedPropertyData.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-8 text-white">
                    <h2 className="text-4xl font-black mb-1">{focusedPropertyData.name}</h2>
                    <p className="flex items-center gap-2 opacity-90 font-medium">
                      <MapPin className="w-4 h-4" />
                      {focusedPropertyData.address}
                    </p>
                  </div>
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem]">
                      <Users className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Residents</p>
                      <p className="text-xl font-black">{focusedPropertyData.occupied_beds}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem]">
                      <Bed className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rooms</p>
                      <p className="text-xl font-black">{focusedPropertyData.total_rooms}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[1.5rem]">
                      <Star className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rate</p>
                      <p className="text-xl font-black">{Math.round((focusedPropertyData.occupied_beds / focusedPropertyData.total_beds) * 100)}%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="font-bold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        Property Contact
                     </h3>
                     <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                              {focusedPropertyData.manager.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-black">{focusedPropertyData.manager}</p>
                              <p className="text-xs text-muted-foreground font-medium">{focusedPropertyData.phone}</p>
                           </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl border-indigo-200 text-indigo-600">
                           <Phone className="w-3 h-3 mr-2" />
                           Call
                        </Button>
                     </div>
                  </div>
                </CardContent>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rooms Overview */}
              <Card className="lg:col-span-2 border-none shadow-xl rounded-[2rem]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DoorOpen className="w-5 h-5 text-indigo-600" />
                    Unit Allocation
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" asChild>
                    <Link to="/rooms">View Master Map</Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-8 pb-10 space-y-10">
                  <TooltipProvider>
                    {focusedPropertyData.rooms && Object.entries(getRoomsByFloor(focusedPropertyData.rooms)).sort(([a],[b]) => Number(a) - Number(b)).map(([floor, floorRooms]) => (
                      <div key={floor} className="space-y-6">
                        {/* Centered Floor Divider */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-100 dark:border-gray-800" />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-gray-900 px-4 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                              Floor {floor}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                          {floorRooms.map((room) => (
                            <div key={room.id} className="p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                              <div className="flex items-center justify-between mb-5">
                                <p className="text-lg font-black tracking-tight text-gray-900 dark:text-gray-100">Room {room.room_number}</p>
                                <Badge className={cn(
                                  "text-[10px] px-2.5 py-0.5 rounded-full font-bold border-none",
                                  room.occupied_beds === 0 ? "bg-emerald-100 text-emerald-700" :
                                  room.occupied_beds === room.total_beds ? "bg-rose-100 text-rose-700" :
                                  "bg-amber-100 text-amber-700"
                                )}>
                                  {room.occupied_beds}/{room.total_beds}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {Array.from({ length: room.total_beds }, (_, i) => {
                                  const roomTenants = getTenantsInRoom(room.room_number, focusedPropertyData.id);
                                  const t = roomTenants[i];
                                  return (
                                    <Tooltip key={i} delayDuration={100}>
                                      <TooltipTrigger asChild>
                                        <div className={cn(
                                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-help border-2",
                                          t 
                                            ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none" 
                                            : "bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                                        )}>
                                          <Bed className={cn(
                                            "w-5 h-5",
                                            t ? "text-white" : "text-gray-300 dark:text-gray-600"
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
                  {(!focusedPropertyData.rooms || focusedPropertyData.rooms.length === 0) && (
                    <div className="text-center py-20 flex flex-col items-center">
                       <DoorOpen className="w-12 h-12 text-gray-200 mb-4" />
                       <p className="text-sm text-muted-foreground font-semibold">No rooms are currently configured for this property.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real-time Alerts */}
              <div className="space-y-4">
                 <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Bell className="w-20 h-20" />
                    </div>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-lg">Property Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-start gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-md">
                          <AlertCircle className="w-4 h-4 mt-0.5 text-amber-300" />
                          <div>
                             <p className="text-xs font-bold">Maintenance Due</p>
                             <p className="text-[10px] opacity-80">Water purifier filter replacement scheduled for tomorrow.</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-md">
                          <IndianRupee className="w-4 h-4 mt-0.5 text-emerald-300" />
                          <div>
                             <p className="text-xs font-bold">Unpaid Rents</p>
                             <p className="text-[10px] opacity-80">3 tenants have pending payments for April 2024.</p>
                          </div>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="border-none shadow-xl rounded-[2rem]">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-600" />
                          New Residents
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       {focusedPropertyData.tenants?.slice(0, 3).map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-50">
                                   {tenant.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="text-xs font-bold">{tenant.name}</p>
                                   <p className="text-[10px] text-muted-foreground">{tenant.room_number}</p>
                                </div>
                             </div>
                             <Badge className="bg-emerald-100 text-emerald-700 border-none scale-75 origin-right">ACTIVE</Badge>
                          </div>
                       ))}
                       {(!focusedPropertyData.tenants || focusedPropertyData.tenants.length === 0) && (
                          <p className="text-xs text-center text-muted-foreground py-4">No active tenants assigned.</p>
                       )}
                    </CardContent>
                 </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid-portfolio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
          >
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
                  <Card className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white dark:bg-gray-900 h-full flex flex-col">
                    {/* Image Section */}
                    <div className="h-56 relative overflow-hidden">
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
                              <h3 className="text-xl font-black text-white leading-tight cursor-help">{property.name}</h3>
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
                        <Badge className={cn(
                          "rounded-full px-3 py-1 text-[10px] font-bold border-none",
                          occupancyRate > 90 ? "bg-emerald-500 text-white" : "bg-white text-indigo-900"
                        )}>
                          {occupancyRate}% OCCUPIED
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                      {/* Address & Trust */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground font-medium">
                          <MapPin className="w-4 h-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                          <span className="line-clamp-2">{property.address}</span>
                        </div>
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      </div>

                      {/* High Level Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Capacity</p>
                          <div className="flex items-end gap-1">
                            <span className="text-2xl font-black">{property.occupied_beds}</span>
                            <span className="text-xs text-muted-foreground font-bold mb-1">/ {property.total_beds} BEDS</span>
                          </div>
                        </div>
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                          <p className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider mb-1">Monthly Rev</p>
                          <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">₹{(property.monthly_revenue / 1000).toFixed(0)}k</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Occupancy Progress</span>
                          <span className={occupancyRate > 90 ? "text-emerald-600" : "text-indigo-600"}>{occupancyRate}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${occupancyRate}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full shadow-sm",
                              occupancyRate > 90 ? "bg-emerald-500" : "bg-indigo-600"
                            )}
                          />
                        </div>
                      </div>

                      {/* Manager Card */}
                      <div className="mt-auto pt-6 border-t dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300">
                            {property.manager.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Manager</p>
                            <p className="text-sm font-black">{property.manager}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 border-l pl-3 dark:border-gray-800">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full hover:bg-rose-50 text-rose-500"
                            onClick={(e) => {
                              e.preventDefault();
                              setPropertyToDelete(property);
                              setDeleteConfirmName("");
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 text-indigo-600">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold border-gray-200 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                          Analytics
                        </Button>
                        <Button 
                          onClick={() => setSelectedPropertyId(property.id)}
                          className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-indigo-100 hover:shadow-xl transition-all group"
                        >
                          Manage <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
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
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-rose-500">Delete Property?</DialogTitle>
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
    </div>

  );
}
