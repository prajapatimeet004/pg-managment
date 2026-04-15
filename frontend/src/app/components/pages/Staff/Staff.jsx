import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone,
  Clock,
  Trash2,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { cn } from '../../ui/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";

const ROLES = ["Admin", "Property Manager", "Housekeeping Head", "Security Guard", "Maintenance"];
const SHIFTS = ["Day", "Night", "Rotating"];
const STATUSES = ["Active", "On Leave", "Terminated"];

export function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Staff Form State
  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "Property Manager",
    email: "",
    phone: "",
    property_id: "",
    status: "Active",
    shift: "Day"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, propRes] = await Promise.all([
        fetch("http://localhost:8000/staff"),
        fetch("http://localhost:8000/properties")
      ]);
      const [staffData, propData] = await Promise.all([
        staffRes.json(),
        propRes.json()
      ]);
      setStaffList(staffData);
      setProperties(propData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStaff,
          property_id: newStaff.property_id ? parseInt(newStaff.property_id) : null
        })
      });
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewStaff({
          name: "",
          role: "Property Manager",
          email: "",
          phone: "",
          property_id: "",
          status: "Active",
          shift: "Day"
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding staff:", error);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const response = await fetch(`http://localhost:8000/staff/${id}`, {
        method: "DELETE"
      });
      if (response.ok) fetchData();
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
  };

  const filteredStaff = staffList.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.property_name && item.property_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-black tracking-tight mb-2">Staff & Manager Hub</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Manage roles, assignments, and property access.
          </p>
        </motion.div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3"
            >
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all hover:scale-105 active:scale-95">
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-bold">Add Staff Member</span>
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Register New Staff</DialogTitle>
              <DialogDescription className="font-medium">
                Enter details and assign to a property.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    className="py-6 rounded-xl bg-gray-50 border-none" 
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role</Label>
                  <Select 
                    value={newStaff.role} 
                    onValueChange={(val) => setNewStaff({...newStaff, role: val})}
                  >
                    <SelectTrigger className="py-6 rounded-xl bg-gray-50 border-none">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Shift</Label>
                  <Select 
                    value={newStaff.shift} 
                    onValueChange={(val) => setNewStaff({...newStaff, shift: val})}
                  >
                    <SelectTrigger className="py-6 rounded-xl bg-gray-50 border-none">
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFTS.map(shift => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    className="py-6 rounded-xl bg-gray-50 border-none" 
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 00000 00000" 
                    className="py-6 rounded-xl bg-gray-50 border-none" 
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Assign Property (Manager Access)</Label>
                  <Select 
                    value={newStaff.property_id} 
                    onValueChange={(val) => setNewStaff({...newStaff, property_id: val})}
                  >
                    <SelectTrigger className="py-6 rounded-xl bg-gray-50 border-none">
                      <SelectValue placeholder="Select Property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  Complete Registration
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Staff", value: staffList.length, icon: Users, color: "bg-blue-600 shadow-blue-100" },
          { label: "On Duty", value: staffList.filter(s => s.status === 'Active').length, icon: CheckCircle2, color: "bg-green-600 shadow-green-100" },
          { label: "Managers", value: staffList.filter(s => s.role === 'Property Manager').length, icon: ShieldCheck, color: "bg-indigo-600 shadow-indigo-100" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-xl group"
          >
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl font-black mb-1">{stat.value}</div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, role or property..." 
              className="pl-11 py-6 bg-gray-50/50 dark:bg-gray-800/50 border-none rounded-2xl focus-visible:ring-2 ring-indigo-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-gray-200 dark:border-gray-700 h-11 px-4">
              <Filter className="w-4 h-4 mr-2" />
              <span className="font-bold text-sm">Filters</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-left">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Staff Member</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Role/Permission</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Assigned Property</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Shift</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-muted-foreground font-bold italic animate-pulse">
                    Loading personnel data...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-muted-foreground font-bold">
                    No staff found matching your criteria.
                  </td>
                </tr>
              ) : filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/20 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-black text-xs">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <div className="font-bold text-sm">{staff.name}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase">{staff.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-bold">{staff.role}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold">{staff.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-sm font-semibold">{staff.property_name || "All Properties"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                      staff.status === "Active" 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : staff.status === "On Leave"
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                        : "bg-red-100 text-red-700 hover:bg-red-100"
                    )}>
                      {staff.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {staff.shift}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteStaff(staff.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
