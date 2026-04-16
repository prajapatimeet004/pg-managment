import { lazy } from "react";
import { createBrowserRouter } from "react-router";

// Layouts
const MainLayout = lazy(() => import("./components/layouts/MainLayout").then(m => ({ default: m.MainLayout })));

// Pages
const Dashboard = lazy(() => import("./components/pages/Dashboard/Dashboard").then(m => ({ default: m.Dashboard })));
const Properties = lazy(() => import("./components/pages/Properties/Properties").then(m => ({ default: m.Properties })));
const Tenants = lazy(() => import("./components/pages/Tenants/Tenants").then(m => ({ default: m.Tenants })));
const Rooms = lazy(() => import("./components/pages/Rooms/Rooms").then(m => ({ default: m.Rooms })));
const RentCollection = lazy(() => import("./components/pages/RentCollection/RentCollection").then(m => ({ default: m.RentCollection })));
const Complaints = lazy(() => import("./components/pages/Complaints/Complaints").then(m => ({ default: m.Complaints })));
const Notices = lazy(() => import("./components/pages/Notices/Notices").then(m => ({ default: m.Notices })));
const Reports = lazy(() => import("./components/pages/Reports/Reports").then(m => ({ default: m.Reports })));
const Staff = lazy(() => import("./components/pages/Staff/Staff").then(m => ({ default: m.Staff })));
const AIAssistant = lazy(() => import("./components/pages/AIAssistant/AIAssistant").then(m => ({ default: m.AIAssistant })));
const Login = lazy(() => import("./components/pages/Login/Login").then(m => ({ default: m.Login })));
const PropertyDetails = lazy(() => import("./components/pages/Properties/PropertyDetails").then(m => ({ default: m.PropertyDetails })));

// Tenant Portal Pages
const TenantLayout = lazy(() => import("./components/layouts/TenantLayout").then(m => ({ default: m.TenantLayout })));
const TenantDashboard = lazy(() => import("./components/pages/TenantDashboard/TenantDashboard").then(m => ({ default: m.TenantDashboard })));
const TenantComplaints = lazy(() => import("./components/pages/TenantComplaints/TenantComplaints").then(m => ({ default: m.TenantComplaints })));
const TenantNotices = lazy(() => import("./components/pages/TenantNotices/TenantNotices").then(m => ({ default: m.TenantNotices })));
const TenantRent = lazy(() => import("./components/pages/TenantRent/TenantRent").then(m => ({ default: m.TenantRent })));

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "properties", Component: Properties },
      { path: "properties/:id", Component: PropertyDetails },
      { path: "tenants", Component: Tenants },
      { path: "rooms", Component: Rooms },
      { path: "rent", Component: RentCollection },
      { path: "complaints", Component: Complaints },
      { path: "notices", Component: Notices },
      { path: "reports", Component: Reports },
      { path: "staff", Component: Staff },
      { path: "ai-assistant", Component: AIAssistant },
    ],
  },
  {
    path: "/tenant/login",
    Component: Login,
  },
  {
    path: "/tenant",
    Component: TenantLayout,
    children: [
      { index: true, Component: TenantDashboard },
      { path: "rent", Component: TenantRent },
      { path: "complaints", Component: TenantComplaints },
      { path: "notices", Component: TenantNotices },
    ]
  },
]);
