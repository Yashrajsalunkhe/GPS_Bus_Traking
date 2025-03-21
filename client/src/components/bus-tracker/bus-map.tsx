import { useState, useEffect, useRef } from "react";
import { Bus } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, Minus, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BusMapProps {
  buses: Bus[];
  selectedBus: Bus | null;
  onBusSelect: (bus: Bus) => void;
}

const BusMap: React.FC<BusMapProps> = ({ buses, selectedBus, onBusSelect }) => {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  
  // Initialize the map
  useEffect(() => {
    if (!mapContainerRef.current || mapInitialized) return;

    const initMap = async () => {
      try {
        const L = (window as any).L;
        if (!L) {
          console.error("Leaflet not loaded");
          return;
        }

        // Create the map instance
        const map = L.map(mapContainerRef.current).setView([34.0522, -118.2437], 14);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        setMapInstance(map);
        setMapInitialized(true);
      } catch (error) {
        console.error("Error initializing map:", error);
        toast({
          title: "Map Error",
          description: "Failed to initialize the map. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [mapContainerRef, mapInitialized, toast]);

  // Store previous bus locations for smooth transitions
  const prevBusLocations = useRef<Map<number, {lat: number, lng: number}>>(new Map());
  
  // Update bus markers when buses data changes
  useEffect(() => {
    if (!mapInitialized || !mapInstance) return;
    
    // Map to store new markers
    const newMarkers: any[] = [];
    const currentMarkerMap = new Map<number, any>();
    
    // First, find existing markers and update their positions with animation
    buses.forEach(bus => {
      const { lat, lng } = bus.location as { lat: number, lng: number };
      
      // Skip if invalid location
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return;
      }
      
      const existingMarker = markers.find(m => m.busId === bus.id);
      const prevLocation = prevBusLocations.current.get(bus.id);
      
      // Create icon based on bus status
      const iconColor = bus.status === "on-time" ? "#10B981" : bus.status === "delayed" ? "#F59E0B" : "#EF4444";
      
      const busIcon = (window as any).L.divIcon({
        html: `
          <div class="bus-marker">
            <div class="h-12 w-12 rounded-full bg-[${iconColor}] text-white flex items-center justify-center shadow-lg relative overflow-visible animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 6v12M4 16h16M4 16c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2M9 4h6M2 12h20M10 20h4M10 16v4M14 16v4"></path>
              </svg>
              ${bus.status === "on-time" ? '<div class="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>' : ''}
            </div>
            <div class="bg-white rounded-md py-1 px-2 shadow-md text-xs font-medium mt-1 text-center border border-gray-200">
              <span class="font-bold">Bus ${bus.busNumber}</span>
              ${bus.speed ? `<span class="text-xs text-gray-500 ml-1">${bus.speed} km/h</span>` : ''}
            </div>
          </div>
        `,
        className: 'bus-custom-icon',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      
      let marker;
      
      if (existingMarker) {
        // Update existing marker
        existingMarker.setIcon(busIcon);
        
        // Animate position change if previous location exists
        if (prevLocation && (prevLocation.lat !== lat || prevLocation.lng !== lng)) {
          existingMarker.setLatLng([lat, lng]);
        } else {
          existingMarker.setLatLng([lat, lng]);
        }
        
        // Update reference
        marker = existingMarker;
      } else {
        // Create new marker
        marker = (window as any).L.marker([lat, lng], { icon: busIcon })
          .addTo(mapInstance)
          .on('click', () => onBusSelect(bus));
      }
      
      // Store bus ID with marker for later reference
      marker.busId = bus.id;
      
      // Highlight selected bus
      if (selectedBus && selectedBus.id === bus.id) {
        marker.setZIndexOffset(1000); // Bring to front
      }
      
      // Store current location for next update
      prevBusLocations.current.set(bus.id, { lat, lng });
      
      // Add to new markers list
      newMarkers.push(marker);
      currentMarkerMap.set(bus.id, marker);
    });
    
    // Remove any markers that don't have corresponding buses in the current data
    markers.forEach(marker => {
      if (!currentMarkerMap.has(marker.busId)) {
        marker.remove();
      }
    });
    
    // Store references to the markers without triggering a re-render
    // This fixes the infinite update loop by not using setMarkers
    markers.length = 0;
    newMarkers.forEach(marker => markers.push(marker));
  }, [buses, mapInitialized, mapInstance, selectedBus, onBusSelect]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter buses by number or route
    const filteredBus = buses.find(bus => 
      bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bus.route.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredBus) {
      // Center map on found bus
      if (mapInstance) {
        const { lat, lng } = filteredBus.location as { lat: number, lng: number };
        mapInstance.setView([lat, lng], 16);
      }
      onBusSelect(filteredBus);
    } else {
      toast({
        title: "No results",
        description: `No bus found matching "${searchTerm}"`,
      });
    }
  };

  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom() - 1);
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation && mapInstance) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.setView([latitude, longitude], 16);
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to access your location. Please check your browser settings.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 relative">
      {/* Map Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex">
        <div className="w-full max-w-xl mx-auto flex">
          <form onSubmit={handleSearch} className="relative flex-grow">
            <Input 
              type="text" 
              placeholder="Search for a bus or route..." 
              className="w-full pl-10 pr-3 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </form>
          <Button className="ml-2" variant="default">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Map View */}
      <div 
        ref={mapContainerRef} 
        className="h-full w-full bg-gray-200"
      >
        {/* Map will be rendered here by Leaflet */}
      </div>
      
      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button 
          className="h-10 w-10 rounded-md bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 p-0"
          variant="outline"
          onClick={handleZoomIn}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button 
          className="h-10 w-10 rounded-md bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 p-0"
          variant="outline"
          onClick={handleZoomOut}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <Button 
          className="h-10 w-10 rounded-md bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 p-0"
          variant="outline"
          onClick={handleLocate}
        >
          <Compass className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default BusMap;
