import { useState, useRef } from "react";
import { API_BASE_URL } from "../../../lib/apiConfig";
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Wallet, 
  QrCode, 
  Building2, 
  Sparkles, 
  Loader2, 
  Download, 
  IndianRupee 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { toast } from "sonner";
import { api } from "../../../lib/api";

const PAYMENT_METHODS = [
  { id: "UPI", name: "UPI / QR Code", desc: "Pay using Google Pay, PhonePe, Paytm", icon: QrCode, recommend: true },
  { id: "Card", name: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay supported", icon: CreditCard },
  { id: "NetBanking", name: "Net Banking", desc: "Direct payment from top Indian banks", icon: Building2 },
  { id: "Wallet", name: "Mobile Wallets", desc: "Paytm, PhonePe Wallet, Amazon Pay", icon: Wallet }
];

export function PayRentModal({ isOpen, onClose, tenant, property, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [paying, setPaying] = useState(false);
  const [successTx, setSuccessTx] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setPaying(true);
    // Simulate payment authorization delay for premium look & feel
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Get current date
      const today = new Date();
      const paidDate = today.toISOString().split("T")[0];

      // Parse due date or use current month/year for rent month
      let monthStr = "Current Month";
      if (tenant.rent_due_date) {
        const dueDate = new Date(tenant.rent_due_date);
        monthStr = dueDate.toLocaleString("en-IN", { month: "long", year: "numeric" });
      } else {
        monthStr = today.toLocaleString("en-IN", { month: "long", year: "numeric" });
      }

      // Generate simulated receipt number
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const receiptNumber = `REC-${randomId}`;

      const payload = {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        property_id: tenant.property_id || property?.id,
        property_name: tenant.property_name || property?.name || "PG Accommodation",
        amount: tenant.rent_amount,
        month: monthStr,
        paid_date: paidDate,
        payment_mode: selectedMethod,
        receipt_number: receiptNumber,
        owner_id: tenant.owner_id
      };

      const resp = await fetch(`${API_BASE_URL}/tenant/rent-collection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        throw new Error("Failed to record rent transaction on backend");
      }

      const tx = await resp.json();
      setSuccessTx(tx);
      toast.success("Rent Paid Successfully! Receipt generated.");
      if (onSuccess) {
        onSuccess(tx);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Payment processing failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!successTx) return;
    setDownloading(true);
    const toastId = toast.loading("Generating PDF Receipt...");

    try {
      const blob = await api.generateReceiptPDF({
        tenant: tenant,
        property: property || { name: tenant.property_name || "PG Accommodation" },
        transaction: successTx
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${successTx.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF Receipt downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF Generation failed:", error);
      toast.error("Failed to generate PDF. Make sure PDF service is running.", { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { if (!paying && !successTx) onClose(); }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-gray-100 dark:border-gray-800"
        >
          {/* Close button */}
          {(!paying && !successTx) && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {!successTx ? (
            /* PAYMENT SCREEN */
            <div className="p-8 lg:p-10 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Secure Payment portal
                </span>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Pay Monthly Rent</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Choose a payment mode to clear your dues.</p>
              </div>

              {/* Due Summary Card */}
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-indigo-100/50 dark:border-indigo-900/30">
                <div>
                  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Due Amount</div>
                  <div className="text-4xl font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <IndianRupee className="w-7 h-7 stroke-[2.5]" />
                    {tenant.rent_amount?.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Due Date</div>
                  <div className="text-base font-black text-gray-800 dark:text-gray-200">{tenant.rent_due_date || "N/A"}</div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Status: Overdue</div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 ml-1">Select Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedMethod === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => !paying && setSelectedMethod(m.id)}
                        className={`cursor-pointer group relative p-5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4 ${
                          isSelected 
                            ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20" 
                            : "border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-800 bg-white dark:bg-gray-900"
                        }`}
                      >
                        <div className={`p-3 rounded-xl transition-colors ${
                          isSelected 
                            ? "bg-indigo-600 text-white" 
                            : "bg-gray-50 dark:bg-gray-800 text-gray-500 group-hover:text-indigo-600"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                            {m.name}
                            {m.recommend && (
                              <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-snug">{m.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button 
                  disabled={paying}
                  onClick={handlePay}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl py-7 text-base shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Authorizing Payment with Gateway...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="w-5 h-5" />
                      Proceed & Pay ₹{tenant.rent_amount?.toLocaleString("en-IN")}
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-wider mt-4">
                  🔒 256-Bit SSL Encrypted Transaction
                </p>
              </div>
            </div>
          ) : (
            /* SUCCESS & INVOICE SCREEN */
            <div className="p-8 lg:p-10 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Payment Successful!</h2>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <span>₹{successTx.amount?.toLocaleString("en-IN")} Received</span>
                  <span>•</span>
                  <span>{successTx.payment_mode}</span>
                </p>
              </div>

              {/* Digital Invoice Receipt component styled elegantly */}
              <div ref={receiptRef} className="bg-gray-50 dark:bg-gray-950/80 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-bl-[4rem]" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg text-gray-900 dark:text-white">{(tenant.property_name || property?.name || "PG Accommodation").toUpperCase()}</h3>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Digital Payment Receipt</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                      #{successTx.receipt_number}
                    </span>
                  </div>
                </div>

                <hr className="border-gray-200/60 dark:border-gray-800" />

                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Resident / Tenant</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">{tenant.name}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Contact details</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">{tenant.phone}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rent Month</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">{successTx.month}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Transaction Date</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200">{successTx.paid_date}</div>
                  </div>
                </div>

                <hr className="border-gray-200/60 dark:border-gray-800" />

                <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                  <div className="text-xs font-black uppercase text-gray-400 dark:text-gray-500">Amount Paid</div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">₹{successTx.amount?.toLocaleString("en-IN")}</div>
                </div>

                <div className="text-[9px] text-gray-400 font-bold leading-normal italic text-center">
                  Thank you for paying on time! The owner and manager have been notified of your payment in real-time.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex-1 bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-100 hover:border-indigo-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-indigo-400 dark:border-gray-700 font-black rounded-2xl py-6 flex items-center justify-center gap-2 shadow-sm"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl py-6 shadow-xl shadow-indigo-100 dark:shadow-none"
                >
                  Done & Close
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
