import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
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
  AlertCircle,
  Edit,
  UserCheck,
  Pencil,
  Hash,
  FileText
} from 'lucide-react';
import { DocumentUploadField } from '../../common/DocumentUploadField';
import { DocumentViewerModal } from '../../common/DocumentViewerModal';
import { DocumentCardBox } from '../../common/DocumentCardBox';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { cn } from '../../ui/utils';
import { api } from "../../../lib/api";
import { useDataRefresh, notifyDataUpdated } from "../../../lib/dataEvents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
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
  const userRole = localStorage.getItem("userRole") || "Owner";
  const userPropertyIds = (localStorage.getItem("propertyIds") || "").split(",").filter(Boolean).map(Number);

  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "Property Manager",
    email: "",
    phone: "",
    property_ids: userRole !== "Owner" && userPropertyIds.length > 0 ? userPropertyIds : [],
    status: "Active",
    shift: "Day",
    aadhar_number: "",
    photo: null,
    aadhar_card_front: null,
    aadhar_card_back: null
  });
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [selectedProfileStaff, setSelectedProfileStaff] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [docViewer, setDocViewer] = useState({ isOpen: false, title: "", imageUrl: null });

  const resetForm = () => {
    setNewStaff({
      name: "",
      role: "Property Manager",
      email: "",
      phone: "",
      property_ids: userRole !== "Owner" && userPropertyIds.length > 0 ? userPropertyIds : [],
      status: "Active",
      shift: "Day",
      aadhar_number: "",
      photo: null,
      aadhar_card_front: null,
      aadhar_card_back: null
    });
    setEditingStaffId(null);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [staffData, propData] = await Promise.all([
        api.getStaff(),
        api.getProperties()
      ]);
      setStaffList(staffData || []);
      setProperties(propData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useDataRefresh(["staff", "properties"], fetchData);


  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...newStaff,
        property_ids: newStaff.property_ids.map(id => parseInt(id))
      };
      let result;
      if (editingStaffId) {
        result = await api.updateStaff(editingStaffId, data);
      } else {
        result = await api.createStaff(data);
      }
      
      if (result) {
        setIsAddModalOpen(false);
        resetForm();
        notifyDataUpdated("staff");
      }
    } catch (error) {
      console.error("Error saving staff:", error);
    }
  };

  const openEditModal = (staff) => {
    setEditingStaffId(staff.id);
    setNewStaff({
      name: staff.name,
      role: staff.role,
      email: staff.email || "",
      phone: staff.phone || "",
      property_ids: staff.property_ids || (staff.property_id ? [staff.property_id] : []),
      status: staff.status,
      shift: staff.shift,
      aadhar_number: staff.aadhar_number || "",
      photo: staff.photo || null,
      aadhar_card_front: staff.aadhar_card_front || null,
      aadhar_card_back: staff.aadhar_card_back || null
    });
    setIsAddModalOpen(true);
  };


  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await api.deleteStaff(id);
      notifyDataUpdated("staff");
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
  };


  // Backend already filters staff by property_id — no extra frontend filter needed
  const propertyStaffList = staffList;

  const filteredStaff = propertyStaffList.filter(item => {
    const name = item.name || "";
    const role = item.role || "";
    const propNames = item.property_names ? item.property_names.join(", ") : (item.property_name || "");
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      propNames.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
        
          <Dialog open={isAddModalOpen} onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <Button 
                  onClick={resetForm}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  <span className="font-bold">Add Staff Member</span>
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[88vh] rounded-3xl border-none shadow-2xl p-0 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
              <div className="p-6 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">
                  {editingStaffId ? "Edit Staff Member" : "Register New Staff"}
                </DialogTitle>
                <DialogDescription className="font-medium text-xs text-muted-foreground mt-0.5">
                  {editingStaffId ? "Update staff details and property assignment." : "Enter details and assign to a property."}
                </DialogDescription>
              </div>

              <form onSubmit={handleSaveStaff} className="flex-1 overflow-y-auto p-6 pt-3 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-none px-3.5 text-sm font-semibold" 
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</Label>
                    <Select 
                      value={newStaff.role} 
                      onValueChange={(val) => setNewStaff({...newStaff, role: val})}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-none px-3.5 text-sm font-semibold">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shift</Label>
                    <Select 
                      value={newStaff.shift} 
                      onValueChange={(val) => setNewStaff({...newStaff, shift: val})}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-none px-3.5 text-sm font-semibold">
                        <SelectValue placeholder="Select Shift" />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFTS.map(shift => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-none px-3.5 text-sm" 
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</Label>
                    <Input 
                      id="phone" 
                      placeholder="+91 00000 00000" 
                      className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-none px-3.5 text-sm" 
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="aadhar_number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aadhaar Number</Label>
                    <Input 
                      id="aadhar_number" 
                      placeholder="XXXX XXXX XXXX" 
                      className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-none px-3.5 text-sm font-mono" 
                      value={newStaff.aadhar_number || ""}
                      onChange={(e) => setNewStaff({...newStaff, aadhar_number: e.target.value})}
                    />
                  </div>

                  {/* Staff Photo */}
                  <div className="col-span-2">
                    <DocumentUploadField
                      label="Staff Photo"
                      sublabel="Passport size or clear face photo"
                      value={newStaff.photo}
                      onChange={(val) => setNewStaff({...newStaff, photo: val})}
                      isAvatar={true}
                    />
                  </div>

                  {/* Aadhaar Cards */}
                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DocumentUploadField
                      label="Aadhar Card (Front)"
                      sublabel="Front side with photo and details"
                      value={newStaff.aadhar_card_front}
                      onChange={(val) => setNewStaff({...newStaff, aadhar_card_front: val})}
                    />
                    <DocumentUploadField
                      label="Aadhar Card (Back)"
                      sublabel="Back side with address"
                      value={newStaff.aadhar_card_back}
                      onChange={(val) => setNewStaff({...newStaff, aadhar_card_back: val})}
                    />
                  </div>

                  {/* Assign Properties */}
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Assign Properties {userRole !== "Owner" && "(Auto-assigned to your PG)"}
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                      {properties.length > 0 ? (
                        properties.map(p => (
                          <div key={p.id} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id={`prop-${p.id}`}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={Array.isArray(newStaff.property_ids) && newStaff.property_ids.includes(p.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const currentIds = Array.isArray(newStaff.property_ids) ? [...newStaff.property_ids] : [];
                                if (checked) {
                                  setNewStaff({...newStaff, property_ids: [...currentIds, p.id]});
                                } else {
                                  setNewStaff({...newStaff, property_ids: currentIds.filter(id => id !== p.id)});
                                }
                              }}
                              disabled={userRole !== "Owner"}
                            />
                            <label 
                              htmlFor={`prop-${p.id}`} 
                              className="text-sm font-semibold cursor-pointer select-none truncate"
                            >
                              {p.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4 text-muted-foreground text-xs font-bold italic">
                          No properties found. Please add a property first.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="pt-3 sticky bottom-0 bg-white dark:bg-gray-900 pb-1 z-10 border-t border-gray-100 dark:border-gray-800 mt-2">
                  <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none">
                    {editingStaffId ? "Save Changes" : "Complete Registration"}
                  </Button>
                </div>
              </form>
            </DialogContent>
        </Dialog>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Staff", value: propertyStaffList.length, icon: Users, color: "bg-blue-600 shadow-blue-100" },
          { label: "On Duty", value: propertyStaffList.filter(s => s.status === 'Active').length, icon: CheckCircle2, color: "bg-green-600 shadow-green-100" },
          { label: "Managers", value: propertyStaffList.filter(s => s.role === 'Property Manager').length, icon: ShieldCheck, color: "bg-indigo-600 shadow-indigo-100" },
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
                <tr 
                  key={staff.id} 
                  onClick={() => {
                    setSelectedProfileStaff(staff);
                    setIsProfileModalOpen(true);
                  }}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-800/20 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 shadow-sm">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          staff.name.split(' ').map(n => n[0]).join('')
                        )}
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
                    <div className="flex flex-col gap-1">
                      {staff.property_names && staff.property_names.length > 0 ? (
                        staff.property_names.map((name, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="text-xs font-semibold truncate max-w-[150px]">{name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-sm font-semibold">{staff.property_name || "All Properties"}</span>
                        </div>
                      )}
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
                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteStaff(staff.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          <DropdownMenuItem 
                            className="cursor-pointer font-bold" 
                            onClick={() => {
                              setSelectedProfileStaff(staff);
                              setIsProfileModalOpen(true);
                            }}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEditModal(staff)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Staff Profile Dialog */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-7 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Staff Profile</DialogTitle>
          </DialogHeader>
          {selectedProfileStaff && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-100 shrink-0 cursor-pointer"
                  onClick={() => selectedProfileStaff.photo && setDocViewer({ isOpen: true, title: `${selectedProfileStaff.name} - Photo`, imageUrl: selectedProfileStaff.photo })}
                  title={selectedProfileStaff.photo ? "Click to view photo" : undefined}
                >
                  {selectedProfileStaff.photo ? (
                    <img src={selectedProfileStaff.photo} alt={selectedProfileStaff.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    selectedProfileStaff.name.split(' ').map(n => n[0]).join('').toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">{selectedProfileStaff.name}</h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-0.5">{selectedProfileStaff.role}</p>
                  <Badge className={cn(
                    "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border-none mt-2",
                    selectedProfileStaff.status === 'Active' ? 'bg-green-100 text-green-700' :
                    selectedProfileStaff.status === 'On Leave' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {selectedProfileStaff.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-muted-foreground">Email</span>
                  </div>
                  <span className="text-xs font-black">{selectedProfileStaff.email || "No email"}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-muted-foreground">Phone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black">{selectedProfileStaff.phone || "No phone"}</span>
                    {selectedProfileStaff.phone && (
                      <a href={`tel:${selectedProfileStaff.phone}`} className="text-indigo-600 hover:text-indigo-700">
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
                  <span className="text-xs font-black uppercase text-indigo-700">{selectedProfileStaff.shift || "Day"}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-muted-foreground">Assigned Property</span>
                  </div>
                  <span className="text-xs font-black">
                    {selectedProfileStaff.property_names && selectedProfileStaff.property_names.length > 0 
                      ? selectedProfileStaff.property_names.join(", ") 
                      : (selectedProfileStaff.property_name || "All Properties")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-muted-foreground">Aadhar Number</span>
                  </div>
                  <span className="text-xs font-black font-mono">{selectedProfileStaff.aadhar_number || "Not Provided"}</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Identity Documents</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-2xl bg-white border border-gray-100 flex flex-col items-center gap-2 shadow-sm">
                      <DocumentCardBox
                        src={selectedProfileStaff.aadhar_card_front}
                        alt="Aadhar Front"
                        type="document"
                        heightClass="h-28"
                        title="Click to view full Aadhar Front"
                        onClick={() => selectedProfileStaff.aadhar_card_front && setDocViewer({ isOpen: true, title: `${selectedProfileStaff.name} - Aadhar Front`, imageUrl: selectedProfileStaff.aadhar_card_front })}
                      />
                      <span className="text-[11px] font-bold text-gray-700">Aadhar Front</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white border border-gray-100 flex flex-col items-center gap-2 shadow-sm">
                      <DocumentCardBox
                        src={selectedProfileStaff.aadhar_card_back}
                        alt="Aadhar Back"
                        type="document"
                        heightClass="h-28"
                        title="Click to view full Aadhar Back"
                        onClick={() => selectedProfileStaff.aadhar_card_back && setDocViewer({ isOpen: true, title: `${selectedProfileStaff.name} - Aadhar Back`, imageUrl: selectedProfileStaff.aadhar_card_back })}
                      />
                      <span className="text-[11px] font-bold text-gray-700">Aadhar Back</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl font-bold h-12 border-gray-200"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-2xl font-bold h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  onClick={() => {
                    openEditModal(selectedProfileStaff);
                    setIsProfileModalOpen(false);
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

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={docViewer.isOpen}
        onClose={() => setDocViewer({ isOpen: false, title: "", imageUrl: null })}
        title={docViewer.title}
        imageUrl={docViewer.imageUrl}
      />
    </div>
  );
}
