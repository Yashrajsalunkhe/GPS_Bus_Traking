import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bus, Driver, Route as BusRoute } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/shared/loading";
import Error from "@/components/shared/error";
import { useLocation } from "wouter";

// Form schema for creating/updating a bus
const busFormSchema = z.object({
  busNumber: z.string().min(1, "Bus number is required"),
  route: z.string().min(1, "Route is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  currentCapacity: z.coerce.number().min(0, "Current capacity cannot be negative"),
  driverId: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
});

type BusFormValues = z.infer<typeof busFormSchema>;

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("buses");
  const [isAddBusDialogOpen, setIsAddBusDialogOpen] = useState(false);

  // Redirect if not admin
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  // Fetch data
  const { 
    data: buses, 
    isLoading: busesLoading, 
    error: busesError 
  } = useQuery<Bus[]>({
    queryKey: ["/api/buses"],
  });

  const { 
    data: drivers, 
    isLoading: driversLoading, 
    error: driversError 
  } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { 
    data: routes, 
    isLoading: routesLoading, 
    error: routesError 
  } = useQuery<BusRoute[]>({
    queryKey: ["/api/routes"],
  });

  // Bus form
  const busForm = useForm<BusFormValues>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      busNumber: "",
      route: "",
      capacity: 40,
      currentCapacity: 0,
      isActive: true,
    },
  });

  // Create bus mutation
  const createBusMutation = useMutation({
    mutationFn: async (data: BusFormValues) => {
      // Add location data (would be from GPS in real app)
      const busData = {
        ...data,
        location: { lat: 34.0522, lng: -118.2437 },
        status: "on-time",
        speed: 0,
        lastStop: null,
      };
      const res = await apiRequest("POST", "/api/buses", busData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buses"] });
      setIsAddBusDialogOpen(false);
      busForm.reset();
      toast({
        title: "Bus created",
        description: "New bus has been successfully added to the system.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating bus",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBus = (data: BusFormValues) => {
    createBusMutation.mutate(data);
  };

  // Loading states
  if (busesLoading || driversLoading || routesLoading) {
    return <Loading />;
  }

  // Error states
  if (busesError || driversError || routesError) {
    const errorMessage = busesError || driversError || routesError;
    return <Error message={(errorMessage as Error).message} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-lg font-bold text-gray-800 ml-2">Admin Dashboard</span>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          <nav className="mt-5 px-3">
            <a 
              href="#" 
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === "buses" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
              onClick={() => setActiveTab("buses")}
            >
              <svg className={`mr-3 h-5 w-5 ${activeTab === "buses" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 16H6V8H2L10 0L18 8H14V16H12V11H8V16Z" />
              </svg>
              Manage Buses
            </a>
            
            <a 
              href="#" 
              className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activeTab === "routes" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
              onClick={() => setActiveTab("routes")}
            >
              <svg className={`mr-3 h-5 w-5 ${activeTab === "routes" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 1.586l-4 4V18.75h8v-12A.75.75 0 0015.25 6h-1.5A.75.75 0 0013 6.75v10H9V8L5 4l1.5-1.5L10 6l3.5-3.5L15 4l-3 3z" clipRule="evenodd" />
              </svg>
              Routes & Stops
            </a>
            
            <a 
              href="#" 
              className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activeTab === "drivers" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
              onClick={() => setActiveTab("drivers")}
            >
              <svg className={`mr-3 h-5 w-5 ${activeTab === "drivers" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              Manage Drivers
            </a>
            
            <a 
              href="#" 
              className={`group flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md ${activeTab === "users" ? "text-primary bg-blue-50" : "text-gray-700 hover:text-primary hover:bg-blue-50"}`}
              onClick={() => setActiveTab("users")}
            >
              <svg className={`mr-3 h-5 w-5 ${activeTab === "users" ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Manage Users
            </a>
          </nav>
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {user?.fullName?.charAt(0) || "A"}
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
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-lg font-bold text-gray-800 ml-2">Admin Dashboard</span>
          </div>
          <button className="text-gray-500 focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header with Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 16H6V8H2L10 0L18 8H14V16H12V11H8V16Z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Buses</p>
                      <p className="text-2xl font-semibold text-gray-900">{buses?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 1.586l-4 4V18.75h8v-12A.75.75 0 0015.25 6h-1.5A.75.75 0 0013 6.75v10H9V8L5 4l1.5-1.5L10 6l3.5-3.5L15 4l-3 3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Routes</p>
                      <p className="text-2xl font-semibold text-gray-900">{routes?.filter(r => r.isActive).length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Drivers</p>
                      <p className="text-2xl font-semibold text-gray-900">{drivers?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Delayed Buses</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {buses?.filter(b => b.status === "delayed").length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                <TabsTrigger value="buses">Buses</TabsTrigger>
                <TabsTrigger value="routes">Routes</TabsTrigger>
                <TabsTrigger value="drivers">Drivers</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>
              
              <TabsContent value="buses" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Manage Buses</h2>
                  <Dialog open={isAddBusDialogOpen} onOpenChange={setIsAddBusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add New Bus
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Bus</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new bus below.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...busForm}>
                        <form onSubmit={busForm.handleSubmit(handleCreateBus)} className="space-y-4">
                          <FormField
                            control={busForm.control}
                            name="busNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bus Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 101" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={busForm.control}
                            name="route"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Route</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a route" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {routes?.map(route => (
                                      <SelectItem key={route.id} value={route.name}>
                                        {route.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={busForm.control}
                              name="capacity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Total Capacity</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={busForm.control}
                              name="currentCapacity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Capacity</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={busForm.control}
                            name="driverId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Driver</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  value={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Assign a driver" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {drivers?.map(driver => (
                                      <SelectItem key={driver.id} value={driver.id.toString()}>
                                        {driver.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={busForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Active Status</FormLabel>
                                  <FormDescription>
                                    Set whether this bus is currently active in the system
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="submit" disabled={createBusMutation.isPending}>
                              {createBusMutation.isPending ? "Creating..." : "Create Bus"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bus #</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buses?.map(bus => {
                          const driver = drivers?.find(d => d.id === bus.driverId);
                          return (
                            <TableRow key={bus.id}>
                              <TableCell className="font-medium">{bus.busNumber}</TableCell>
                              <TableCell>{bus.route}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    bus.status === "on-time" 
                                      ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                      : bus.status === "delayed" 
                                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100" 
                                        : "bg-red-100 text-red-800 hover:bg-red-100"
                                  }
                                >
                                  {bus.status === "on-time" ? "On Time" : bus.status === "delayed" ? "Delayed" : "Out of Service"}
                                </Badge>
                              </TableCell>
                              <TableCell>{driver?.name || "Unassigned"}</TableCell>
                              <TableCell>{`${bus.currentCapacity}/${bus.capacity}`}</TableCell>
                              <TableCell>
                                {bus.isActive ? (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                    Inactive
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="routes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Manage Routes & Stops</h2>
                  <Button>
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Route
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Stops</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routes?.map(route => (
                          <TableRow key={route.id}>
                            <TableCell className="font-medium">{route.name}</TableCell>
                            <TableCell>{route.description}</TableCell>
                            <TableCell>{route.stops.length} stops</TableCell>
                            <TableCell>
                              {route.isActive ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="drivers" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Manage Drivers</h2>
                  <Button>
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Driver
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assigned Bus</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drivers?.map(driver => {
                          const assignedBus = buses?.find(b => b.driverId === driver.id);
                          return (
                            <TableRow key={driver.id}>
                              <TableCell className="font-medium">{driver.name}</TableCell>
                              <TableCell>{driver.contactNumber}</TableCell>
                              <TableCell>
                                {driver.isActive ? (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                    Inactive
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{assignedBus ? `Bus ${assignedBus.busNumber}` : "Unassigned"}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Manage Users</h2>
                  <Button>
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New User
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-500">User management features coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
