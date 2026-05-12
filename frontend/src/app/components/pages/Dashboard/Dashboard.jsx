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



  const fetchData = useCallback(async () => {
    try {
      const [statsData, propertiesData, complaintsData] = await Promise.all([
        api.getStats(),
        api.getProperties(),
        api.getComplaints()
      ]);
      setStats(statsData);
      setProperties(propertiesData);
      setComplaints(complaintsData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  useDataRefresh(["properties", "tenants", "complaints", "notices", "rent"], fetchData);

  // Helper for metrics
  const displayStats = stats || {
    total_properties: 0,
    total_tenants: 0,
    occupancy_rate: 0,
    monthly_revenue: 0,
    overdue_rents: 0,
    open_complaints: 0
  };

  const {
    total_properties,
    total_tenants,
    occupancy_rate,
    monthly_revenue,
    overdue_rents,
    due_rents,
    open_complaints
  } = displayStats;

  const activeComplaints = complaints
    .filter((c) => c.status === "open" || c.status === "in-progress")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
            Owner Dashboard
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground">
            Welcome back, {localStorage.getItem("ownerName") || "Admin"}! Your PG portfolio is performing well.
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
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
        {/* Rent Collection Status */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
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

        {/* Recent Complaints */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
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
                        <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
          {properties.map((property) => (
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
        ))}
        </div>
      </motion.div>
      <SmartRecommendations />
    </motion.div>

  );
}
