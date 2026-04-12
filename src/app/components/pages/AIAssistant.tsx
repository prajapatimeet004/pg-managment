import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Bot, Send, User, Sparkles, Wand2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: {
    label: string;
    type: "remind" | "view_report" | "resolve";
  };
}

// suggestedQueries moved to suggestedQueries constant

const suggestedQueries = [
  "Send rent reminders",
  "How's my occupancy?",
  "Urgent complaints?",
  "Revenue trends",
];

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Namaste! I'm your AI PG Assistant. I've just finished scanning your properties. Rent collection is looking good, but I found 2 pending complaints that need your attention. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput("");
    setIsTyping(true);

    try {
      const response = await api.postAIChat(messageToSend);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            AI Property Manager <Sparkles className="w-6 h-6 text-indigo-500 fill-indigo-500" />
          </h1>
          <p className="text-muted-foreground">Intelligent insights for your PG business</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 py-1.5 px-3 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            AI Online
          </Badge>
        </div>
      </div>

      {/* Main Chat Area */}
      <Card className="border-none shadow-2xl bg-white dark:bg-gray-950 overflow-hidden flex flex-col h-[700px] rounded-3xl">
        <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-950 rounded-full" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Smart Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Powered by PG-Insight Engine v2.0</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-gray-900/10">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${message.role === "assistant"
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                  }`}>
                  {message.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-4 rounded-3xl shadow-sm ${message.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-tl-none"
                    }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {message.action && (
                      <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-gray-700 flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="w-full justify-between bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-none rounded-xl"
                        >
                          <span className="font-bold">{message.action.label}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex gap-4 items-start"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-tl-none border dark:border-gray-700 shadow-sm">
                  <div className="flex gap-1.5">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Action Tray */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t backdrop-blur-sm">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length < 3 && (
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                {suggestedQueries.map((query, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-white dark:bg-gray-800 text-xs font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                    onClick={() => {
                      setInput(query);
                    }}
                  >
                    <Wand2 className="w-3 h-3 mr-1.5 text-indigo-500" />
                    {query}
                  </Button>
                ))}
              </div>
            )}

            <div className="relative group">
              <Input
                placeholder="Ask me to 'analyze revenue' or 'send reminders'..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="pr-14 h-14 rounded-2xl border-none bg-white dark:bg-gray-800 shadow-inner group-focus-within:ring-2 ring-indigo-500/20 transition-all text-base"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 top-1.5 h-11 w-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
              AI suggestions are based on real-time property data
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-600">Growth Score</p>
              <p className="text-xl font-bold">8.4/10</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">Cleanliness</p>
              <p className="text-xl font-bold">Excellent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/10 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-600">Risk Level</p>
              <p className="text-xl font-bold">Low</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
