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
  Home
} from "lucide-react";
import { cn } from "../../ui/utils";
import { Badge } from "../../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

export function BedMap({ property }) {
  const [selectedFloor, setSelectedFloor] = useState(null);

  // Group rooms by floor
  const floors = useMemo(() => {
    const floorMap = {};
    property.rooms.forEach(room => {
      if (!floorMap[room.floor]) floorMap[room.floor] = [];
      floorMap[room.floor].push(room);
    });
    return floorMap;
  }, [property.rooms]);

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
                <RoomCard key={room.id} room={room} tenants={property.tenants} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function RoomCard({ room, tenants }) {
  const beds = Array.from({ length: room.total_beds }, (_, i) => {
    const bedLetter = String.fromCharCode(65 + i);
    const occupant = tenants.find(t => t.room_number === room.room_number && t.bed_number === bedLetter);
    return {
      id: bedLetter,
      occupied: !!occupant,
      occupant: occupant
    };
  });

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="font-black text-xl leading-none">Room {room.room_number}</h4>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2 block opacity-60">
            {room.total_beds} Sharing &bull; Floor {room.floor}
          </span>
        </div>
        <Badge className={cn(
          "rounded-full px-4 py-1 text-[9px] font-black uppercase border-none",
          room.status === 'full' ? "bg-red-50 text-red-600" :
          room.status === 'partial' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {room.status}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {beds.map(bed => (
          <BedUnit key={bed.id} bed={bed} roomNumber={room.room_number} />
        ))}
      </div>
    </div>
  );
}

function BedUnit({ bed, roomNumber }) {
  const isOccupied = bed.occupied;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-3 h-3 rounded-full", color)} />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}
