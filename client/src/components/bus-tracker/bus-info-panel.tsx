import React from "react";
import { Bus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X, Bus as BusIcon, Bell, Star, Route } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BusInfoPanelProps {
  bus: Bus;
  onClose: () => void;
  onSetAlert: () => void;
}

// Calculate estimated arrival time based on bus data
const calculateETA = (bus: Bus, stopDistance: number): number => {
  // This is a simplified ETA calculation
  // In a real app, this would use distance, current speed, and traffic data
  const speedKmh = bus.speed || 20; // Default to 20 km/h if speed is 0 or undefined
  const speedMps = speedKmh * 1000 / 3600; // Convert to meters per second
  const timeSeconds = stopDistance / speedMps;
  return Math.round(timeSeconds / 60); // Return minutes
};

const BusInfoPanel: React.FC<BusInfoPanelProps> = ({ bus, onClose, onSetAlert }) => {
  const statusColor = bus.status === "on-time" 
    ? "bg-green-100 text-green-800" 
    : bus.status === "delayed" 
      ? "bg-amber-100 text-amber-800" 
      : "bg-red-100 text-red-800";
  
  const statusText = bus.status === "on-time" 
    ? "On Time" 
    : bus.status === "delayed" 
      ? "Delayed" 
      : "Out of Service";

  // Sample ETA data - in a real app this would come from the backend
  const nextStops = [
    { name: "Science Building", distance: 900, eta: calculateETA(bus, 900), progress: 65 },
    { name: "Library", distance: 2100, eta: calculateETA(bus, 2100), progress: 30 },
    { name: "Dormitories", distance: 3600, eta: calculateETA(bus, 3600), progress: 10 },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg transform transition-transform duration-300 ease-in-out" style={{ height: "35%" }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full ${bus.status === "on-time" ? "bg-green-500" : bus.status === "delayed" ? "bg-amber-500" : "bg-red-500"} text-white flex items-center justify-center`}>
              <BusIcon className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-800">Bus {bus.busNumber}</h3>
              <p className="text-sm text-gray-500">Route: {bus.route}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              <span className={`flex-shrink-0 h-2 w-2 rounded-full ${bus.status === "on-time" ? "bg-green-600" : bus.status === "delayed" ? "bg-amber-600" : "bg-red-600"} mr-1.5`}></span>
              {statusText}
            </span>
            <button 
              className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none" 
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Current Information</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Driver:</span>
                  <span className="text-sm font-medium text-gray-700">Michael Johnson</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Capacity:</span>
                  <span className="text-sm font-medium text-gray-700">{bus.currentCapacity}/{bus.capacity} seats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Speed:</span>
                  <span className="text-sm font-medium text-gray-700">{bus.speed} mph</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Stop:</span>
                  <span className="text-sm font-medium text-gray-700">{bus.lastStop || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-4 h-full">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Estimated Arrival</h4>
              
              <div className="space-y-3">
                {nextStops.map((stop, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{stop.name}</span>
                      <span className={`text-sm font-bold ${index === 0 ? "text-primary" : "text-gray-700"}`}>
                        {stop.eta} min
                      </span>
                    </div>
                    <Progress value={stop.progress} className="h-1.5 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={onSetAlert}
          >
            <Bell className="mr-2 h-4 w-4 text-amber-500" />
            Set Alert
          </Button>
          <Button variant="outline" className="flex items-center">
            <Star className="mr-2 h-4 w-4 text-amber-500" />
            Favorite
          </Button>
          <Button variant="default" className="flex items-center">
            <Route className="mr-2 h-4 w-4" />
            View Route
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusInfoPanel;
