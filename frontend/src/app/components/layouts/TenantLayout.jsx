import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { Button } from "../ui/button";
import { 
  Home, 
  CreditCard, 
  MessageSquareWarning, 
  Bell, 
  LogOut,
  User,
  ExternalLink,
  LifeBuoy
} from "lucide-react";
import { cn } from "../ui/utils";
import { motion, AnimatePresence } from "motion/react";

const tenantNavigation = [
  { name: "My Dashboard", href: "/tenant", icon: Home },
  { name: "Rent & Receipts", href: "/tenant/rent", icon: CreditCard },
  { name: "My Complaints", href: "/tenant/complaints", icon: MessageSquareWarning },
  { name: "Notices", href: "/tenant/notices", icon: Bell },
];

export function TenantLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    const isAuth = localStorage.getItem("isTenantAuthenticated");
    if (!isAuth) {
      navigate("/tenant/login");
    }
    setTenantName(localStorage.getItem("tenantName") || "Tenant");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isTenantAuthenticated");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("tenantName");
    navigate("/tenant/login");
  };

  return (
    <div className="layout-fixed-height bg-gray-50 dark:bg-black font-sans antialiased text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/tenant" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg italic">Tenant <span className="text-indigo-600">Portal</span></span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full text-red-500">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-full flex-shrink-0">
        <div className="p-8">
          <Link to="/tenant" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 dark:shadow-none transition-transform group-hover:rotate-6">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="font-black text-xl tracking-tight leading-none mb-1 text-indigo-600">TENANT</div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Management Hub</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 custom-scrollbar overflow-y-auto">
          {tenantNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none"
                    : "text-gray-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                <span className="font-bold">{item.name}</span>
                {isActive && (
                  <motion.div layoutId="tActive" className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-inner" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 dark:shadow-none mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm">Need Help?</div>
            </div>
            <p className="text-[10px] opacity-80 font-medium mb-4 leading-relaxed">
              Contact property management for any issues or emergencies.
            </p>
            <Button size="sm" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold py-5 shadow-inner">
              Help Center
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black truncate">{tenantName}</div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Resident</div>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl h-12"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-bold text-sm text-red-500">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-white/30 dark:bg-gray-950/30 backdrop-blur-sm border-b border-gray-100 dark:border-gray-900">
           <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight leading-none mb-1">Welcome Back, {tenantName.split(' ')[0]}!</h1>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Dashboard Overview</p>
           </div>
           <div className="flex items-center gap-4">
              <Button variant="outline" className="rounded-xl font-bold gap-2">
                <LifeBuoy className="w-4 h-4" />
                Emergency Help
              </Button>
           </div>
        </header>

        <main className="content-scroll-area p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
