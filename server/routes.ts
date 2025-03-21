import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Bus routes
  app.get("/api/buses", async (req, res, next) => {
    try {
      const buses = await storage.getBuses();
      res.json(buses);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/buses/:id", async (req, res, next) => {
    try {
      const busId = parseInt(req.params.id);
      if (isNaN(busId)) {
        return res.status(400).json({ message: "Invalid bus ID" });
      }
      
      const bus = await storage.getBus(busId);
      if (!bus) {
        return res.status(404).json({ message: "Bus not found" });
      }
      
      res.json(bus);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/buses", async (req, res, next) => {
    try {
      // Check if user is an admin
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const bus = await storage.createBus(req.body);
      res.status(201).json(bus);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/buses/:id", async (req, res, next) => {
    try {
      // Check if user is an admin
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const busId = parseInt(req.params.id);
      if (isNaN(busId)) {
        return res.status(400).json({ message: "Invalid bus ID" });
      }
      
      const bus = await storage.updateBus(busId, req.body);
      if (!bus) {
        return res.status(404).json({ message: "Bus not found" });
      }
      
      res.json(bus);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/buses/:id/location", async (req, res, next) => {
    try {
      // Check if user is an admin
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const locationSchema = z.object({
        lat: z.number(),
        lng: z.number(),
        speed: z.number().optional(),
      });
      
      const validation = locationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid location data" });
      }
      
      const busId = parseInt(req.params.id);
      if (isNaN(busId)) {
        return res.status(400).json({ message: "Invalid bus ID" });
      }
      
      const { lat, lng, speed } = validation.data;
      
      const bus = await storage.updateBusLocation(busId, { lat, lng }, speed);
      if (!bus) {
        return res.status(404).json({ message: "Bus not found" });
      }
      
      res.json(bus);
    } catch (error) {
      next(error);
    }
  });
  
  // Route (bus routes) API endpoints
  app.get("/api/routes", async (req, res, next) => {
    try {
      const routes = await storage.getRoutes();
      res.json(routes);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/routes/:id", async (req, res, next) => {
    try {
      const routeId = parseInt(req.params.id);
      if (isNaN(routeId)) {
        return res.status(400).json({ message: "Invalid route ID" });
      }
      
      const route = await storage.getRoute(routeId);
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(route);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/routes", async (req, res, next) => {
    try {
      // Check if user is an admin
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const route = await storage.createRoute(req.body);
      res.status(201).json(route);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/routes/:id", async (req, res, next) => {
    try {
      // Check if user is an admin
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const routeId = parseInt(req.params.id);
      if (isNaN(routeId)) {
        return res.status(400).json({ message: "Invalid route ID" });
      }
      
      const route = await storage.updateRoute(routeId, req.body);
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(route);
    } catch (error) {
      next(error);
    }
  });
  
  // Bus Stops API endpoints
  app.get("/api/bus-stops", async (req, res, next) => {
    try {
      const busStops = await storage.getBusStops();
      res.json(busStops);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/bus-stops/:id", async (req, res, next) => {
    try {
      const busStopId = parseInt(req.params.id);
      if (isNaN(busStopId)) {
        return res.status(400).json({ message: "Invalid bus stop ID" });
      }
      
      const busStop = await storage.getBusStop(busStopId);
      if (!busStop) {
        return res.status(404).json({ message: "Bus stop not found" });
      }
      
      res.json(busStop);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/routes/:id/stops", async (req, res, next) => {
    try {
      const routeId = parseInt(req.params.id);
      if (isNaN(routeId)) {
        return res.status(400).json({ message: "Invalid route ID" });
      }
      
      const busStops = await storage.getBusStopsByRoute(routeId);
      res.json(busStops);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/bus-stops", async (req, res, next) => {
    try {
      // Check if user is an admin
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const busStop = await storage.createBusStop(req.body);
      res.status(201).json(busStop);
    } catch (error) {
      next(error);
    }
  });
  
  // Driver API endpoints
  app.get("/api/drivers", async (req, res, next) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/drivers/:id", async (req, res, next) => {
    try {
      const driverId = parseInt(req.params.id);
      if (isNaN(driverId)) {
        return res.status(400).json({ message: "Invalid driver ID" });
      }
      
      const driver = await storage.getDriver(driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(driver);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/drivers", async (req, res, next) => {
    try {
      // Check if user is an admin
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const driver = await storage.createDriver(req.body);
      res.status(201).json(driver);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/drivers/:id", async (req, res, next) => {
    try {
      // Check if user is an admin
      if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const driverId = parseInt(req.params.id);
      if (isNaN(driverId)) {
        return res.status(400).json({ message: "Invalid driver ID" });
      }
      
      const driver = await storage.updateDriver(driverId, req.body);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(driver);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
