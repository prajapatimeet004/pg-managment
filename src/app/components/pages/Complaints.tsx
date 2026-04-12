import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  MessageSquareWarning,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Wrench,
  User,
  Building,
  ChevronRight,
  Zap,
  Phone,
  Bot
} from "lucide-react";
import { type Complaint } from "../../lib/mockData";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../ui/utils";
import { api } from "../../lib/api";

export function Complaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complaintsData, tenantsData, propertiesData] = await Promise.all([
          api.getComplaints(),
          api.getTenants(),
          api.getProperties()
        ]);
        setComplaints(complaintsData);
        setTenants(tenantsData);
        setProperties(propertiesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center font-bold">Loading complaints...</div>;

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesStatus = filterStatus === "all" || complaint.status === filterStatus;
    const matchesPriority = filterPriority === "all" || complaint.priority === filterPriority;
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.tenant_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const openCount = complaints.filter((c) => c.status === "open").length;
  const inProgressCount = complaints.filter((c) => c.status === "in-progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-rose-500 hover:bg-rose-600 rounded-full px-3 py-1 font-bold border-none shadow-sm">NEW ISSUE</Badge>;
      case "in-progress":
        return <Badge className="bg-amber-500 hover:bg-amber-600 rounded-full px-3 py-1 font-bold border-none shadow-sm">WORKING</Badge>;
      case "resolved":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-full px-3 py-1 font-bold border-none shadow-sm">RESOLVED</Badge>;
      default:
        return <Badge variant="outline" className="rounded-full px-3 py-1 uppercase">{status}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <Zap className="w-4 h-4 text-rose-600 animate-pulse" />;
      case "medium":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleUpdateStatus = (complaintId: string, newStatus: string) => {
    setComplaints(
      complaints.map((c) =>
        c.id === complaintId
          ? {
            ...c,
            status: newStatus,
            resolvedAt: newStatus === "resolved" ? new Date().toISOString() : c.resolvedAt,
          }
          : c
      )
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 px-3 py-1 rounded-full border-rose-200 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/10 font-bold uppercase tracking-widest text-[10px]">
            Maintenance Console
          </Badge>
          <h1 className="text-4xl font-black tracking-tight mb-2">Service Tickets</h1>
          <p className="text-muted-foreground max-w-lg font-medium">
            Monitor and resolve tenant service requests. High priority items are flagged for immediate action.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-2xl h-14 px-8 font-bold bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100 dark:shadow-none transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Log New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black">Open Service Ticket</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const tenantId = parseInt(formData.get("tenant_id") as string);
                const tenant = tenants.find(t => t.id === tenantId);
                
                const complaintData = {
                  title: formData.get("title") as string,
                  description: formData.get("description") as string,
                  status: "open",
                  priority: formData.get("priority") as string,
                  category: formData.get("category") as string,
                  tenant_id: tenantId,
                  tenant_name: tenant?.name || "Unknown",
                  property_id: tenant?.property_id || 0,
                  property_name: tenant?.property_name || "Unknown",
                  createdAt: new Date().toISOString()
                };

                try {
                  const newComplaint = await api.createComplaint(complaintData);
                  setComplaints(prev => [newComplaint, ...prev]);
                  setIsAddDialogOpen(false);
                } catch (error) {
                  console.error("Failed to create complaint:", error);
                }
              }}
            >
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Affected Tenant</Label>
                <Select name="tenant_id" required>
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                    <SelectValue placeholder="Identify the resident" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    {tenants.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name} (Room {t.room_number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                      <SelectValue placeholder="System" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="HVAC">HVAC/AC</SelectItem>
                      <SelectItem value="WiFi">Connectivity</SelectItem>
                      <SelectItem value="Cleaning">Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Urgency</Label>
                  <Select name="priority" required>
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="high">Critical</SelectItem>
                      <SelectItem value="medium">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Ticket Title</Label>
                <Input name="title" placeholder="Short summary..." className="h-12 rounded-xl bg-gray-50 border-none focus-visible:ring-rose-500/30" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Context & Details</Label>
                <Textarea name="description" placeholder="Explain the situation..." className="rounded-xl bg-gray-50 border-none focus-visible:ring-rose-500/30 min-h-[100px]" required />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-2xl h-14 font-black bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100 mt-4">
                Log Ticket to System
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ticket Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "New / Open", count: openCount, color: "rose", icon: AlertCircle },
          { label: "Ongoing Repair", count: inProgressCount, color: "amber", icon: Clock },
          { label: "Finalized", count: resolvedCount, color: "emerald", icon: CheckCircle },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${item.color}-500`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
                  <p className={`text-3xl font-black text-${item.color}-600 dark:text-${item.color}-400`}>{item.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/20 flex items-center justify-center text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-rose-600 transition-colors" />
          <Input
            placeholder="Search tickets by tenant, property or issue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus-visible:ring-2 ring-rose-500/20 text-base font-medium"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-14 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm font-bold pl-4">
              <Filter className="w-4 h-4 mr-2 inline text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[160px] h-14 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm font-bold pl-4">
              <Zap className="w-4 h-4 mr-2 inline text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl">
              <SelectItem value="all">Any Urgency</SelectItem>
              <SelectItem value="high">Critical</SelectItem>
              <SelectItem value="medium">Normal</SelectItem>
              <SelectItem value="low">Minor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Feed */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredComplaints.map((complaint, idx) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-white dark:bg-gray-950">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Left Priority Indicator */}
                    <div className={cn(
                      "w-full md:w-24 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r dark:border-gray-800",
                      complaint.priority === "high" ? "bg-rose-50/50 dark:bg-rose-900/10" : "bg-gray-50/50 dark:bg-gray-800/20"
                    )}>
                      {getPriorityIcon(complaint.priority)}
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest mt-2",
                        complaint.priority === "high" ? "text-rose-600" : "text-muted-foreground"
                      )}>{complaint.priority}</p>
                    </div>

                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-black tracking-tight leading-tight group-hover:text-rose-600 transition-colors">{complaint.title}</h3>
                          {getStatusBadge(complaint.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{complaint.tenant_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Building className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{complaint.property_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Wrench className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2 py-0.5 border rounded-full">{complaint.category}</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground font-medium line-clamp-2 max-w-3xl">
                        {complaint.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {complaint.status === "open" && (
                        <Button
                          className="w-full rounded-xl h-11 font-bold bg-indigo-600 shadow-md shadow-indigo-100"
                          onClick={() => handleUpdateStatus(complaint.id, "in-progress")}
                        >
                          Assign Task
                        </Button>
                      )}
                      {complaint.status === "in-progress" && (
                        <Button
                          className="w-full rounded-xl h-11 font-bold bg-emerald-600 shadow-md shadow-emerald-100"
                          onClick={() => handleUpdateStatus(complaint.id, "resolved")}
                        >
                          Mark Fixed
                        </Button>
                      )}
                      <div className="flex gap-1.5">
                        <Button variant="outline" className="flex-1 rounded-xl h-11 border-gray-100 hover:bg-gray-50">
                          <Phone className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-xl h-11 border-gray-100 hover:bg-gray-50 font-bold text-xs">
                          View
                        </Button>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
      </AnimatePresence>

      {filteredComplaints.length === 0 && (
        <div className="py-24 text-center bg-gray-50/50 dark:bg-gray-900/20 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle className="w-10 h-10 text-emerald-500 opacity-20" />
          </div>
          <h3 className="text-xl font-bold mb-2">Clean Slate</h3>
          <p className="text-muted-foreground font-medium max-w-xs mx-auto">No tickets found matching your criteria. Everything seems to be in order!</p>
        </div>
      )}
    </div>

      {/* AI Troubleshooting Hub (Footer Insight) */ }
  <Card className="bg-white dark:bg-gray-950 border-none shadow-xl rounded-[2.5rem] overflow-hidden p-1 flex flex-col md:flex-row">
    <div className="md:w-1/3 bg-indigo-600 p-8 text-white flex flex-col justify-center">
      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
        <Bot className="w-7 h-7" />
      </div>
      <h3 className="text-2xl font-black mb-2">Predictive Maintenance</h3>
      <p className="text-indigo-100 text-sm font-medium leading-relaxed">
        I've identified that electrical issues are clustering at Royal PG. My analysis suggests a transformer check before the monsoon season begins.
      </p>
    </div>
    <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>Resolution Rate</span>
          <span className="text-indigo-600">92%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: "92%" }} className="h-full bg-indigo-600" />
        </div>
        <p className="text-[10px] text-muted-foreground font-bold leading-tight uppercase tracking-tight">Avg Time: 18.4 Hours per Ticket</p>
      </div>
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Top recurring issues</h4>
        <div className="flex flex-wrap gap-2">
          {['AC Cooling', 'WiFi Speed', 'Water Leak', 'Broken Switch'].map(tag => (
            <Badge key={tag} variant="outline" className="rounded-full bg-gray-50 border-gray-200 text-gray-700 font-bold">{tag}</Badge>
          ))}
        </div>
      </div>
    </div>
  </Card>
    </div>
  );
}
