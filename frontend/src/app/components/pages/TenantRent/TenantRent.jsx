import { useEffect, useState } from "react";
import { 
  IndianRupee, 
  Calendar, 
  Receipt, 
  Download, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Wallet
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { cn } from "../../ui/utils";

export function TenantRent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const tenantId = localStorage.getItem("tenantId");
      try {
        const resp = await fetch(`http://localhost:8000/tenant/dashboard/${tenantId}`);
        const result = await resp.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center font-bold animate-pulse">Loading financial records...</div>;
  if (!data) return <div className="p-20 text-center font-bold">Failed to load rent info.</div>;

  const { tenant, transactions } = data;

  return (
    <div className="space-y-10 pb-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-black tracking-tight mb-2">Rent & Payment History</h1>
        <p className="text-muted-foreground font-medium">View your dues, track payments and download receipts.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="border-none shadow-xl rounded-3xl bg-indigo-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
            <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Current Due</span>
                </div>
                <div>
                   <div className="text-4xl font-black mb-1">₹{tenant.rent_status === 'paid' ? '0' : tenant.rent_amount}</div>
                   <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Status: {tenant.rent_status}</div>
                </div>
                <div className="pt-2">
                    <Button className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-2xl font-black shadow-inner py-6">
                        Pay Rent Now
                    </Button>
                </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-xl rounded-3xl bg-white dark:bg-gray-900 overflow-hidden">
            <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Next Payment Date</span>
                </div>
                <div>
                   <div className="text-3xl font-black mb-1">{tenant.rent_due_date}</div>
                   <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Grace Period: 3 Days</div>
                </div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                    <Clock className="w-4 h-4" /> Late payment fine: ₹200/day
                </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-xl rounded-3xl bg-white dark:bg-gray-900 overflow-hidden">
            <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Paid to date</span>
                </div>
                <div>
                   <div className="text-3xl font-black mb-1">₹{transactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</div>
                   <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Security Deposit: ₹{tenant.advance}</div>
                </div>
                <Button variant="outline" className="w-full rounded-2xl py-6 font-bold border-gray-100 dark:border-gray-800">
                    Get Tax Summary
                </Button>
            </CardContent>
         </Card>
      </div>

      <div className="space-y-6">
         <h3 className="text-xl font-black tracking-tight flex items-center gap-3 ml-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Transaction Log
         </h3>
         
         <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="p-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 font-bold text-muted-foreground italic">No payments recorded yet.</div>
            ) : transactions.map((tx, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shrink-0">
                        <IndianRupee className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <div className="text-lg font-black tracking-tight">{tx.month} Rent Payment</div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border-r pr-4 border-gray-100 dark:border-gray-800">
                                <Calendar className="w-3 h-3" /> {tx.paid_date}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> {tx.payment_mode}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-10">
                    <div className="text-left md:text-right">
                        <div className="text-2xl font-black tracking-tighter">₹{tx.amount}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{tx.receipt_number}</div>
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold bg-gray-50 dark:bg-gray-800 border-none px-6 py-6 group hover:bg-indigo-600 hover:text-white transition-all">
                        <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" /> Receipt
                    </Button>
                </div>
              </motion.div>
            ))}
         </div>
      </div>
    </div>
  );
}
