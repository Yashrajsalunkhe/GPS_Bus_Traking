import { users, buses, busStops, routes, drivers, payments } from "@shared/schema";
import type { User, InsertUser, Bus, InsertBus, BusStop, InsertBusStop, Route, InsertRoute, Driver, InsertDriver, Payment, InsertPayment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  verifyEmail(id: number): Promise<User | undefined>;
  setVerificationToken(id: number, token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  
  // Bus operations
  getBuses(): Promise<Bus[]>;
  getBus(id: number): Promise<Bus | undefined>;
  getBusByNumber(busNumber: string): Promise<Bus | undefined>;
  createBus(bus: InsertBus): Promise<Bus>;
  updateBus(id: number, bus: Partial<Bus>): Promise<Bus | undefined>;
  updateBusLocation(id: number, location: { lat: number, lng: number }, speed?: number): Promise<Bus | undefined>;
  
  // Bus Stop operations
  getBusStops(): Promise<BusStop[]>;
  getBusStop(id: number): Promise<BusStop | undefined>;
  getBusStopsByRoute(routeId: number): Promise<BusStop[]>;
  createBusStop(busStop: InsertBusStop): Promise<BusStop>;
  
  // Route operations
  getRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<Route>): Promise<Route | undefined>;
  
  // Driver operations
  getDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<Driver>): Promise<Driver | undefined>;
  
  // Payment operations
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPendingPaymentsByUser(userId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  markPaymentAsPaid(id: number, paymentMethod: string): Promise<Payment | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private buses: Map<number, Bus>;
  private busStops: Map<number, BusStop>;
  private routes: Map<number, Route>;
  private drivers: Map<number, Driver>;
  private payments: Map<number, Payment>;
  
  sessionStore: session.SessionStore;
  
  userId: number;
  busId: number;
  busStopId: number;
  routeId: number;
  driverId: number;
  paymentId: number;

  constructor() {
    this.users = new Map();
    this.buses = new Map();
    this.busStops = new Map();
    this.routes = new Map();
    this.drivers = new Map();
    this.payments = new Map();
    
    this.userId = 1;
    this.busId = 1;
    this.busStopId = 1;
    this.routeId = 1;
    this.driverId = 1;
    this.paymentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Seed with sample data
    this.seedData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user: User = { 
      ...insertUser,
      id,
      isEmailVerified: false,
      verificationToken,
      lastLogin: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async verifyEmail(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      isEmailVerified: true,
      verificationToken: null 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async setVerificationToken(id: number, token: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, verificationToken: token };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token,
    );
  }
  
  // Bus operations
  async getBuses(): Promise<Bus[]> {
    return Array.from(this.buses.values());
  }
  
  async getBus(id: number): Promise<Bus | undefined> {
    return this.buses.get(id);
  }
  
  async getBusByNumber(busNumber: string): Promise<Bus | undefined> {
    return Array.from(this.buses.values()).find(
      (bus) => bus.busNumber === busNumber,
    );
  }
  
  async createBus(insertBus: InsertBus): Promise<Bus> {
    const id = this.busId++;
    const bus: Bus = { ...insertBus, id };
    this.buses.set(id, bus);
    return bus;
  }
  
  async updateBus(id: number, busUpdate: Partial<Bus>): Promise<Bus | undefined> {
    const bus = this.buses.get(id);
    if (!bus) return undefined;
    
    const updatedBus = { ...bus, ...busUpdate };
    this.buses.set(id, updatedBus);
    return updatedBus;
  }
  
  async updateBusLocation(id: number, location: { lat: number, lng: number }, speed?: number): Promise<Bus | undefined> {
    const bus = this.buses.get(id);
    if (!bus) return undefined;
    
    const updatedBus = { 
      ...bus, 
      location,
      ...(speed !== undefined ? { speed } : {})
    };
    
    this.buses.set(id, updatedBus);
    return updatedBus;
  }
  
  // Bus Stop operations
  async getBusStops(): Promise<BusStop[]> {
    return Array.from(this.busStops.values());
  }
  
  async getBusStop(id: number): Promise<BusStop | undefined> {
    return this.busStops.get(id);
  }
  
  async getBusStopsByRoute(routeId: number): Promise<BusStop[]> {
    return Array.from(this.busStops.values()).filter(
      (stop) => stop.routeId === routeId,
    );
  }
  
  async createBusStop(insertBusStop: InsertBusStop): Promise<BusStop> {
    const id = this.busStopId++;
    const busStop: BusStop = { ...insertBusStop, id };
    this.busStops.set(id, busStop);
    return busStop;
  }
  
  // Route operations
  async getRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }
  
  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }
  
  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = this.routeId++;
    const route: Route = { ...insertRoute, id };
    this.routes.set(id, route);
    return route;
  }
  
  async updateRoute(id: number, routeUpdate: Partial<Route>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;
    
    const updatedRoute = { ...route, ...routeUpdate };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }
  
  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }
  
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }
  
  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.driverId++;
    const driver: Driver = { ...insertDriver, id };
    this.drivers.set(id, driver);
    return driver;
  }
  
  async updateDriver(id: number, driverUpdate: Partial<Driver>): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    
    const updatedDriver = { ...driver, ...driverUpdate };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }
  
  // Payment operations
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId,
    );
  }
  
  async getPendingPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId && !payment.isPaid,
    );
  }
  
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentId++;
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      isPaid: false,
      paymentDate: null,
      paymentMethod: null,
      createdAt: new Date() 
    };
    this.payments.set(id, payment);
    return payment;
  }
  
  async updatePayment(id: number, paymentUpdate: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...paymentUpdate };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  async markPaymentAsPaid(id: number, paymentMethod: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { 
      ...payment, 
      isPaid: true,
      paymentDate: new Date(),
      paymentMethod
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  private seedData() {
    // Sample data for demonstration
    // Create routes
    const campusLoopRouteId = this.routeId;
    this.createRoute({
      name: "Campus Loop",
      description: "Main campus loop covering all major buildings",
      stops: [1, 2, 3, 4],
      isActive: true
    });
    
    const dormRouteId = this.routeId;
    this.createRoute({
      name: "Dormitory Route",
      description: "Route connecting all dormitories to central campus",
      stops: [5, 6, 7],
      isActive: true
    });
    
    // Create bus stops
    this.createBusStop({
      name: "Science Building",
      location: { lat: 34.0522, lng: -118.2437 },
      routeId: campusLoopRouteId
    });
    
    this.createBusStop({
      name: "Library",
      location: { lat: 34.0548, lng: -118.2450 },
      routeId: campusLoopRouteId
    });
    
    this.createBusStop({
      name: "Student Center",
      location: { lat: 34.0530, lng: -118.2420 },
      routeId: campusLoopRouteId
    });
    
    this.createBusStop({
      name: "Athletic Complex",
      location: { lat: 34.0510, lng: -118.2400 },
      routeId: campusLoopRouteId
    });
    
    this.createBusStop({
      name: "North Dormitories",
      location: { lat: 34.0560, lng: -118.2440 },
      routeId: dormRouteId
    });
    
    this.createBusStop({
      name: "South Dormitories",
      location: { lat: 34.0500, lng: -118.2460 },
      routeId: dormRouteId
    });
    
    this.createBusStop({
      name: "West Dormitories",
      location: { lat: 34.0525, lng: -118.2480 },
      routeId: dormRouteId
    });
    
    // Create drivers
    const driverId1 = this.driverId;
    this.createDriver({
      name: "Michael Johnson",
      contactNumber: "555-123-4567",
      isActive: true
    });
    
    const driverId2 = this.driverId;
    this.createDriver({
      name: "Sarah Williams",
      contactNumber: "555-987-6543",
      isActive: true
    });
    
    const driverId3 = this.driverId;
    this.createDriver({
      name: "Robert Davis",
      contactNumber: "555-555-5555",
      isActive: true
    });
    
    // Create buses
    this.createBus({
      busNumber: "101",
      route: "Campus Loop",
      status: "on-time",
      capacity: 40,
      currentCapacity: 26,
      location: { lat: 34.0522, lng: -118.2437 },
      speed: 18,
      driverId: driverId1,
      lastStop: "Student Center",
      isActive: true
    });
    
    this.createBus({
      busNumber: "202",
      route: "Dormitory Route",
      status: "delayed",
      capacity: 30,
      currentCapacity: 15,
      location: { lat: 34.0548, lng: -118.2450 },
      speed: 12,
      driverId: driverId2,
      lastStop: "North Dormitories",
      isActive: true
    });
    
    this.createBus({
      busNumber: "303",
      route: "Campus Loop",
      status: "on-time",
      capacity: 40,
      currentCapacity: 32,
      location: { lat: 34.0510, lng: -118.2400 },
      speed: 20,
      driverId: driverId3,
      lastStop: "Athletic Complex",
      isActive: true
    });
  }
}

export const storage = new MemStorage();
