import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Building2, MapPin, Users, IndianRupee, Plus, Phone, ArrowRight, Star, ShieldCheck } from "lucide-react";


import { motion } from "motion/react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { cn } from "../ui/utils";
import { api } from "../../lib/api";

const propertyImages = [
  "https://images.unsplash.com/photo-1702295297205-700e205030d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGhvc3RlbCUyMHBnJTIwcm9vbXxlbnwxfHx8fDE3NzU2NzQwODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1694151569569-8288e3118519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3N0ZWwlMjBidWlsZGluZyUyMHBnJTIwcm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc3NTY3NDA4OHww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1755678300059-11157219ba3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwYXBhcnRtZW50JTIwZXh0ZXJpb3IlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzU2NzQwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
];

export function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await api.getProperties();
        setProperties(data);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  if (loading) return <div className="p-8 text-center font-bold">Loading properties...</div>;

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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-2xl h-14 px-8 font-bold shadow-xl shadow-indigo-100 dark:shadow-none transition-all hover:scale-105">
              <Plus className="w-5 h-5 mr-2" />
              Register Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">New Property Registration</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const propertyData = {
                  name: formData.get("name"),
                  address: formData.get("address"),
                  total_rooms: parseInt(formData.get("rooms")),
                  total_beds: parseInt(formData.get("beds")),
                  manager: formData.get("manager"),
                  phone: "+91 00000 00000",
                  occupied_beds: 0,
                  monthly_revenue: 0.0,
                };

                try {
                  const newProperty = await api.createProperty(propertyData);
                  if (newProperty && newProperty.id) {
                    setProperties(prev => [...prev, newProperty]);
                    setIsAddDialogOpen(false);
                    // Reset form and show success if toast was available
                    alert("Property registered successfully!");
                  } else {
                    throw new Error("Failed to create property. Please check your data.");
                  }
                } catch (error) {
                  console.error("Failed to create property:", error);
                  alert(`Error: ${error.message || "Something went wrong"}. Make sure the backend is running.`);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Property Name</Label>
                <Input id="name" name="name" placeholder="e.g., Sunshine PG - Location" className="h-12 rounded-xl bg-gray-50 border-none focus-visible:ring-indigo-500" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Address</Label>
                <Input id="address" name="address" placeholder="Full address" className="h-12 rounded-xl bg-gray-50 border-none focus-visible:ring-indigo-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rooms" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Total Rooms</Label>
                  <Input id="rooms" name="rooms" type="number" placeholder="0" className="h-12 rounded-xl bg-gray-50 border-none focus-visible:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beds" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Total Beds</Label>
                  <Input id="beds" name="beds" type="number" placeholder="0" className="h-12 rounded-xl bg-gray-50 border-none focus-visible:ring-indigo-500" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Manager Name</Label>
                <Input id="manager" name="manager" placeholder="Manager name" className="h-12 rounded-xl bg-gray-50 border-none focus-visible:ring-indigo-500" required />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-2xl h-14 font-bold text-lg mt-4 shadow-lg shadow-indigo-100">
                Create Asset Profile
              </Button>
            </form>
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

      {/* Properties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {properties.map((property, idx) => {
          const occupancyRate = Math.round((property.occupied_beds / property.total_beds) * 100);

          return (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
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
                      <h3 className="text-xl font-black text-white leading-tight">{property.name}</h3>
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
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 text-indigo-600">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* CTA */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold border-gray-200 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                      Analytics
                    </Button>
                    <Button className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-indigo-100 hover:shadow-xl transition-all group">
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
      </div>
    </div>
  );
}
