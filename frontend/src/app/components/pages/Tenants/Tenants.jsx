import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Phone, Mail, Search, Plus, FileText, AlertCircle } from "lucide-react";
import { api } from "../../../lib/api";
import { useDataRefresh, notifyDataUpdated } from "../../../lib/dataEvents";

export function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
  useDataRefresh(["tenants", "properties"], fetchData);


  if (loading) return <div className="p-8 text-center font-bold">Loading tenants...</div>;

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
                
                const tenantData = {
                  name: formData.get("name"),
                  phone: formData.get("phone"),
                  email: formData.get("email"),
                  property_id: propertyId,
                  property_name: "", // Will be filled by backend but good to initialize
                  room_number: formData.get("room"),
                  bed_number: formData.get("bed"),
                  rent_amount: parseInt(formData.get("rent")),
                  advance: parseInt(formData.get("advance")),
                  rent_due_date: new Date().toISOString().split('T')[0], // Default to today
                  rent_status: "paid",
                  join_date: new Date().toISOString().split('T')[0],
                  aadhar_number: "0000 0000 0000"
                };

                try {
                  const newTenant = await api.createTenant(tenantData);
                  setTenants(prev => [...prev, newTenant]);
                  setIsAddDialogOpen(false);
                  notifyDataUpdated("tenants");
                } catch (error) {
                  console.error("Failed to add tenant:", error);
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
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input id="email" name="email" type="email" placeholder="tenant@email.com" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Property</Label>
                <Select name="property_id" required>
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
                  <Input id="room" name="room" placeholder="101" className="h-12 rounded-xl bg-gray-50 border-none" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bed" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bed</Label>
                  <Input id="bed" name="bed" placeholder="A" className="h-12 rounded-xl bg-gray-50 border-none" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Rent</Label>
                <Input id="rent" name="rent" type="number" placeholder="8000" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advance</Label>
                <Input id="advance" name="advance" type="number" placeholder="16000" className="h-12 rounded-xl bg-gray-50 border-none" required />
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
            <CardTitle>All Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Tenant</th>
                    <th className="text-left py-3 px-4 font-medium">Property</th>
                    <th className="text-left py-3 px-4 font-medium">Room/Bed</th>
                    <th className="text-left py-3 px-4 font-medium">Rent</th>
                    <th className="text-left py-3 px-4 font-medium">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {tenant.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {tenant.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">{tenant.property_name}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">
                          {tenant.room_number}-{tenant.bed_number}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 font-medium">
                        ₹{tenant.rent_amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {new Date(tenant.rent_due_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(tenant.rent_status)}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <p className="font-semibold">₹{tenant.rent_amount.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {tenant.rent_status === "overdue" && (
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
    </div>
  );
}
