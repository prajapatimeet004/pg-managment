import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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
import { mockProperties, mockTenants, mockComplaints } from "../../lib/mockData";
import { Link } from "react-router";
import { motion } from "motion/react";
import { api } from "../../lib/api";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  const [stats, setStats] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [properties, setProperties] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, propertiesData, complaintsData, insightData] = await Promise.all([
          api.getStats(),
          api.getProperties(),
          api.getComplaints(),
          api.getAIInsight()
        ]);
        setStats(statsData);
        setProperties(propertiesData);
        setComplaints(complaintsData);
        setAiInsight(insightData.insight);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  if (!stats) {
    return <div className="flex items-center justify-center h-full">Loading Dashboard...</div>;
  }

  const {
    total_properties,
    total_tenants,
    occupancy_rate,
    monthly_revenue,
    overdue_rents,
    open_complaints
  } = stats;

  const activeComplaints = complaints.filter((c) => c.status === "open" || c.status === "in-progress");

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
            Welcome back, admin! Your PG portfolio is performing well.
          </motion.p>
        </div>
        <motion.div variants={itemVariants} className="flex gap-2">
          <Button className="rounded-full shadow-lg hover:shadow-xl transition-all">
            <Plus className="w-4 h-4 mr-2" /> Add Property
          </Button>
          <Button variant="outline" size="icon" className="rounded-full relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Button>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Add Tenant", color: "bg-blue-50 text-blue-600", to: "/tenants" },
          { icon: IndianRupee, label: "Record Rent", color: "bg-green-50 text-green-600", to: "/rent" },
          { icon: AlertCircle, label: "New Complaint", color: "bg-orange-50 text-orange-600", to: "/complaints" },
          { icon: MessageSquare, label: "Broadcast", color: "bg-purple-50 text-purple-600", to: "/notices" },
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

      {/* AI Insights Card */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white border-0 shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Insight Engine</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Occupancy & Revenue Optimization</h3>
                <p className="text-blue-50/90 text-sm mb-4 max-w-2xl whitespace-pre-wrap">
                  {aiInsight || "Analyzing your property data for optimized performance..."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/ai-assistant">
                    <Button variant="secondary" className="font-semibold shadow-md">
                      View Recommendations
                    </Button>
                  </Link>
                  <Button variant="ghost" className="text-white hover:bg-white/10 border border-white/20">
                    Dismiss
                  </Button>
                </div>
              </div>
              <div className="hidden md:block w-48 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="total" stroke="#ffffff" fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: total_properties, icon: Building2, color: "blue", trend: "+2 this year" },
          { label: "Total Tenants", value: total_tenants, icon: Users, color: "green", trend: "98% satisfaction" },
          { label: "Occupancy Rate", value: `${occupancy_rate}%`, icon: Bed, color: "purple", trend: "Based on active beds" },
          { label: "Monthly Revenue", value: `₹${(monthly_revenue / 1000).toFixed(0)}K`, icon: IndianRupee, color: "orange", trend: "↑ 5.2% vs last month" },
        ].map((metric, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="overflow-hidden hover:shadow-lg transition-all border-none shadow-sm bg-white dark:bg-card group">
              <CardContent className="p-5">
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
              </CardContent>
            </Card>
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
                        <p className="text-xs text-amber-700/70 dark:text-amber-400/60">Upcoming this week</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500 rounded-full px-3">-</Badge>
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
                {activeComplaints.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mb-3 text-emerald-500 opacity-50" />
                    <p>All complaints resolved!</p>
                  </div>
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
            <Card key={property.id} className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl">
              <CardContent className="p-0">
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
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
