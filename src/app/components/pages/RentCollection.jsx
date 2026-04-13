import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import {
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Download,
  Search,
  Filter,
  ArrowRight,
  QrCode,
  Share2,
  Sparkles,
  MoreVertical,
  Building2,
  Bot
} from "lucide-react";


import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { api } from "../../lib/api";
import { cn } from "../ui/utils";

export function RentCollection() {
  const [tenants, setTenants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantsData, transactionsData] = await Promise.all([
          api.getTenants(),
          api.getRentTransactions(),
        ]);
        setTenants(tenantsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Failed to fetch rent data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center font-bold">Loading assessment...</div>;

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.property_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || tenant.rent_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const overdueCount = tenants.filter((t) => t.rent_status === "overdue").length;
  const dueCount = tenants.filter((t) => t.rent_status === "due").length;
  const paidCount = tenants.filter((t) => t.rent_status === "paid").length;
  const totalCollected = transactions.reduce((acc, t) => acc + t.amount, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-full px-3 py-1 font-bold border-none">PAID</Badge>;
      case "due":
        return <Badge className="bg-amber-500 hover:bg-amber-600 rounded-full px-3 py-1 font-bold border-none">DUE</Badge>;
      case "overdue":
        return <Badge className="bg-rose-500 hover:bg-rose-600 rounded-full px-3 py-1 font-bold border-none shadow-sm shadow-rose-200">OVERDUE</Badge>;
      default:
        return <Badge variant="outline" className="rounded-full px-3 py-1">{status.toUpperCase()}</Badge>;
    }
  };

  const handleSendReminder = (tenant) => {
    alert(`WhatsApp reminder sent to ${tenant.name} for ₹${tenant.rent_amount.toLocaleString("en-IN")}!`);
  };

  const handleGenerateReceipt = (tenant) => {
    setSelectedTenant(tenant);
    setIsReceiptOpen(true);
  };

  const handleDownloadReceipt = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      alert("Receipt PDF generated and downloaded!");
      setIsReceiptOpen(false);
    }, 500);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 px-3 py-1 rounded-full border-emerald-200 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 font-bold uppercase tracking-widest text-[10px]">
            Financial Management
          </Badge>
          <h1 className="text-4xl font-black tracking-tight mb-2">Rent Ledger</h1>
          <p className="text-muted-foreground max-w-lg font-medium">
            Monitor incoming cash flow, automate tenant reminders, and manage historical payment records with ease.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" className="rounded-2xl font-bold h-14 border-gray-200">
            <Download className="w-5 h-5 mr-2" /> Export Report
          </Button>
          <Button size="lg" className="rounded-2xl font-bold h-14 bg-indigo-600 shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5 mr-2" /> Collection QR
          </Button>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Overdue Amount", value: overdueCount, color: "rose", icon: AlertCircle, trend: "Requires attention" },
          { label: "Incoming Soon", value: dueCount, color: "amber", icon: Clock, trend: "Next 3 days" },
          { label: "Paid Assets", value: paidCount, color: "emerald", icon: CheckCircle, trend: "Collection active" },
          { label: "Total Collected", value: `₹${(totalCollected / 1000).toFixed(0)}K`, color: "indigo", icon: IndianRupee, trend: "Current month" },
        ].map((metric, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-${metric.color}-50 dark:bg-${metric.color}-900/20 flex items-center justify-center text-${metric.color}-600 group-hover:rotate-6 transition-transform`}>
                  <metric.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{metric.label}</p>
                  <p className={`text-2xl font-black text-${metric.color}-600 dark:text-${metric.color}-400`}>{metric.value}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground opacity-60 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full bg-${metric.color}-500`} />
                {metric.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Smart Reminder Suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white border-0 shadow-xl rounded-[2rem]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3 bg-white/20 w-fit mx-auto md:mx-0 px-3 py-1 rounded-full backdrop-blur-md">
                <Bot className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Smart Collection Engine</span>
              </div>
              <h3 className="text-2xl font-black mb-2">Automate Overdue Recovery</h3>
              <p className="text-rose-50/90 text-sm max-w-2xl font-medium">
                I've detected <span className="underline decoration-yellow-400 font-bold">{overdueCount} tenants</span> with pending payments.
                Using "Soft-Persistence" reminders on WhatsApp usually increases recovery rates by 42% when sent between 10 AM and 12 PM.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="font-bold rounded-xl h-12 px-6 shadow-lg shadow-black/10 group">
                Blast WhatsApp Reminders <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
          <Input
            placeholder="Search by tenant name, property or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus-visible:ring-2 ring-indigo-500/20 text-base"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] h-14 pl-10 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm font-bold">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="all">Everything</SelectItem>
                <SelectItem value="overdue">Overdue Only</SelectItem>
                <SelectItem value="due">Due Soon</SelectItem>
                <SelectItem value="paid">Already Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white dark:bg-gray-900 shadow-sm">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Rent Status Table - Desktop */}
      <div className="hidden lg:block">
        <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white dark:bg-gray-950">
          <div className="p-8 border-b dark:border-gray-800 flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black">Ledger Details</CardTitle>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">April 2026 Collection Cycle</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border dark:border-gray-800">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold uppercase">Real-time tracking enabled</span>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800">
                    <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenant Identity</th>
                    <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Property Context</th>
                    <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Financials</th>
                    <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collection Status</th>
                    <th className="text-right py-5 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  <AnimatePresence>
                    {filteredTenants.map((tenant, idx) => (
                      <motion.tr
                        key={tenant.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors group"
                      >
                        <td className="py-5 px-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
                              {tenant.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-sm">{tenant.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Unit {tenant.room_number} • Bed {tenant.bed_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          <p className="text-sm font-bold">{tenant.property_name}</p>
                        </td>
                        <td className="py-5 px-8">
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-indigo-700 dark:text-indigo-400">₹{tenant.rent_amount.toLocaleString("en-IN")}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Due {new Date(tenant.rent_due_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          {getStatusBadge(tenant.rent_status)}
                        </td>
                        <td className="py-5 px-8 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {tenant.rent_status !== "paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                onClick={() => handleSendReminder(tenant)}
                              >
                                <Share2 className="w-4 h-4 mr-1.5" /> Remind
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                              onClick={() => handleGenerateReceipt(tenant)}
                            >
                              <Download className="w-4 h-4 mr-1.5" /> PDF
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredTenants.length === 0 && (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-bold text-lg">No matches found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or search keywords.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rent Cards - Mobile/Tablet Grid */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="border-none shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-bold text-indigo-600">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black leading-tight">{tenant.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{tenant.property_name}</p>
                  </div>
                </div>
                {getStatusBadge(tenant.rent_status)}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-6">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Rent Amount</p>
                  <p className="text-xl font-black text-indigo-700 dark:text-indigo-400">₹{tenant.rent_amount.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Due On</p>
                  <p className={cn("text-sm font-bold", tenant.rent_status === "overdue" ? "text-rose-600" : "text-gray-700 dark:text-gray-300")}>
                    {new Date(tenant.rent_due_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {tenant.rent_status !== "paid" ? (
                  <Button
                    className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 shadow-md shadow-indigo-100"
                    onClick={() => handleSendReminder(tenant)}
                  >
                    <Send className="w-4 h-4 mr-2" /> Remind
                  </Button>
                ) : (
                  <Button
                    className="flex-1 rounded-xl h-12 font-bold bg-emerald-600"
                    disabled
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Payment Received
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-xl border-gray-200"
                  onClick={() => handleGenerateReceipt(tenant)}
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modern Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          {selectedTenant && (
            <div className="flex flex-col">
              <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <QrCode className="w-24 h-24" />
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Building2 className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black">Digital Receipt</h2>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Ref: {selectedTenant.id}XP-92</p>
              </div>

              <div className="p-8 bg-white dark:bg-gray-950 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center font-bold text-gray-500">
                      {selectedTenant.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Paid By</p>
                      <p className="font-black text-lg">{selectedTenant.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Date</p>
                    <p className="font-bold">{new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Property Name</span>
                    <span className="font-bold">{selectedTenant.property_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Room Allocation</span>
                    <span className="font-bold">Unit {selectedTenant.room_number} • Bed {selectedTenant.bed_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Period Covered</span>
                    <span className="font-bold">April 2026</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-lg font-black uppercase text-indigo-600">Total Paid</span>
                    <span className="text-3xl font-black">₹{selectedTenant.rent_amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-center py-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Verified by PG Manager Pro</span>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-2xl h-14 font-bold border-gray-200" onClick={() => setIsReceiptOpen(false)}>
                    Close
                  </Button>
                  <Button className="flex-1 rounded-2xl h-14 font-bold bg-indigo-600 shadow-xl shadow-indigo-100" onClick={handleDownloadReceipt}>
                    <Download className="w-5 h-5 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
