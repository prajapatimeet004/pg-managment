import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Phone, Mail, Search, Plus, FileText, AlertCircle, Download, CheckCircle, Trash2 } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from "../../../lib/api";
import { useDataRefresh, notifyDataUpdated } from "../../../lib/dataEvents";
import { Skeleton } from "../../ui/skeleton";
import { toast } from "sonner";

export function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedProfileTenant, setSelectedProfileTenant] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tenantsData, propertiesData] = await Promise.all([
        api.getTenants(),
        api.getProperties()
      ]);
      setTenants(tenantsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(["tenants", "properties", "rooms"], fetchData);

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm("Are you sure you want to delete this tenant? Their data will be archived in the system but they will be removed from the property and room.")) return;
    
    setIsDeleting(true);
    try {
      await api.deleteTenant(tenantId);
      toast.success("Tenant deleted and archived successfully");
      setIsProfileDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to delete tenant");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId && isAddDialogOpen) {
      setSelectedRoomNumber("");
      setRentAmount("");
      const fetchPropertyDetails = async () => {
        setIsFetchingDetails(true);
        try {
          const detail = await api.getProperty(selectedPropertyId);
          setPropertyDetails(detail);
        } catch (error) {
          console.error("Failed to fetch property details:", error);
        } finally {
          setIsFetchingDetails(false);
        }
      };
      fetchPropertyDetails();
    } else {
      setPropertyDetails(null);
      setSelectedRoomNumber("");
      setRentAmount("");
    }
  }, [selectedPropertyId, isAddDialogOpen]);


  const filteredTenants = tenants.filter((tenant) => {
    const name = tenant.name || "";
    const phone = tenant.phone || "";
    const email = tenant.email || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProperty =
      filterProperty === "all" || tenant.property_id === Number(filterProperty);

    const matchesStatus = filterStatus === "all" || tenant.rent_status === filterStatus;

    return matchesSearch && matchesProperty && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "due":
        return <Badge className="bg-yellow-500">Due</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const newPassword = formData.get("password");
    const updateData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      rent_amount: parseInt(formData.get("rent")),
      advance: parseInt(formData.get("advance")),
      aadhar_number: formData.get("aadhar_number"),
      rent_status: formData.get("rent_status"),
      ...(newPassword ? { password: newPassword } : {})
    };

    try {
      await api.updateTenant(editingTenant.id, updateData);
      setIsEditDialogOpen(false);
      fetchData();
      notifyDataUpdated("tenants");
      toast.success("Tenant details updated successfully");
    } catch (error) {
      console.error("Failed to update tenant:", error);
      toast.error("Failed to update tenant details");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDownloadInvoice = async (tenant) => {
    setEditLoading(true);
    const toastId = toast.loading("Generating professional PDF Receipt...");
    
    try {
      const propObj = properties.find(p => p.id === tenant.property_id);

      const blob = await api.generateReceiptPDF({
        tenant: tenant,
        property: propObj || { name: tenant.property_name },
        transaction: {
          receipt_number: `REC-${Date.now().toString().slice(-6)}`,
          paid_date: new Date().toISOString(),
          payment_mode: 'Online',
          month: new Date().toLocaleDateString('en-IN', { month: 'long' }),
          amount: tenant.rent_amount + (tenant.advance || 0)
        }
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${tenant.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF Receipt downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF Generation failed:", error);
      toast.error("Failed to generate PDF. Make sure the PDF service is running.", { id: toastId });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Tenants</h1>
          <p className="text-gray-600 font-medium">{filteredTenants.length} tenants active</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-12 px-6 font-bold shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Register New Tenant</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const propertyId = parseInt(formData.get("property_id"));
                
                const selectedRoom = propertyDetails?.rooms?.find(r => r.room_number === formData.get("room"));
                
                const tenantData = {
                  name: formData.get("name"),
                  phone: formData.get("phone"),
                  email: formData.get("email").toLowerCase().trim(),
                  password: formData.get("password"),
                  property_id: propertyId,
                  property_name: "", 
                  room_number: formData.get("room"),
                  floor: selectedRoom?.floor,
                  bed_number: formData.get("bed"),
                  rent_amount: parseInt(formData.get("rent")),
                  advance: parseInt(formData.get("advance")),
                  rent_status: "paid",
                  join_date: formData.get("join_date"),
                  rent_due_date: formData.get("rent_due_date") || "5",
                  aadhar_number: formData.get("aadhar_number")
                };

                try {
                  const newTenant = await api.createTenant(tenantData);
                  setIsAddDialogOpen(false);
                  setTenants(prev => [...prev, newTenant]);
                  notifyDataUpdated("tenants");
                  toast.success(`Tenant ${newTenant.name} registered successfully!`);
                } catch (error) {
                  console.error("Failed to add tenant:", error);
                  toast.error("Failed to register tenant");
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input id="name" name="name" placeholder="Enter tenant name" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+91 XXXXX XXXXX" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email (Login Username)</Label>
                <Input id="email" name="email" type="email" placeholder="tenant@email.com" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password (for Tenant Login)</Label>
                <Input id="password" name="password" type="password" placeholder="Set a login password" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Property</Label>
                <Select 
                  name="property_id" 
                  required 
                  onValueChange={(val) => setSelectedPropertyId(val)}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Room</Label>
                  <Select 
                    name="room" 
                    required 
                    onValueChange={(val) => {
                      setSelectedRoomNumber(val);
                      const roomObj = propertyDetails?.rooms?.find(r => r.room_number === val);
                      if (roomObj) {
                        setRentAmount(roomObj.rent_per_bed.toString());
                      } else {
                        setRentAmount("");
                      }
                    }}
                    disabled={!propertyDetails || isFetchingDetails}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                      <SelectValue placeholder={isFetchingDetails ? "Loading..." : "Select room"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      {propertyDetails?.rooms?.map(r => {
                        const occupancyText = `${r.occupied_beds}/${r.total_beds}`;
                        const isFull = r.occupied_beds >= r.total_beds;
                        return (
                          <SelectItem key={r.room_number} value={r.room_number} disabled={isFull}>
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{r.room_number}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {occupancyText}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bed" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bed</Label>
                  <Select 
                    name="bed" 
                    required
                    disabled={!selectedRoomNumber}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                      <SelectValue placeholder="Select bed" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      {(() => {
                        const room = propertyDetails?.rooms?.find(r => r.room_number === selectedRoomNumber);
                        if (!room) return null;
                        
                        const beds = Array.from({ length: room.total_beds }, (_, i) => String.fromCharCode(65 + i)); 
                        const occupiedBeds = propertyDetails.tenants
                          .filter(t => t.room_number === selectedRoomNumber)
                          .map(t => t.bed_number);
                        
                        return beds.map(bed => {
                          const isOccupied = occupiedBeds.includes(bed);
                          return (
                            <SelectItem key={bed} value={bed} disabled={isOccupied}>
                              <div className="flex items-center justify-between w-full gap-2">
                                <span>Bed {bed}</span>
                                <span className={`text-[10px] font-bold ${isOccupied ? 'text-red-500' : 'text-green-500'}`}>
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
              <div className="space-y-2">
                <Label htmlFor="rent" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Rent</Label>
                <Input 
                  id="rent" 
                  name="rent" 
                  type="number" 
                  placeholder="8000" 
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="h-12 rounded-xl bg-gray-50 border-none" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advance</Label>
                <Input id="advance" name="advance" type="number" placeholder="16000" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadhar_number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aadhar Number</Label>
                <Input id="aadhar_number" name="aadhar_number" placeholder="XXXX XXXX XXXX" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="join_date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Join Date</Label>
                <Input id="join_date" name="join_date" type="date" className="h-12 rounded-xl bg-gray-50 border-none" defaultValue={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent_due_date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rent Due Date (Day of Month)</Label>
                <Input id="rent_due_date" name="rent_due_date" type="number" min="1" max="31" defaultValue="5" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg mt-4 shadow-lg">
                Add Tenant
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 rounded-xl bg-gray-50 border-none"
              />
            </div>
            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-xl">
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List - Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Tenant Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 p-4 items-center">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Tenant</th>
                      <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Property</th>
                      <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500 text-center">Room/Bed</th>
                      <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Rent</th>
                      <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Due Date</th>
                      <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Status</th>
                      <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-3">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{tenant.name}</p>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                              <Phone className="w-2.5 h-2.5" />
                              {tenant.phone}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                              <Mail className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[120px]">{tenant.email}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-xs font-semibold text-gray-600">{tenant.property_name}</td>
                      <td className="py-4 px-3 text-center">
                        <Badge variant="outline" className="bg-white font-bold text-[10px] px-2 py-0">
                          {tenant.room_number}-{tenant.bed_number}
                        </Badge>
                      </td>
                      <td className="py-4 px-3 font-black text-sm">
                        ₹{tenant.rent_amount?.toLocaleString("en-IN") || "0"}
                      </td>
                      <td className="py-4 px-3 text-[11px] font-bold text-gray-600">
                        {tenant.rent_due_date ? new Date(tenant.rent_due_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        }) : "N/A"}
                      </td>
                      <td className="py-4 px-3">{getStatusBadge(tenant.rent_status)}</td>
                      <td className="py-4 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedProfileTenant(tenant);
                              setIsProfileDialogOpen(true);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingTenant(tenant);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteTenant(tenant.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants List - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{tenant.name}</p>
                    <p className="text-sm text-gray-600">{tenant.property_name}</p>
                  </div>
                  {getStatusBadge(tenant.rent_status)}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {tenant.phone}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-600">Room/Bed</p>
                    <Badge variant="outline">
                      {tenant.room_number}-{tenant.bed_number}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Rent</p>
                    <p className="font-semibold">₹{tenant.rent_amount?.toLocaleString("en-IN") || "0"}</p>
                  </div>
                </div>

                {tenant.rent_status === "overdue" && tenant.rent_due_date && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    Rent overdue since {new Date(tenant.rent_due_date).toLocaleDateString("en-IN")}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    Send Reminder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Tenant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Tenant Details</DialogTitle>
          </DialogHeader>
          {editingTenant && (
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input name="name" defaultValue={editingTenant.name} className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                <Input name="phone" defaultValue={editingTenant.phone} className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email (Login Username)</Label>
                <Input name="email" type="email" defaultValue={editingTenant.email} className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Change Password <span className="text-gray-400 normal-case font-normal">(leave blank to keep current)</span></Label>
                <Input name="password" type="password" placeholder="Enter new password" className="h-12 rounded-xl bg-gray-50 border-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Rent</Label>
                  <Input name="rent" type="number" defaultValue={editingTenant.rent_amount} className="h-12 rounded-xl bg-gray-50 border-none" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advance</Label>
                  <Input name="advance" type="number" defaultValue={editingTenant.advance} className="h-12 rounded-xl bg-gray-50 border-none" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aadhar Number</Label>
                <Input name="aadhar_number" defaultValue={editingTenant.aadhar_number} className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rent Status</Label>
                <Select name="rent_status" defaultValue={editingTenant.rent_status}>
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="due">Due</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 rounded-xl font-bold shadow-lg"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Tenant Invoice/Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.5rem] p-0 border-none shadow-2xl bg-gray-50/50">
          <DialogTitle className="sr-only">Tenant Profile</DialogTitle>
          {selectedProfileTenant && (
            <div className="flex flex-col">
              {/* Receipt Paper Area */}
              <div id="receipt-content" className="m-6 p-10 bg-white shadow-2xl border border-gray-100 rounded-[2rem] relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[5rem] -mr-10 -mt-10" />
                
                {/* Header with Logo/Title */}
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <span className="font-black text-lg italic">PG</span>
                      </div>
                      <div>
                        <h1 className="text-2xl font-black tracking-tight leading-none mb-1">{selectedProfileTenant.property_name.toUpperCase()}</h1>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Management Hub</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-4xl font-black text-indigo-600 tracking-tighter leading-none mb-2">INVOICE</h2>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 py-1 bg-gray-100 rounded-md">
                        #REC-{Date.now().toString().slice(-6)}
                      </span>
                      <span className="text-xs font-bold text-gray-500">Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Billing Grid */}
                <div className="grid grid-cols-2 gap-16 mb-12 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Bill From</p>
                      <h3 className="text-lg font-black leading-none mb-1">{selectedProfileTenant.property_name}</h3>
                      <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest italic">Authorized PG Management</p>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        Registered Property Office<br />
                        PG Hub, India
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Bill To (Tenant)</p>
                      <h3 className="text-lg font-black leading-none mb-1">{selectedProfileTenant.name}</h3>
                      <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest italic">Resident Identity</p>
                      <div className="text-xs text-muted-foreground font-medium leading-relaxed">
                        <p>{selectedProfileTenant.phone}</p>
                        <p>{selectedProfileTenant.email}</p>
                        <p className="mt-2 font-mono text-[10px] bg-gray-50 inline-block px-2 py-1 rounded-md">ID: {selectedProfileTenant.aadhar_number}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Detail Strip */}
                <div className="bg-gray-50/80 rounded-2xl p-4 mb-10 flex justify-between items-center border border-gray-100">
                    <div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Property Unit</span>
                        <div className="font-bold text-sm">Room {selectedProfileTenant.room_number} • Floor {selectedProfileTenant.floor || 'G'}</div>
                    </div>
                    <div className="text-center border-x border-gray-200 px-8">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Bed Assignment</span>
                        <div className="font-bold text-sm">Bed #{selectedProfileTenant.bed_number}</div>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Billing Status</span>
                        <div className="text-emerald-600 font-black text-sm uppercase tracking-widest">SUCCESSFUL</div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-indigo-600">
                        <th className="py-4 text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">Description of Services</th>
                        <th className="py-4 text-right text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-6">
                          <div className="font-bold text-gray-800">Monthly Accommodation Fee</div>
                          <div className="text-xs text-muted-foreground mt-1">Rent for the month of {new Date().toLocaleDateString('en-IN', { month: 'long' })}</div>
                        </td>
                        <td className="py-6 text-right font-black text-lg">₹{selectedProfileTenant.rent_amount.toLocaleString('en-IN')}</td>
                      </tr>
                      {selectedProfileTenant.advance > 0 && (
                        <tr>
                          <td className="py-6">
                            <div className="font-bold text-gray-800">Security Deposit / Advance</div>
                            <div className="text-xs text-muted-foreground mt-1">One-time refundable security commitment</div>
                          </td>
                          <td className="py-6 text-right font-black text-lg">₹{selectedProfileTenant.advance.toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 bg-indigo-600 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
                        <div className="flex justify-between items-center mb-4 opacity-80">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Total Received</span>
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <div className="text-3xl font-black tracking-tighter">₹{(selectedProfileTenant.rent_amount + selectedProfileTenant.advance).toLocaleString('en-IN')}</div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60 italic text-center">Fully Paid & Verified</div>
                        </div>
                    </div>
                </div>

                {/* Footer and Signatures */}
                <div className="flex justify-between items-end">
                  <div className="max-w-[280px]">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      Digitally Verified Receipt
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      This document is a computer-generated invoice and does not require a physical signature for validity. It serves as proof of payment for the specified period.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b-2 border-gray-100 mb-2 italic text-gray-300 font-bold text-xl">Verified</div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Authorized Hub Signatory</p>
                  </div>
                </div>

                {/* Paid Watermark (Subtle) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-25deg] pointer-events-none select-none">
                    <span className="text-[12rem] font-black tracking-tighter">PAID</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-8 pt-0 flex gap-3">
                <Button className="flex-1 rounded-2xl h-14 font-bold bg-indigo-600 shadow-xl shadow-indigo-100 dark:shadow-none" onClick={() => setIsProfileDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-2xl h-14 px-8 font-bold border-gray-200 hover:bg-gray-50 transition-colors group"
                  onClick={() => handleDownloadInvoice(selectedProfileTenant)}
                >
                  <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="rounded-2xl h-14 w-14 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100"
                  onClick={() => handleDeleteTenant(selectedProfileTenant.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
