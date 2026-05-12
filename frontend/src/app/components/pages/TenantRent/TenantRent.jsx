import { useEffect, useState, useCallback, useRef } from "react";
import { 
  IndianRupee, 
  Calendar, 
  Receipt, 
  Download, 
  CheckCircle2, 
  Clock,
  Wallet,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { cn } from "../../ui/utils";
import { useDataRefresh } from "../../../lib/dataEvents";
import { toast } from "sonner";

export function TenantRent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedReceipt, setExpandedReceipt] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef(null);

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(["rent", "tenants"], fetchData);

  const handleDownloadPDF = async (tx) => {
    setDownloading(true);
    const toastId = toast.loading("Generating professional PDF via Puppeteer...");
    
    try {
      const response = await fetch('http://localhost:3000/api/pdf/generate-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant: data.tenant,
          property: data.property,
          transaction: tx
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${tx.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF Receipt downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF Generation failed:", error);
      toast.error("Failed to generate PDF. Make sure the PDF service is running.", { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold animate-pulse">Loading financial records...</div>;
  if (!data) return <div className="p-20 text-center font-bold">Failed to load rent info.</div>;

  const { tenant, property, transactions } = data;

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
                className="space-y-0"
              >
                {/* Transaction Row */}
                <div className={cn(
                  "bg-white dark:bg-gray-900 p-6 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all",
                  expandedReceipt === idx ? "rounded-t-3xl border-b-0 shadow-lg" : "rounded-3xl"
                )}>
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

                  <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-6">
                      <div className="text-left md:text-right">
                          <div className="text-2xl font-black tracking-tighter">₹{tx.amount.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{tx.receipt_number}</div>
                      </div>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "rounded-xl font-bold border-none px-6 py-6 group transition-all",
                          expandedReceipt === idx 
                            ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                            : "bg-gray-50 dark:bg-gray-800 hover:bg-indigo-600 hover:text-white"
                        )}
                        onClick={() => setExpandedReceipt(expandedReceipt === idx ? null : idx)}
                      >
                          {expandedReceipt === idx ? (
                            <><X className="w-4 h-4 mr-2" /> Close</>
                          ) : (
                            <><Receipt className="w-4 h-4 mr-2" /> Receipt</>
                          )}
                      </Button>
                  </div>
                </div>

                {/* Expanded Full Receipt - Inline */}
                <AnimatePresence>
                  {expandedReceipt === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden bg-gray-50 dark:bg-gray-950 border border-t-0 border-gray-100 dark:border-gray-800 rounded-b-3xl"
                    >
                      <div className="p-6">
                        {/* Receipt Content - This is what gets captured for PDF */}
                        <div ref={receiptRef} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative max-w-4xl mx-auto overflow-hidden">
                          {/* Decorative Background */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[5rem] -mr-10 -mt-10" />

                          {/* Header */}
                          <div className="flex justify-between items-start mb-12 relative z-10">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                  <span className="font-black text-lg italic">PG</span>
                                </div>
                                <div>
                                  <h1 className="text-2xl font-black tracking-tight leading-none mb-1">{(property?.name || tenant.property_name || 'PG').toUpperCase()}</h1>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Management Hub</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <h2 className="text-4xl font-black text-indigo-600 tracking-tighter leading-none mb-2">INVOICE</h2>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 py-1 bg-gray-100 rounded-md">
                                  #{tx.receipt_number}
                                </span>
                                <span className="text-xs font-bold text-gray-500">Date: {new Date(tx.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Billing Grid */}
                          <div className="grid grid-cols-2 gap-16 mb-12 relative z-10">
                            <div className="space-y-6">
                              <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Bill From</p>
                                <h3 className="text-lg font-black leading-none mb-1">{property?.name || tenant.property_name}</h3>
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
                                <h3 className="text-lg font-black leading-none mb-1">{tenant.name}</h3>
                                <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest italic">Resident Identity</p>
                                <div className="text-xs text-muted-foreground font-medium leading-relaxed">
                                  <p>{tenant.phone}</p>
                                  <p>{tenant.email}</p>
                                  {tenant.aadhar_number && (
                                    <p className="mt-2 font-mono text-[10px] bg-gray-50 inline-block px-2 py-1 rounded-md">ID: {tenant.aadhar_number}</p>
                                  )}
                                </div>
                              </div>
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
                                    <div className="text-xs text-muted-foreground mt-1">{tx.month} — Comprehensive Rent</div>
                                  </td>
                                  <td className="py-6 text-right font-black text-lg">₹{tx.amount.toLocaleString('en-IN')}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Totals Section */}
                          <div className="flex justify-end mb-12">
                              <div className="w-64 bg-indigo-600 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
                                  <div className="flex justify-between items-center mb-4 opacity-80">
                                      <span className="text-[10px] font-bold uppercase tracking-widest">Total Received</span>
                                      <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[8px] font-black">
                                          {tx.payment_mode}
                                      </div>
                                  </div>
                                  <div className="text-3xl font-black tracking-tighter">₹{tx.amount.toLocaleString('en-IN')}</div>
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
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                Secure Digital Receipt
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                This document is a computer-generated invoice and does not require a physical signature for validity. It serves as proof of payment for the specified period.
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="w-40 border-b-2 border-gray-100 mb-2 italic text-gray-300 font-bold text-xl">Verified</div>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Authorized Receipt</p>
                            </div>
                          </div>

                          {/* Paid Watermark (Subtle) */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-25deg] pointer-events-none select-none">
                              <span className="text-[12rem] font-black tracking-tighter">PAID</span>
                          </div>
                        </div>
                        
                        {/* Download Button */}
                        <div className="flex justify-center mt-6">
                          <Button 
                            className="rounded-2xl h-14 px-10 font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none gap-3 text-base"
                            onClick={() => handleDownloadPDF(tx)}
                            disabled={downloading}
                          >
                            {downloading ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...</>
                            ) : (
                              <><Download className="w-5 h-5" /> Download PDF Receipt</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
         </div>
      </div>
    </div>
  );
}
