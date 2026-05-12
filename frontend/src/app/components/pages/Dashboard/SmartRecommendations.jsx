import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { api } from "../../../lib/api";
import { Link } from "react-router";

export function SmartRecommendations() {
  const [isOpen, setIsOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchAI = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const insightData = await api.getAIInsight();
      setAiInsight(insightData.insight);
    } catch (error) {
      console.error("Failed to fetch AI insight:", error);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !aiInsight) {
      fetchAI();
    }
  }, [isOpen, aiInsight, fetchAI]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="absolute bottom-20 right-0 w-[400px] md:w-[500px] max-w-[90vw]"
          >
            <Card className="relative overflow-hidden bg-white/90 dark:bg-black/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-2xl rounded-[2.5rem] group">
              <div className="absolute top-6 right-6 z-20">
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10">
                    <X className="w-5 h-5" />
                 </Button>
              </div>
              
              <CardContent className="p-8 relative z-10 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                      Strategic AI Insights
                      <Badge className="bg-indigo-600/10 text-indigo-600 border-none px-2 py-0 h-5 text-[10px] font-black uppercase">Alpha</Badge>
                    </h2>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white relative overflow-hidden group/tile">
                    <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12 group-hover/tile:rotate-0 transition-transform">
                       <Users className="w-12 h-12" />
                    </div>
                    <div className="relative z-10">
                      <div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">Revenue Lift</div>
                      <div className="text-xl font-black mb-1">₹42,000</div>
                      <Badge className="bg-white/20 text-[8px]">+14%</Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-card border border-gray-100 dark:border-white/10 rounded-[1.5rem] relative overflow-hidden group/tile shadow-xl shadow-gray-100/10 transition-all hover:shadow-2xl">
                    <div className="absolute top-0 right-0 p-2 opacity-5 rotate-12 group-hover/tile:rotate-0 transition-transform">
                       <TrendingUp className="w-12 h-12" />
                    </div>
                    <div className="relative z-10">
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-2">Portfolio Score</div>
                      <div className="text-xl font-black mb-1 text-gray-900 dark:text-white">92.4%</div>
                      <Badge className="bg-emerald-100 text-emerald-600 text-[8px]">EXCELLENT</Badge>
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-wider border border-indigo-500/20">Actionable Intelligence</div>
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter leading-none">Smart <span className="text-indigo-600">Recommendations</span></h3>
                  </div>

                  <div className="bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-[2rem] p-6 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {isAiLoading ? (
                       <div className="space-y-4">
                          <div className="h-3 bg-gray-200 dark:bg-white/5 rounded-full w-3/4 animate-pulse"></div>
                          <div className="grid grid-cols-1 gap-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-2 bg-gray-200 dark:bg-white/5 rounded-full w-full animate-pulse"></div>)}
                          </div>
                       </div>
                    ) : (
                      <div className="border-l-2 border-indigo-600 pl-6 py-1">
                        <p className="text-gray-700 dark:text-gray-300 font-semibold leading-relaxed italic text-sm mb-4">
                          Optimization suggestions:
                        </p>
                        
                        <div className="space-y-4">
                          {aiInsight ? aiInsight.split(/(?:\d+\.\s|•|\n-)/).filter(Boolean).map((point, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="group/item"
                            >
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-relaxed italic">
                                <span className="text-indigo-600 mr-2 opacity-50">•</span> {point.trim()}
                              </p>
                            </motion.div>
                          )) : (
                            <p className="text-xs italic text-muted-foreground font-bold">No specific recommendations available.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link to="/ai-assistant" className="w-full">
                      <Button variant="outline" className="w-full rounded-xl border-2 py-6 font-black hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                        Consult Assistant
                      </Button>
                    </Link>
                  </div>

                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl transition-all duration-500 ${
            isOpen 
              ? "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-gray-400/20" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/40"
          } relative overflow-hidden`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? "close" : "sparkles"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </motion.div>
          </AnimatePresence>
          {!isOpen && (
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white rounded-full pointer-events-none"
            />
          )}
        </Button>
      </motion.div>
    </div>
  );
}
