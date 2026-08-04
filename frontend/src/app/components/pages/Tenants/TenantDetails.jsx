import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import {
  ArrowLeft,
  Building2,
  Bed,
  IndianRupee,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Hash,
  User,
  Receipt,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../lib/api";
import { Skeleton } from "../../ui/skeleton";
import { useDataRefresh } from "../../../lib/dataEvents";

export function TenantDetails() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tenantData, dashboardData] = await Promise.all([
        api.getTenant(id).catch(() => null),
        api.getTenantDashboard(id).catch(() => null),
      ]);
      setTenant(tenantData || dashboardData?.tenant);
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Failed to fetch tenant details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useDataRefresh(["tenants", "properties", "rent", "complaints"], fetchData);

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

  const getInitials = (name) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "TN";
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-medium">Tenant not found</p>
        <Link to="/tenants">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Tenants</Button>
        </Link>
      </div>
    );
  }

  const data = dashboard;
  const property = data?.property || {};
  const transactions = data?.transactions || [];
  const complaints = data?.complaints || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/tenants">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Avatar className="w-14 h-14 rounded-2xl shadow-md">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-bold rounded-2xl">
              {getInitials(tenant.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              {tenant.property_name} &middot; Room {tenant.room_number}-{tenant.bed_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(tenant.rent_status)}
        </div>
      </div>

      {/* Key Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <IndianRupee className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Rent</span>
            </div>
            <p className="text-2xl font-black">₹{tenant.rent_amount?.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">Due on {tenant.rent_due_date}th of month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advance</span>
            </div>
            <p className="text-2xl font-black">₹{tenant.advance?.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">Refundable deposit</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Joined</span>
            </div>
            <p className="text-2xl font-black">{tenant.join_date ? new Date(tenant.join_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}</p>
            <p className="text-xs text-muted-foreground mt-1">Member since</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Hash className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aadhar</span>
            </div>
            <p className="text-2xl font-black font-mono text-sm">{tenant.aadhar_number || "N/A"}</p>
            <p className="text-xs text-muted-foreground mt-1">Identity verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2" />Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:shadow-sm">
            <Receipt className="w-4 h-4 mr-2" />Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="complaints" className="rounded-lg data-[state=active]:shadow-sm">
            <MessageSquare className="w-4 h-4 mr-2" />Complaints ({complaints.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Personal Details */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4" />Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Phone</p>
                    <p className="font-semibold">{tenant.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Email</p>
                    <p className="font-semibold">{tenant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Aadhar Number</p>
                    <p className="font-semibold font-mono">{tenant.aadhar_number || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Join Date</p>
                    <p className="font-semibold">{tenant.join_date ? new Date(tenant.join_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property & Room Details */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />Property & Room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Property</p>
                    <p className="font-semibold">{tenant.property_name}</p>
                  </div>
                </div>
                {property?.address && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Address</p>
                      <p className="font-semibold">{property.address}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Bed className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Room / Bed</p>
                    <p className="font-semibold">Room {tenant.room_number} &middot; Bed {tenant.bed_number} {tenant.floor ? `&middot; Floor ${tenant.floor}` : ""}</p>
                  </div>
                </div>
                {property?.manager && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Manager</p>
                      <p className="font-semibold">{property.manager} ({property.phone || "N/A"})</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rent Summary */}
            <Card className="border-none shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />Rent Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Rent Amount</p>
                    <p className="text-xl font-black">₹{tenant.rent_amount?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Advance</p>
                    <p className="text-xl font-black">₹{tenant.advance?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Due Date</p>
                    <p className="text-xl font-black">{tenant.rent_due_date}th</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
                    <div className="flex justify-center">{getStatusBadge(tenant.rent_status)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Rent Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Receipt</th>
                        <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Month</th>
                        <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Amount</th>
                        <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Paid Date</th>
                        <th className="text-left py-3 px-3 font-bold text-xs uppercase tracking-wider text-gray-500">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3 font-mono text-xs font-bold">{tx.receipt_number}</td>
                          <td className="py-3 px-3 font-semibold text-sm">{tx.month}</td>
                          <td className="py-3 px-3 font-black">₹{tx.amount?.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-3 text-sm">{tx.paid_date ? new Date(tx.paid_date).toLocaleDateString("en-IN") : "N/A"}</td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-[10px]">{tx.payment_mode}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Complaints & Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No complaints raised</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((c) => (
                    <div key={c.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-sm">{c.title}</h4>
                          <p className="text-xs text-muted-foreground">{c.category}</p>
                        </div>
                        <Badge className={
                          c.status === "resolved" ? "bg-green-500" :
                          c.status === "in-progress" ? "bg-blue-500" :
                          c.status === "open" ? "bg-yellow-500" :
                          "bg-gray-500"
                        }>
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
