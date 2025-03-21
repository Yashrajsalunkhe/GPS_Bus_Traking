import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bus, Payment } from "@shared/schema";
import BusMap from "@/components/bus-tracker/bus-map";
import BusInfoPanel from "@/components/bus-tracker/bus-info-panel";
import Sidebar from "@/components/bus-tracker/sidebar";
import MobileNav from "@/components/bus-tracker/mobile-nav";
import Loading from "@/components/shared/loading";
import Error from "@/components/shared/error";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Calendar, Clock, CreditCard, MapPin, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showBusInfo, setShowBusInfo] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localBuses, setLocalBuses] = useState<Bus[]>([]);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch buses
  const { 
    data: buses, 
    isLoading: isLoadingBuses, 
    error: busesError
  } = useQuery<Bus[]>({
    queryKey: ["/api/buses"],
    refetchInterval: 15000, // Refresh data every 15 seconds
  });
  
  // Fetch pending payments
  const {
    data: pendingPayments,
    isLoading: isLoadingPayments,
    error: paymentsError
  } = useQuery<Payment[]>({
    queryKey: ["/api/payments/pending"],
    enabled: !!user, // Only fetch if user is logged in
  });
  
  // Update local buses with server data when it changes
  useEffect(() => {
    if (buses) {
      setLocalBuses(buses);
    }
  }, [buses]);
  
  // Simulate real-time movement of buses
  const updateBusLocations = useCallback(() => {
    if (!localBuses || localBuses.length === 0) return;
    
    setLocalBuses(prevBuses => 
      prevBuses.map(bus => {
        // Create random movement patterns based on bus status and speed
        const speed = bus.speed || 20; // km/h
        const moveDistance = speed / 3600 * 2; // Convert to degrees per second approx
        
        // Random direction with slight bias to continue current direction
        const direction = Math.random() * 2 * Math.PI;
        const location = bus.location as { lat: number, lng: number };
        
        // Apply movement based on speed and direction
        return {
          ...bus,
          location: {
            lat: location.lat + moveDistance * Math.sin(direction) * 0.01,
            lng: location.lng + moveDistance * Math.cos(direction) * 0.01
          }
        };
      })
    );
  }, [localBuses]);
  
  // Set up periodic location updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateBusLocations();
    }, 2000); // Update every 2 seconds
    
    return () => clearInterval(intervalId);
  }, [updateBusLocations]);

  const handleBusSelect = (bus: Bus) => {
    setSelectedBus(bus);
    setShowBusInfo(true);
  };

  const handleCloseBusInfo = () => {
    setShowBusInfo(false);
    setSelectedBus(null);
  };

  const handleSetAlert = () => {
    if (selectedBus) {
      toast({
        title: "Alert Set",
        description: `You will be notified when Bus ${selectedBus.busNumber} arrives at the next stop.`,
      });
    }
  };

  if (isLoadingBuses && !buses) {
    return <Loading />;
  }

  if (busesError) {
    return <Error message={(busesError as Error).message} />;
  }

  // Calculate nearest buses and estimated arrival times
  const getNearestBuses = () => {
    if (!buses || buses.length === 0) return [];
    
    // Sort buses by distance from user (simulated)
    return buses
      .filter(bus => bus.status !== "out-of-service")
      .slice(0, 3)
      .map(bus => ({
        ...bus,
        eta: Math.floor(Math.random() * 20) + 1 // Simulated ETA in minutes
      }));
  };
  
  const nearestBuses = getNearestBuses();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar 
        user={user} 
        activePage={activePage}
        setActivePage={setActivePage}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
          <div className="flex items-center">
            <i className="fas fa-bus text-primary text-xl mr-2"></i>
            <span className="text-lg font-bold text-gray-800">Bus Tracker</span>
          </div>
          <button 
            className="text-gray-500 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div 
              className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <i className="fas fa-bus text-primary text-xl mr-2"></i>
                  <span className="text-lg font-bold text-gray-800">Bus Tracker</span>
                </div>
                <button 
                  className="text-gray-500 focus:outline-none"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <nav className="mt-5">
                <a 
                  href="#" 
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${activePage === "dashboard" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
                  onClick={() => {
                    setActivePage("dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <svg className={`mr-3 h-5 w-5 ${activePage === "dashboard" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Dashboard
                </a>
                
                <a 
                  href="#" 
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${activePage === "map" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
                  onClick={() => {
                    setActivePage("map");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <svg className={`mr-3 h-5 w-5 ${activePage === "map" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Live Tracking
                </a>
                
                <a 
                  href="#" 
                  className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activePage === "routes" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
                  onClick={() => {
                    setActivePage("routes");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <svg className={`mr-3 h-5 w-5 ${activePage === "routes" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                  </svg>
                  Routes & Schedules
                </a>
                
                <a 
                  href="#" 
                  className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activePage === "payments" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
                  onClick={() => {
                    setActivePage("payments");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <svg className={`mr-3 h-5 w-5 ${activePage === "payments" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1zm5-1a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Payments
                </a>
                
                <a 
                  href="#" 
                  className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activePage === "notifications" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
                  onClick={() => {
                    setActivePage("notifications");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <svg className={`mr-3 h-5 w-5 ${activePage === "notifications" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  Notifications
                </a>
              </nav>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
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
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {activePage === "dashboard" && (
            <div className="max-w-7xl mx-auto">
              <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
                <p className="text-gray-500">Here's your bus transportation overview</p>
              </header>
              
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="routes">My Routes</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Active Buses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {buses?.filter(bus => bus.status !== "out-of-service").length || 0}
                          <span className="text-sm font-normal text-gray-500 ml-2">of {buses?.length || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Pending Payments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${pendingPayments?.reduce((sum, payment) => sum + payment.amount, 0) / 100 || 0}
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            ({pendingPayments?.length || 0} {pendingPayments?.length === 1 ? 'payment' : 'payments'})
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Next Bus</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {nearestBuses.length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold">{nearestBuses[0].busNumber}</span>
                            <Badge variant={nearestBuses[0].status === "on-time" ? "default" : "destructive"}>
                              {nearestBuses[0].status === "on-time" ? "On Time" : "Delayed"}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {nearestBuses[0].eta} min
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-500">No buses available</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Map Section */}
                  <Card className="overflow-hidden border border-gray-200">
                    <CardHeader className="pb-0">
                      <div className="flex justify-between items-center">
                        <CardTitle>Live Bus Map</CardTitle>
                        <Button 
                          variant="link" 
                          className="text-primary p-0 h-auto"
                          onClick={() => setActivePage("map")}
                        >
                          Full View <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[300px] relative">
                        <BusMap 
                          buses={localBuses} 
                          selectedBus={selectedBus}
                          onBusSelect={handleBusSelect}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Nearest Buses */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Nearest Buses</CardTitle>
                      <CardDescription>Live updates of buses arriving soon</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {nearestBuses.map(bus => (
                          <div key={bus.id} className="flex items-center justify-between border-b border-gray-100 last:border-0 py-2">
                            <div className="flex items-center space-x-4">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center 
                                ${bus.status === "on-time" ? "bg-green-100 text-green-600" : 
                                  bus.status === "delayed" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M8 6v12M4 16h16M4 16c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2M9 4h6M2 12h20M10 20h4M10 16v4M14 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium">Bus {bus.busNumber}</div>
                                <div className="text-sm text-gray-500">{bus.route}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={bus.status === "on-time" ? "outline" : "destructive"} className="capitalize">
                                {bus.status}
                              </Badge>
                              <div className="text-sm font-medium">
                                <Clock className="h-4 w-4 inline mr-1 text-gray-400" />
                                {bus.eta} min
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => handleBusSelect(bus)}>
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {nearestBuses.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
                            <AlertCircle className="h-10 w-10 mb-2 text-gray-400" />
                            <p>No active buses found at this time</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => setActivePage("routes")}>
                        View All Routes & Schedules
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Pending Payments */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Payments</CardTitle>
                      <CardDescription>Your upcoming bus fee payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPayments ? (
                        <div className="py-4 text-center">
                          <Loading />
                        </div>
                      ) : paymentsError ? (
                        <div className="py-4 text-center text-gray-500">
                          <AlertCircle className="h-10 w-10 mb-2 mx-auto text-gray-400" />
                          <p>Failed to load payments</p>
                        </div>
                      ) : pendingPayments && pendingPayments.length > 0 ? (
                        <div className="space-y-2">
                          {pendingPayments.slice(0, 3).map(payment => (
                            <div key={payment.id} className="flex items-center justify-between border-b border-gray-100 last:border-0 py-2">
                              <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium">{payment.description}</div>
                                  <div className="text-sm text-gray-500">Due: {new Date(payment.dueDate).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="font-medium">${payment.amount / 100}</div>
                                <Button size="sm" variant="default">Pay Now</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
                          <CheckCircle className="h-10 w-10 mb-2 text-green-500" />
                          <p>You have no pending payments</p>
                        </div>
                      )}
                    </CardContent>
                    {pendingPayments && pendingPayments.length > 0 && (
                      <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => setActivePage("payments")}>
                          View All Payments
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="routes">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Routes</CardTitle>
                      <CardDescription>Your saved routes and frequent stops</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                        <MapPin className="h-10 w-10 mb-2 text-gray-400" />
                        <p className="mb-2">You haven't saved any routes yet</p>
                        <Button variant="outline" onClick={() => setActivePage("routes")}>
                          Browse Routes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="payments">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>View your recent and upcoming payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPayments ? (
                        <div className="py-4 text-center">
                          <Loading />
                        </div>
                      ) : paymentsError ? (
                        <div className="py-4 text-center text-gray-500">
                          <AlertCircle className="h-10 w-10 mb-2 mx-auto text-gray-400" />
                          <p>Failed to load payments</p>
                        </div>
                      ) : pendingPayments && pendingPayments.length > 0 ? (
                        <div className="space-y-4">
                          {pendingPayments.map(payment => (
                            <div key={payment.id} className="flex items-center justify-between border-b border-gray-100 last:border-0 py-2">
                              <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium">{payment.description}</div>
                                  <div className="text-sm text-gray-500">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Due: {new Date(payment.dueDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="font-medium">${payment.amount / 100}</div>
                                <Badge variant="outline" className="mt-1">
                                  {payment.category === "bus_fee" ? "Bus Fee" : 
                                    payment.category === "registration_fee" ? "Registration" : "Other"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
                          <CheckCircle className="h-10 w-10 mb-2 text-green-500" />
                          <p>You have no pending payments</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {activePage === "map" && (
            <div className="h-full flex flex-col overflow-hidden -m-4">
              <BusMap 
                buses={localBuses} 
                selectedBus={selectedBus}
                onBusSelect={handleBusSelect}
              />
              
              {showBusInfo && selectedBus && (
                <BusInfoPanel
                  bus={selectedBus}
                  onClose={handleCloseBusInfo}
                  onSetAlert={handleSetAlert}
                />
              )}
            </div>
          )}
          
          {activePage === "routes" && (
            <div className="max-w-4xl mx-auto">
              <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Routes & Schedules</h1>
                <p className="text-gray-500">Browse all available bus routes</p>
              </header>
              
              <div className="space-y-4">
                {buses && buses.length > 0 ? (
                  [...new Set(buses.map(bus => bus.route))].map(routeName => (
                    <Card key={routeName} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle>{routeName}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {buses.filter(bus => bus.route === routeName).map(bus => (
                            <div key={bus.id} className="flex items-center justify-between p-4">
                              <div className="flex items-center space-x-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center 
                                  ${bus.status === "on-time" ? "bg-green-100 text-green-600" : 
                                    bus.status === "delayed" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                                  <span className="font-medium">{bus.busNumber}</span>
                                </div>
                                <div>
                                  <div className="font-medium">Bus {bus.busNumber}</div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Badge variant={bus.status === "on-time" ? "outline" : "destructive"} className="mr-2 capitalize">
                                      {bus.status}
                                    </Badge>
                                    <span>Capacity: {bus.currentCapacity}/{bus.capacity}</span>
                                  </div>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => {
                                setSelectedBus(bus);
                                setShowBusInfo(true);
                                setActivePage("map");
                              }}>
                                Track
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                    <AlertCircle className="h-10 w-10 mb-2 text-gray-400" />
                    <p>No routes available at this time</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activePage === "payments" && (
            <div className="max-w-4xl mx-auto">
              <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Payment Management</h1>
                <p className="text-gray-500">Manage your bus transportation payments</p>
              </header>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="text-sm font-medium text-gray-500 mb-1">Due This Month</div>
                        <div className="text-2xl font-bold">
                          ${pendingPayments?.filter(p => new Date(p.dueDate).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.amount, 0) / 100 || 0}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="text-sm font-medium text-gray-500 mb-1">Paid This Semester</div>
                        <div className="text-2xl font-bold">
                          $0.00
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="text-sm font-medium text-gray-500 mb-1">Payment Status</div>
                        <div className="text-lg font-medium text-green-600">
                          Good Standing
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Payments</CardTitle>
                    <CardDescription>Upcoming payments requiring your attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPayments ? (
                      <div className="py-4 text-center">
                        <Loading />
                      </div>
                    ) : paymentsError ? (
                      <div className="py-4 text-center text-gray-500">
                        <AlertCircle className="h-10 w-10 mb-2 mx-auto text-gray-400" />
                        <p>Failed to load payments</p>
                      </div>
                    ) : pendingPayments && pendingPayments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <th className="px-6 py-3">Description</th>
                              <th className="px-6 py-3">Category</th>
                              <th className="px-6 py-3">Due Date</th>
                              <th className="px-6 py-3">Amount</th>
                              <th className="px-6 py-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {pendingPayments.map(payment => (
                              <tr key={payment.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {payment.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                  {payment.category.replace('_', ' ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(payment.dueDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  ${payment.amount / 100}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Button size="sm">Pay Now</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
                        <CheckCircle className="h-10 w-10 mb-2 text-green-500" />
                        <p>You have no pending payments</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Record of your previous payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
                      <Calendar className="h-10 w-10 mb-2 text-gray-400" />
                      <p>No payment history found</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {activePage === "notifications" && (
            <div className="max-w-4xl mx-auto">
              <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Notifications</h1>
                <p className="text-gray-500">Your alerts and notifications</p>
              </header>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
                    <Bell className="h-10 w-10 mb-2 text-gray-400" />
                    <p>You have no notifications</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        
        {/* Mobile Navigation */}
        <MobileNav activePage={activePage} setActivePage={setActivePage} />
      </div>
    </div>
  );
}
