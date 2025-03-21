import React from "react";
import { MapPin, Route as RouteIcon, Bell, User } from "lucide-react";

interface MobileNavProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activePage, setActivePage }) => {
  return (
    <div className="lg:hidden bg-white border-t border-gray-200 flex">
      <a 
        href="#" 
        className={`flex-1 flex flex-col items-center py-3 ${activePage === "map" ? "text-primary" : "text-gray-400 hover:text-primary"}`}
        onClick={() => setActivePage("map")}
      >
        <MapPin className="h-6 w-6" />
        <span className="text-xs mt-1">Map</span>
      </a>
      <a 
        href="#" 
        className={`flex-1 flex flex-col items-center py-3 ${activePage === "routes" ? "text-primary" : "text-gray-400 hover:text-primary"}`}
        onClick={() => setActivePage("routes")}
      >
        <RouteIcon className="h-6 w-6" />
        <span className="text-xs mt-1">Routes</span>
      </a>
      <a 
        href="#" 
        className={`flex-1 flex flex-col items-center py-3 ${activePage === "notifications" ? "text-primary" : "text-gray-400 hover:text-primary"}`}
        onClick={() => setActivePage("notifications")}
      >
        <Bell className="h-6 w-6" />
        <span className="text-xs mt-1">Alerts</span>
      </a>
      <a 
        href="#" 
        className={`flex-1 flex flex-col items-center py-3 ${activePage === "profile" ? "text-primary" : "text-gray-400 hover:text-primary"}`}
        onClick={() => setActivePage("profile")}
      >
        <User className="h-6 w-6" />
        <span className="text-xs mt-1">Profile</span>
      </a>
    </div>
  );
};

export default MobileNav;
