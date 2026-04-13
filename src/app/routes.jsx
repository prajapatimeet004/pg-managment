import { createBrowserRouter } from "react-router";
import { MainLayout } from "./components/layouts/MainLayout";
import { Dashboard } from "./components/pages/Dashboard";
import { Properties } from "./components/pages/Properties";
import { Tenants } from "./components/pages/Tenants";
import { Rooms } from "./components/pages/Rooms";
import { RentCollection } from "./components/pages/RentCollection";
import { Complaints } from "./components/pages/Complaints";
import { Notices } from "./components/pages/Notices";
import { Reports } from "./components/pages/Reports";
import { AIAssistant } from "./components/pages/AIAssistant";
import { Login } from "./components/pages/Login";

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
      { path: "tenants", Component: Tenants },
      { path: "rooms", Component: Rooms },
      { path: "rent", Component: RentCollection },
      { path: "complaints", Component: Complaints },
      { path: "notices", Component: Notices },
      { path: "reports", Component: Reports },
      { path: "ai-assistant", Component: AIAssistant },
    ],
  },
]);
