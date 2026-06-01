import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Building2,
  Users,
  Bed,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  MessageSquare,
  Bell,
  ArrowUpRight,
  Sparkles,
  Receipt,
  History,
} from "lucide-react";
import { mockProperties, mockTenants, mockComplaints } from "../../../lib/mockData";
import { Link } from "react-router";
import { motion } from "motion/react";
import { api } from "../../../lib/api";
import { useState, useEffect, useCallback } from "react";
import { useDataRefresh } from "../../../lib/dataEvents";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "../../ui/skeleton";
import { SmartRecommendations } from "./SmartRecommendations";


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const revenueData = [
  { name: "Mon", total: 4000 },
  { name: "Tue", total: 3000 },
  { name: "Wed", total: 2000 },
  { name: "Thu", total: 2780 },
  { name: "Fri", total: 1890 },
  { name: "Sat", total: 2390 },
  { name: "Sun", total: 3490 },
];

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [notices, setNotices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const userRole = localStorage.getItem("userRole") || "Owner";
  const userPropertyIds = localStorage.getItem("propertyIds") || "";
  const assignedPropertyNames = localStorage.getItem("propertyNames") || "";


  const fetchData = useCallback(async () => {
    const ownerId = localStorage.getItem("ownerId");
    console.log("Dashboard: Fetching data for Owner ID:", ownerId);
    try {
      const [statsData, propertiesData, complaintsData, staffData, noticesData, transactionsData] = await Promise.all([
        api.getStats(),
        api.getProperties(),
        api.getComplaints(),
        api.getStaff(),
        api.getNotices(),
        api.getRentTransactions()
      ]);
      console.log("Dashboard: Data loaded successfully", { statsData, propsCount: propertiesData?.length });
      setStats(statsData || { total_properties: 0, total_tenants: 0, occupancy_rate: 0, monthly_revenue: 0 });
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setNotices(Array.isArray(noticesData) ? noticesData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      console.error("Dashboard: Fetch error:", error);
      // Set empty states on error to prevent UI hang
      setProperties([]);
      setComplaints([]);
      setStaff([]);
      setNotices([]);
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  useDataRefresh(["properties", "tenants", "complaints", "notices", "rent", "staff"], fetchData);

  // Helper for metrics
  const displayStats = stats || {
    total_properties: 0,
    total_tenants: 0,
    occupancy_rate: 0,
    monthly_revenue: 0,
    overdue_rents: 0,
    open_complaints: 0,
    total_staff: 0
  };

  const {
    total_properties = 0,
    total_tenants = 0,
    occupancy_rate = 0,
    monthly_revenue = 0,
    overdue_rents = 0,
    due_rents = 0,
    open_complaints = 0,
    total_staff = 0
  } = displayStats || {};

  const activeComplaints = Array.isArray(complaints) 
    ? complaints.filter((c) => c.status === "open" || c.status === "in-progress").sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  const topStaff = Array.isArray(staff) ? staff.slice(0, 4) : [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-400"
          >
            Dashboard
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground flex items-center gap-2">
            Welcome back, {localStorage.getItem("ownerName") || "Admin"}! 
            {userRole !== "Owner" && userPropertyIds && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-100 dark:border-indigo-800">
                <Building2 className="w-3 h-3" />
                Managing: {assignedPropertyNames || "Assigned PGs"}
              </span>
            )}
          </motion.p>
        </div>
      </div>


      {/* Quick Actions Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Add Tenant", color: "bg-blue-50 text-blue-600", to: "/tenants" },
          { icon: IndianRupee, label: "Record Rent", color: "bg-green-50 text-green-600", to: "/rent" },
          { icon: Building2, label: "Add Property", color: "bg-orange-50 text-orange-600", to: "/properties" },
          { icon: Bell, label: "Broadcast", color: "bg-purple-50 text-purple-600", to: "/notices" },
        ].map((action, i) => (
          <Link key={i} to={action.to}>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-card border rounded-xl hover:shadow-md transition-all cursor-pointer group">
              <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </div>
          </Link>
        ))}
      </motion.div>




      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: total_properties, icon: Building2, color: "blue", trend: "+2 this year", to: "/properties" },
          { label: "Total Tenants", value: total_tenants, icon: Users, color: "green", trend: "98% satisfaction", to: "/tenants" },
          { label: "Occupancy Rate", value: `${occupancy_rate}%`, icon: Bed, color: "purple", trend: "Based on active beds" },
          { label: "Monthly Revenue", value: `₹${(monthly_revenue / 1000).toFixed(0)}K`, icon: IndianRupee, color: "orange", trend: "↑ 5.2% vs last month" },
        ].map((metric, i) => (

          <motion.div key={i} variants={itemVariants}>
            <Link to={metric.to || "#"} className={!metric.to ? "pointer-events-none" : ""}>
              <Card className="overflow-hidden hover:shadow-lg transition-all border-none shadow-sm bg-white dark:bg-card group">
                <CardContent className="p-5">
                  {!stats ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl bg-${metric.color}-50 dark:bg-${metric.color}-900/20 text-${metric.color}-600 group-hover:scale-110 transition-transform`}>
                          <metric.icon className="w-5 h-5" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground transition-opacity" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center">
                          {metric.trend}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>

        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 1/3 Width stack */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          {/* Rent Collection Status */}
          <motion.div variants={itemVariants}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow border-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Rent Status</CardTitle>
                  <Link to="/rent">
                    <Button variant="ghost" size="sm" className="text-xs h-8">Full Report</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="group relative overflow-hidden p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-bold text-red-900 dark:text-red-400">Overdue</p>
                          <p className="text-xs text-red-700/70 dark:text-red-400/60">{overdue_rents} pending payments</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="rounded-full px-3">{overdue_rents}</Badge>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-amber-900 dark:text-amber-400">Due Soon</p>
                          <p className="text-xs text-amber-700/70 dark:text-amber-400/60">{due_rents} upcoming payments</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500 rounded-full px-3">{due_rents}</Badge>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900 dark:text-emerald-400">Paid</p>
                          <p className="text-xs text-emerald-700/70 dark:text-emerald-400/60">{total_tenants - overdue_rents} completed</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 rounded-full px-3">{total_tenants - overdue_rents}</Badge>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-2 rounded-xl h-11 font-semibold shadow-sm" variant="outline">
                  Automate Reminders
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions / Income */}
          <motion.div variants={itemVariants} className="flex-1 flex flex-col">
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow border-none overflow-hidden flex flex-col">
              <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-500" />
                    Recent Income
                  </CardTitle>
                  <Link to="/rent">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <History className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <div>
                        <p className="text-sm font-bold">{tx.tenant_name}</p>
                        <p className="text-[10px] text-muted-foreground">{tx.month}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">₹{tx.amount}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{tx.payment_mode}</p>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-xs">No recent payments.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>


        </div>

        {/* Right Column - 2/3 Width stack */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          {/* Priority Complaints */}
          <motion.div variants={itemVariants}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow border-none overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Priority Complaints</CardTitle>
                  <Link to="/complaints">
                    <Button variant="ghost" size="sm" className="text-xs h-8">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!stats ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 border dark:border-gray-800 rounded-2xl">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {activeComplaints.slice(0, 3).map((complaint) => (
                        <div key={complaint.id} className="group flex items-center gap-4 p-4 border dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${complaint.priority === "high"
                                ? "bg-red-100 text-red-600"
                                : complaint.priority === "medium"
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                          >
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold truncate">{complaint.title}</p>
                              <Badge
                                variant={complaint.status === "open" ? "destructive" : "secondary"}
                                className="text-[10px] uppercase font-bold px-2"
                              >
                                {complaint.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {complaint.tenant_name}</span>
                              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {complaint.category}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-full transition-opacity">
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {activeComplaints.length > 3 && (
                        <p className="text-center text-xs text-muted-foreground font-bold mt-4 pt-4 border-t border-dashed dark:border-gray-800">
                          + {activeComplaints.length - 3} more critical activities
                        </p>
                      )}
                      {activeComplaints.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <CheckCircle className="w-12 h-12 mb-3 text-emerald-500 opacity-50" />
                          <p>All complaints resolved!</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* Community Notices */}
            <motion.div variants={itemVariants} className="flex-1 flex flex-col">
              <Card className="h-full shadow-sm hover:shadow-md transition-shadow border-none flex flex-col">
                <CardHeader className="pb-3 border-b border-gray-50 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Bell className="w-5 h-5 text-amber-500" />
                      Live Notices
                    </CardTitle>
                    <Link to="/notices">
                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-lg border-gray-100">
                        Broadcast New
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="grid grid-cols-1 gap-4">
                    {notices.slice(0, 3).map((notice) => (
                      <div key={notice.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-white dark:border-gray-800 shadow-sm relative overflow-hidden group">
                        {notice.urgent && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-bold truncate pr-4">{notice.title}</h4>
                          {notice.urgent && <Badge className="bg-red-500 text-[8px] h-4">URGENT</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                          {notice.content}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-[9px] text-muted-foreground font-semibold uppercase">{notice.property_name}</p>
                          <p className="text-[9px] text-muted-foreground">{new Date(notice.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                    {notices.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        <p className="text-xs">No active notices.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Staff Team Overview */}
            <motion.div variants={itemVariants} className="flex-1 flex flex-col">
              <Card className="h-full shadow-sm hover:shadow-md transition-shadow border-none flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Staff Team</CardTitle>
                    <Link to="/staff">
                      <Button variant="ghost" size="sm" className="text-xs h-8">View Hub</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  {!stats ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-2 w-24" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      {topStaff.length > 0 ? (
                        topStaff.map((s) => (
                          <div key={s.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                                {s.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-sm font-bold">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase">{s.role}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={s.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100 text-[8px]' : 'bg-amber-50 text-amber-700 border-amber-100 text-[8px]'}>
                              {s.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold">No staff registered yet.</p>
                        </div>
                      )}
                      
                      {total_staff > 4 && (
                        <Link to="/staff" className="block">
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              See all {total_staff} personnel
                            </p>
                          </div>
                        </Link>
                      )}
                    </div>
                  )}
                  
                  <Link to="/staff" className="block mt-auto pt-2">
                    <Button className="w-full rounded-xl h-11 font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none">
                      Add Team Member
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Properties Carousel-like Overview */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Portfolio Overview</h2>
          <Link to="/properties">
            <Button variant="link" className="text-blue-600 font-bold p-0">Manage All Properties</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {properties.length > 0 ? (
            properties.map((property) => (
              <Link key={property.id} to={`/properties/${property.id}`} className="group h-full">
                <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <Badge variant="outline" className="bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                        {Math.round((property.occupied_beds / property.total_beds) * 100)}% Full
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold group-hover:text-indigo-600 transition-colors">{property.name}</h4>
                      <p className="text-xs text-muted-foreground mb-4">{property.manager}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/50 dark:bg-black/10 p-3 rounded-2xl">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Rooms</p>
                        <p className="text-lg font-bold">{property.total_rooms}</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/10 p-3 rounded-2xl">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Revenue</p>
                        <p className="text-lg font-bold">₹{(property.monthly_revenue / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Occupancy</span>
                        <span className="font-bold">{property.occupied_beds}/{property.total_beds} beds</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(property.occupied_beds / property.total_beds) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-indigo-600 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-3 py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-sm font-bold text-muted-foreground">No properties assigned or found.</p>
            <Link to="/properties">
              <Button variant="link" className="text-indigo-600 font-bold mt-2">Add your first property</Button>
            </Link>
          </div>
        )}
        </div>
      </motion.div>
      <SmartRecommendations />
    </motion.div>

  );
}
