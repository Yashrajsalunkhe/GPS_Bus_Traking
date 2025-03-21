import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import nodemailer from "nodemailer";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Setup email transporter for verification emails
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email', // Default to ethereal for development
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Validation schemas
const extendedUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(["student", "parent", "admin"]).default("student"),
  urn: z.string().optional(),
  department: z.string().optional(),
  classYear: z.string().optional(),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
});

async function sendVerificationEmail(user: SelectUser, baseUrl: string) {
  const verificationUrl = `${baseUrl}/verify-email?token=${user.verificationToken}`;
  
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || '"College Bus Tracker" <noreply@collegebustracker.com>',
      to: user.email,
      subject: "Verify your email address",
      text: `Hello ${user.fullName},\n\nPlease verify your email address by clicking on the link below:\n\n${verificationUrl}\n\nThank you,\nCollege Bus Tracker Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a86e8;">College Bus Tracker</h2>
          <p>Hello ${user.fullName},</p>
          <p>Please verify your email address by clicking on the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4a86e8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>Thank you,<br />College Bus Tracker Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "college-bus-tracker-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input data
      let validatedData;
      try {
        validatedData = extendedUserSchema.parse(req.body);
      } catch (validationError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: (validationError as any).errors 
        });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Create the user
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      // Send verification email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailSent = await sendVerificationEmail(user, baseUrl);
      
      // Login the user
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, verificationToken, ...userWithoutSensitiveData } = user as any;
        res.status(201).json({
          ...userWithoutSensitiveData,
          emailVerificationSent: emailSent
        });
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Email verification endpoint
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Find user with this verification token
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(404).json({ error: "Invalid or expired verification token" });
      }
      
      // Verify the user's email
      const updatedUser = await storage.verifyEmail(user.id);
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to verify email" });
      }
      
      // If user is not logged in, log them in
      if (!req.isAuthenticated()) {
        req.login(updatedUser, (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to login after verification" });
          }
          res.json({ success: true, message: "Email verified successfully" });
        });
      } else {
        res.json({ success: true, message: "Email verified successfully" });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error during verification" });
    }
  });
  
  // Resend verification email
  app.post("/api/resend-verification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    
    const user = await storage.getUser(req.user!.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }
    
    // Generate new verification token if needed
    let updatedUser = user;
    if (!user.verificationToken) {
      const token = randomBytes(32).toString('hex');
      updatedUser = await storage.setVerificationToken(user.id, token) || user;
    }
    
    // Send verification email
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const emailSent = await sendVerificationEmail(updatedUser, baseUrl);
    
    if (emailSent) {
      res.json({ success: true, message: "Verification email sent" });
    } else {
      res.status(500).json({ error: "Failed to send verification email" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user as any;
    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
}
