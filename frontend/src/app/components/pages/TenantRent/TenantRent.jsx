import { useEffect, useState, useCallback, useRef } from "react";
import { API_BASE_URL } from "../../../lib/apiConfig";
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
import { api } from "../../../lib/api";
import { PayRentModal } from "./PayRentModal";

export function TenantRent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedReceipt, setExpandedReceipt] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const receiptRef = useRef(null);
  const notifiedStatus = useRef(null);

  const fetchData = useCallback(async () => {
    const tenantId = localStorage.getItem("tenantId");
    try {
      const resp = await fetch(`${API_BASE_URL}/tenant/dashboard/${tenantId}`);
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

  // Notify when rent is due or overdue
  useEffect(() => {
    if (!data?.tenant) return;
    const { rent_status, rent_amount, rent_due_date } = data.tenant;
    if (rent_status === 'due' && notifiedStatus.current !== 'due') {
      notifiedStatus.current = 'due';
      window.dispatchEvent(new CustomEvent("pg-notification", {
        detail: {
          category: "rent_due",
          title: "💸 Rent Payment Due",
          message: `Your rent of ₹${rent_amount} is due by ${rent_due_date}. Please pay on time to avoid late fees.`,
          tenant_id: parseInt(localStorage.getItem("tenantId"), 10),
          showToast: false,
        }
      }));
    } else if (rent_status === 'overdue' && notifiedStatus.current !== 'overdue') {
      notifiedStatus.current = 'overdue';
      window.dispatchEvent(new CustomEvent("pg-notification", {
        detail: {
          category: "rent_overdue",
          title: "🚨 Rent Payment Overdue",
          message: `Your rent of ₹${rent_amount} was due on ${rent_due_date}. Pay immediately to avoid penalties.`,
          tenant_id: parseInt(localStorage.getItem("tenantId"), 10),
          showToast: false,
        }
      }));
    }
  }, [data]);

  useEffect(() => {
    if (expandedReceipt !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [expandedReceipt]);

  const handleDownloadPDF = async (tx) => {
    setDownloading(true);
    const toastId = toast.loading("Generating professional PDF Receipt...");
    
    try {
      const blob = await api.generateReceiptPDF({
        tenant: data.tenant,
        property: data.property,
        transaction: tx
      });

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

  const { tenant, property, transactions = [] } = data;

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
                    <Button 
                        onClick={() => setIsPayModalOpen(true)}
                        disabled={tenant.rent_status === 'paid'}
                        className="w-full bg-white text-indigo-600 hover:bg-white/90 disabled:bg-white/50 disabled:text-indigo-400 rounded-2xl font-black shadow-inner py-6"
                    >
                        {tenant.rent_status === 'paid' ? 'Rent Paid' : 'Pay Rent Now'}
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
                <div className="bg-white dark:bg-gray-900 p-6 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all rounded-3xl">
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
                        className="rounded-xl font-bold border-none px-6 py-6 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-600 hover:text-white group transition-all"
                        onClick={() => setExpandedReceipt(idx)}
                      >
                          <Receipt className="w-4 h-4 mr-2" /> Receipt
                      </Button>
                  </div>
                </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Receipt Side Panel/Drawer */}
      <AnimatePresence>
        {expandedReceipt !== null && transactions[expandedReceipt] && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedReceipt(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full md:w-[50vw] h-full bg-gray-50 dark:bg-gray-950 shadow-2xl z-10 border-l border-gray-100 dark:border-gray-800 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Payment Receipt</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Invoice #{transactions[expandedReceipt]?.receipt_number}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    className="rounded-xl h-10 px-4 font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm text-sm"
                    onClick={() => handleDownloadPDF(transactions[expandedReceipt])}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> PDF...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Download PDF</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setExpandedReceipt(null)}
                    className="rounded-xl border-gray-250 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gray-50 dark:bg-gray-950 flex flex-col justify-center items-center">
                <div className="w-full max-w-xl my-auto">
                  {/* Receipt Paper Card */}
                  <div ref={receiptRef} className="bg-white p-6 md:p-8 rounded-[1.5rem] shadow-xl border border-gray-100 relative overflow-hidden text-gray-900">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/55 rounded-bl-[5rem] -mr-10 -mt-10" />

                    {/* Header */}
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <span className="font-black text-base italic">PG</span>
                          </div>
                          <div>
                            <h1 className="text-lg font-black tracking-tight leading-none mb-1 text-gray-900">
                              {(property?.name || tenant.property_name || 'PG').toUpperCase()}
                            </h1>
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em]">Management Hub</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <h2 className="text-2xl font-black text-indigo-600 tracking-tighter leading-none mb-1">INVOICE</h2>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                            #{transactions[expandedReceipt]?.receipt_number}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            Date: {transactions[expandedReceipt] && new Date(transactions[expandedReceipt].paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Billing Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 relative z-10 border-t border-b border-gray-100 py-3">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">Bill From</p>
                        <h3 className="text-sm font-black text-gray-900 leading-none">{property?.name || tenant.property_name}</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Authorized PG Management</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-tight">
                          Registered Property Office<br />
                          PG Hub, India
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">Bill To (Tenant)</p>
                        <h3 className="text-sm font-black text-gray-900 leading-none">{tenant.name}</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Resident Identity</p>
                        <div className="text-[11px] text-gray-500 font-medium leading-tight">
                          <p>{tenant.phone}</p>
                          <p>{tenant.email}</p>
                          {tenant.aadhar_number && (
                            <p className="mt-1 font-mono text-[8px] bg-gray-50 text-gray-600 inline-block px-1.5 py-0.5 rounded">ID: {tenant.aadhar_number}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-4">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-250">
                            <th className="py-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Description of Services</th>
                            <th className="py-1.5 text-right text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr>
                            <td className="py-2.5">
                              <div className="font-bold text-sm text-gray-800">Monthly Accommodation Fee</div>
                              <div className="text-[11px] text-gray-500 mt-0.5">{transactions[expandedReceipt]?.month} — Comprehensive Rent</div>
                            </td>
                            <td className="py-2.5 text-right font-black text-base text-gray-900">
                              ₹{transactions[expandedReceipt]?.amount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end mb-4">
                      <div className="w-full sm:w-56 bg-indigo-600 rounded-2xl p-3.5 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6" />
                        <div className="flex justify-between items-center mb-1.5 opacity-90">
                          <span className="text-[8px] font-bold uppercase tracking-widest">Total Received</span>
                          <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded text-[8px] font-black">
                            {transactions[expandedReceipt]?.payment_mode}
                          </div>
                        </div>
                        <div className="text-xl font-black tracking-tighter">
                          ₹{transactions[expandedReceipt]?.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-80 italic text-center">Fully Paid & Verified</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer and Signatures */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-3 border-t border-gray-100">
                      <div className="max-w-[240px]">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[8px] uppercase tracking-widest mb-1">
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-2 h-2" />
                          </div>
                          Secure Digital Receipt
                        </div>
                        <p className="text-[8px] text-gray-400 leading-normal">
                          This document is a computer-generated invoice and does not require a physical signature for validity. It serves as proof of payment for the specified period.
                        </p>
                      </div>
                      <div className="text-center w-full sm:w-auto">
                        <div className="w-24 border-b border-gray-200 mx-auto sm:mx-0 mb-1 italic text-gray-300 font-bold text-base">Verified</div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Authorized Receipt</p>
                      </div>
                    </div>

                    {/* Paid Watermark (Subtle) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] rotate-[-25deg] pointer-events-none select-none">
                      <span className="text-[8rem] font-black tracking-tighter">PAID</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PayRentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        tenant={tenant}
        property={property}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
