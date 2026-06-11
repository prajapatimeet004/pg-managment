import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import {
  LayoutDashboard,
  Building2,
  Users,
  Bed,
  IndianRupee,
  MessageSquareWarning,
  Bell,
  BarChart3,
  Bot,
  Menu,
  LogOut,
  Sparkles,
  Search,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "../ui/utils";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "../ui/input";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { NotificationPanel } from "../ui/NotificationPanel";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Property Ops",
    icon: Building2,
    children: [
      { name: "Properties", href: "/properties", icon: Building2 },
      { name: "Tenants", href: "/tenants", icon: Users },
      { name: "Rooms & Beds", href: "/rooms", icon: Bed },
      { name: "Staff", href: "/staff", icon: ShieldCheck },
    ],
  },
  { name: "Rent Collection", href: "/rent", icon: IndianRupee },
  { name: "Complaints", href: "/complaints", icon: MessageSquareWarning },
  { name: "Notice Board", href: "/notices", icon: Bell },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      const userRole = localStorage.getItem("userRole");
      if (userRole && userRole !== "Owner") {
        const ownerId = localStorage.getItem("ownerId");
        const ownerName = localStorage.getItem("ownerName");
        // Fetch staff by owner_id ONLY (no property filter) so we always find our own profile
        fetch(`http://127.0.0.1:8000/staff?owner_id=${ownerId}`)
          .then(r => r.json())
          .then(staffList => {
            if (!Array.isArray(staffList)) return;
            const myProfile = staffList.find(s => s.name === ownerName);
            if (myProfile) {
              const pIds = myProfile.property_ids || (myProfile.property_id ? [myProfile.property_id] : []);
              const pNames = Array.isArray(myProfile.property_names)
                ? myProfile.property_names.join(", ")
                : (myProfile.property_name || "");
              
              const currentIds = localStorage.getItem("propertyIds") || "";
              const newIdsStr = pIds.join(",");
              if (currentIds !== newIdsStr) {
                localStorage.setItem("propertyIds", newIdsStr);
                localStorage.setItem("propertyNames", pNames);
                window.location.reload();
              }
            }
          }).catch(console.error);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  // Listen for real-time notifications (e.g. rent paid by a tenant)
  useEffect(() => {
    const handleNotification = (e) => {
      const n = e.detail;
      if (n?.category === "rent_paid") {
        toast.success(n.title, {
          description: n.message,
          duration: 6000,
        });
      }
    };
    window.addEventListener("pg-notification", handleNotification);
    return () => window.removeEventListener("pg-notification", handleNotification);
  }, []);

  const NavLinks = ({ mobile = false, onClose }) => {
    const userRole = localStorage.getItem("userRole") || "Owner";
    const [openMenus, setOpenMenus] = useState({});

    const toggleMenu = (name) => {
      setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const filteredNavigation = navigation.map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => !child.role || child.role === userRole)
        };
      }
      return item;
    }).filter(item => !item.role || item.role === userRole);

    return (
      <nav className={cn("space-y-1 focus:outline-none", mobile && "pt-4")}>
        {filteredNavigation.map((item, idx) => {
          const hasChildren = item.children && item.children.length > 0;
          const isChildActive = hasChildren && item.children.some((child) => location.pathname === child.href);
          const isActive = location.pathname === item.href || isChildActive;
          const isOpen = openMenus[item.name] !== undefined ? openMenus[item.name] : (isActive && hasChildren);

          return (
            <div key={item.name} className="relative">
              {hasChildren ? (
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    "w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                    isActive
                      ? "bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "group-hover:scale-110 transition-transform")} />
                  <span>{item.name}</span>
                  <ChevronDown className={cn("ml-auto w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
              ) : (
                <motion.div
                  initial={mobile ? { x: -20, opacity: 0 } : false}
                  animate={mobile ? { x: 0, opacity: 1 } : false}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              )}

              <AnimatePresence>
                {hasChildren && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-4 mt-1 space-y-1 border-l-2 border-indigo-100 dark:border-indigo-900/30 ml-6"
                  >
                    {item.children.map((child) => {
                      const isChildActiveItem = location.pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          onClick={onClose}
                          className={cn(
                            "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm",
                            isChildActiveItem
                              ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/20"
                              : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-indigo-900/10"
                          )}
                        >
                          <child.icon className={cn("w-4 h-4", isChildActiveItem ? "text-indigo-600" : "opacity-70")} />
                          {child.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <div className="pt-4 pb-2 px-2 uppercase text-[10px] font-bold tracking-widest text-muted-foreground opacity-50">
          AI Intelligence
        </div>

        <Link
          to="/ai-assistant"
          onClick={onClose}
          className={cn(
            "relative group flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-300 overflow-hidden",
            location.pathname === "/ai-assistant"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-200"
              : "bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 hover:shadow-md"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Bot className={cn("w-6 h-6", location.pathname === "/ai-assistant" ? "text-white" : "text-indigo-600")} />
          <div className="flex flex-col">
            <span className="font-bold text-sm">AI Assistant</span>
            <span className={cn("text-[10px] opacity-70", location.pathname === "/ai-assistant" ? "text-white" : "text-indigo-500")}>
              Get Business Insights
            </span>
          </div>
          <Sparkles className="ml-auto w-4 h-4 text-amber-400 animate-pulse" />
        </Link>
      </nav>
    );
  };

  return (
    <div className="layout-fixed-height bg-gray-50 dark:bg-black font-sans antialiased text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row">
      {/* Mobile Glass Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">PG Manager <span className="text-indigo-600">Pro</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] max-w-sm p-6 rounded-r-3xl border-r-none">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <div className="font-bold text-xl">PG Manager Pro</div>
                      <div className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Premium SaaS</div>
                    </div>
                  </div>
                  <NavLinks mobile onClose={() => {}} />
                  <div className="mt-auto absolute bottom-8 left-6 right-6">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl py-6"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      <span className="font-bold">Logout Session</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-full flex-shrink-0">
          <div className="p-8 pb-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 dark:shadow-none group-hover:rotate-6 transition-transform">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="font-black text-xl tracking-tight leading-none mb-1">PG <span className="text-indigo-600">PRO</span></div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Admin Dashboard</div>
              </div>
            </Link>
          </div>

          <div className="px-4 mb-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
              <Input 
                placeholder="Search everything..." 
                className="pl-9 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus-visible:ring-1 ring-indigo-500/30"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            <NavLinks />
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-900">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{localStorage.getItem("ownerName") || "User"}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase">{localStorage.getItem("userRole") || "Owner"}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl h-12"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="font-bold text-sm">Sign Out</span>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <div className="content-scroll-area p-4 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto relative">
              {/* Bell floats sticky at top-right, aligned with page h1 */}
              <div className="hidden lg:block sticky top-0 float-right z-30 -mt-0 mb-0 ml-4">
                <NotificationPanel />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
