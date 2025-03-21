import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["student", "parent", "admin"] }).notNull().default("student"),
  urn: text("urn"),  // University Registration Number
  department: text("department"),
  classYear: text("class_year"),
  contactNumber: text("contact_number"),
  address: text("address"),
  isEmailVerified: boolean("is_email_verified").default(false),
  verificationToken: text("verification_token"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  role: true,
  urn: true,
  department: true,
  classYear: true,
  contactNumber: true,
  address: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Bus model
export const buses = pgTable("buses", {
  id: serial("id").primaryKey(),
  busNumber: text("bus_number").notNull().unique(),
  route: text("route").notNull(),
  status: text("status", { enum: ["on-time", "delayed", "out-of-service"] }).notNull().default("on-time"),
  capacity: integer("capacity").notNull(),
  currentCapacity: integer("current_capacity").notNull().default(0),
  location: jsonb("location").notNull(), // { lat: number, lng: number }
  speed: integer("speed").default(0),
  driverId: integer("driver_id"),
  lastStop: text("last_stop"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertBusSchema = createInsertSchema(buses).omit({
  id: true,
});

export type InsertBus = z.infer<typeof insertBusSchema>;
export type Bus = typeof buses.$inferSelect;

// Bus Stop model
export const busStops = pgTable("bus_stops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: jsonb("location").notNull(), // { lat: number, lng: number }
  routeId: integer("route_id").notNull(),
});

export const insertBusStopSchema = createInsertSchema(busStops).omit({
  id: true,
});

export type InsertBusStop = z.infer<typeof insertBusStopSchema>;
export type BusStop = typeof busStops.$inferSelect;

// Route model
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  stops: jsonb("stops").notNull(), // Array of stop ids in order
  isActive: boolean("is_active").notNull().default(true),
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
});

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

// Driver model
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
});

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Payment model
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Amount in cents
  dueDate: date("due_date").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  paymentDate: timestamp("payment_date"),
  paymentMethod: text("payment_method", { enum: ["credit_card", "debit_card", "bank_transfer", "cash"] }),
  description: text("description").notNull(),
  category: text("category", { enum: ["bus_fee", "registration_fee", "other"] }).notNull(),
  semester: text("semester"),
  academicYear: text("academic_year"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  isPaid: true,
  paymentDate: true,
  paymentMethod: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
