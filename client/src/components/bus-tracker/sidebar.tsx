import React from "react";
import { User } from "@shared/schema";
import { MapPin, Route as RouteIcon, Bell, Settings, BarChart2, Users, Bus, CreditCard, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  user: User | null;
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activePage, setActivePage }) => {
  const { logoutMutation } = useAuth();

  return (
    <div className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16C4 16.6667 4.4 18 6 18C7.6 18 18 18 20 18C20.6667 18 22 17.6 22 16C22 14.4 22 8 22 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 8H4C2.90909 8 2 7.10457 2 6V6C2 4.89543 2.90909 4 4 4H4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 4L9 2H20C21.1046 2 22 2.89543 22 4V4C22 5.10457 21.1046 6 20 6H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M7 12H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M19 12H19.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-lg font-bold text-gray-800 ml-2">Bus Tracker</span>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <nav className="mt-5 px-3">
          <a 
            href="#" 
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${activePage === "dashboard" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
            onClick={() => setActivePage("dashboard")}
            aria-current={activePage === "dashboard" ? "page" : undefined}
          >
            <LayoutDashboard className={`mr-3 h-5 w-5 ${activePage === "dashboard" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
            Dashboard
          </a>
          <a 
            href="#" 
            className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activePage === "map" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
            onClick={() => setActivePage("map")}
          >
            <MapPin className={`mr-3 h-5 w-5 ${activePage === "map" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
            Live Tracking
          </a>
          <a 
            href="#" 
            className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activePage === "routes" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
            onClick={() => setActivePage("routes")}
          >
            <RouteIcon className={`mr-3 h-5 w-5 ${activePage === "routes" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
            Routes & Schedules
          </a>
          <a 
            href="#" 
            className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activePage === "payments" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
            onClick={() => setActivePage("payments")}
          >
            <CreditCard className={`mr-3 h-5 w-5 ${activePage === "payments" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
            Payments
          </a>
          <a 
            href="#" 
            className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activePage === "notifications" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
            onClick={() => setActivePage("notifications")}
          >
            <Bell className={`mr-3 h-5 w-5 ${activePage === "notifications" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
            Notifications
          </a>
          <a 
            href="#" 
            className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activePage === "settings" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
            onClick={() => setActivePage("settings")}
          >
            <Settings className={`mr-3 h-5 w-5 ${activePage === "settings" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
            Settings
          </a>
          
          {/* Admin Only Navigation */}
          {user?.role === "admin" && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin Controls
              </h3>
              <a 
                href="/admin" 
                className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md text-gray-700 hover:text-primary hover:bg-blue-50`}
              >
                <BarChart2 className="mr-3 h-5 w-5 text-gray-400 group-hover:text-primary" />
                Dashboard
              </a>
              <a 
                href="/admin" 
                className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md text-gray-700 hover:text-primary hover:bg-blue-50`}
              >
                <Users className="mr-3 h-5 w-5 text-gray-400 group-hover:text-primary" />
                Manage Users
              </a>
              <a 
                href="/admin" 
                className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md text-gray-700 hover:text-primary hover:bg-blue-50`}
              >
                <Bus className="mr-3 h-5 w-5 text-gray-400 group-hover:text-primary" />
                Manage Buses
              </a>
            </div>
          )}
        </nav>
      </div>
      
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              {user?.fullName?.charAt(0) || "U"}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <button 
            className="ml-auto bg-white rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={() => logoutMutation.mutate()}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
