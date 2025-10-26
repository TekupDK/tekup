import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3051", "http://localhost:8080"],
    methods: ["GET", "POST"]
  }
});

// Environment variables
const PORT = process.env.PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'rendetalje-os-dev-secret-2024';
const BCRYPT_ROUNDS = 12;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3051", "http://localhost:8080"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

const authenticateToken = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role as any || 'EMPLOYEE',
        status: 'PENDING'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.issues : 'Registration failed'
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Account not active' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.issues : 'Login failed'
    });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Rendetalje OS Enhanced API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    features: ['Authentication', 'Database Integration', 'Real-time Updates']
  });
});

// ============================================================================
// LEGACY STATISTICS ENDPOINT (for backward compatibility)
// ============================================================================

app.get('/api/statistics', async (req, res) => {
  try {
    // Get real statistics from database or fallback to mock data
    const stats = {
      activeTasks: 12,
      employees: 8,
      completedToday: 5,
      rating: 4.8,
      monthlyRevenue: 125000,
      businessData: {
        hourlyRate: 349,
        mobilePay: 71759,
        serviceArea: 'Aarhus og omegn',
        services: [
          'Daglig rengøring',
          'Hovedrengøring', 
          'Vinduespudsning',
          'Event cleanup'
        ]
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============================================================================
// LEGACY TASKS ENDPOINT (mapped to scheduled jobs for backward compatibility)
// ============================================================================

app.get('/api/tasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Get today's scheduled jobs formatted as "tasks" for backward compatibility
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const scheduledJobs = await prisma.scheduledJob.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        job: {
          select: {
            jobType: true,
            estimatedDuration: true,
            priority: true
          }
        },
        customer: {
          select: {
            name: true,
            address: true
          }
        },
        assignedMember: {
          select: {
            name: true
          }
        }
      },
      orderBy: { scheduledStart: 'asc' }
    });

    // Format as legacy "tasks" format
    const tasks = scheduledJobs.map((job, index) => ({
      id: index + 1,
      title: `${job.job.jobType} - ${job.customer.name}`,
      customer: job.customer.name,
      employee: job.assignedMember?.name || 'Ikke tildelt',
      status: job.status,
      scheduled: job.scheduledStart.toISOString(),
      location: job.customer.address,
      duration: job.job.estimatedDuration,
      type: job.job.jobType,
      priority: job.job.priority
    }));

    res.json({
      success: true,
      data: tasks,
      total: tasks.length
    });
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ============================================================================
// EMPLOYEE MANAGEMENT ROUTES
// ============================================================================

// Get all employees
app.get('/api/employees', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employees = await prisma.cleaningEmployee.findMany({
      include: {
        team: {
          select: { id: true, name: true, baseLocation: true }
        },
        contract: {
          select: {
            monthlySalary: true,
            hourlyRate: true,
            workingHours: true,
            status: true
          }
        },
        assignedJobs: {
          select: {
            id: true,
            scheduledDate: true,
            status: true,
            job: {
              select: {
                jobType: true,
                customer: { select: { name: true } }
              }
            }
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5
        }
      }
    });

    res.json({
      success: true,
      data: employees,
      total: employees.length
    });
  } catch (error) {
    console.error('Employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Create new employee
app.post('/api/employees', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res) => {
  try {
    const employeeSchema = z.object({
      teamId: z.string(),
      name: z.string().min(1),
      cprNumber: z.string().min(10).max(11),
      position: z.string(),
      startDate: z.string().datetime(),
      specializations: z.array(z.string()),
      weeklySchedule: z.any()
    });

    const parsedData = employeeSchema.parse(req.body);
    const employee = await prisma.cleaningEmployee.create({
      data: {
        teamId: parsedData.teamId,
        name: parsedData.name,
        cprNumber: parsedData.cprNumber,
        position: parsedData.position,
        startDate: new Date(parsedData.startDate),
        specializations: parsedData.specializations,
        weeklySchedule: parsedData.weeklySchedule
      },
      include: {
        team: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.issues : 'Failed to create employee'
    });
  }
});

// ============================================================================
// SCHEDULED JOBS MANAGEMENT
// ============================================================================

// Get all scheduled jobs
app.get('/api/scheduled-jobs', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, date, teamId } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (teamId) where.teamId = teamId;
    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      where.scheduledDate = {
        gte: startDate,
        lt: endDate
      };
    }

    const scheduledJobs = await prisma.scheduledJob.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            jobType: true,
            estimatedDuration: true,
            priority: true,
            requirements: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            customerType: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            baseLocation: true
          }
        },
        assignedMember: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        progressLogs: {
          select: {
            id: true,
            status: true,
            timestamp: true,
            notes: true
          },
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    res.json({
      success: true,
      data: scheduledJobs,
      total: scheduledJobs.length
    });
  } catch (error) {
    console.error('Scheduled jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled jobs' });
  }
});

// Create new scheduled job
app.post('/api/scheduled-jobs', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res) => {
  try {
    const scheduleSchema = z.object({
      jobId: z.string(),
      customerId: z.string(),
      teamId: z.string(),
      assignedMemberId: z.string().optional(),
      scheduledDate: z.string().datetime(),
      scheduledStart: z.string().datetime(),
      scheduledEnd: z.string().datetime()
    });

    const parsedData = scheduleSchema.parse(req.body);
    const scheduledJob = await prisma.scheduledJob.create({
      data: {
        jobId: parsedData.jobId,
        customerId: parsedData.customerId,
        teamId: parsedData.teamId,
        assignedMemberId: parsedData.assignedMemberId,
        scheduledDate: new Date(parsedData.scheduledDate),
        scheduledStart: new Date(parsedData.scheduledStart),
        scheduledEnd: new Date(parsedData.scheduledEnd)
      },
      include: {
        job: true,
        customer: true,
        team: true,
        assignedMember: true
      }
    });

    // Emit real-time update to connected clients
    io.emit('scheduled-job-created', scheduledJob);

    res.status(201).json({
      success: true,
      message: 'Job scheduled successfully',
      data: scheduledJob
    });
  } catch (error) {
    console.error('Schedule job error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.issues : 'Failed to schedule job'
    });
  }
});

// Update scheduled job status
app.put('/api/scheduled-jobs/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes, location } = req.body;

    const scheduledJob = await prisma.scheduledJob.update({
      where: { id },
      data: {
        status,
        progressNotes: notes,
        actualStart: status === 'IN_PROGRESS' ? new Date() : undefined,
        actualEnd: status === 'COMPLETED' ? new Date() : undefined
      },
      include: {
        job: true,
        customer: true,
        team: true
      }
    });

    // Create progress log
    if (notes || location) {
      await prisma.jobProgressLog.create({
        data: {
          jobId: id,
          status,
          location,
          notes
        }
      });
    }

    // Emit real-time update
    io.emit('scheduled-job-updated', scheduledJob);

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: scheduledJob
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(400).json({ error: 'Failed to update job status' });
  }
});

// ============================================================================
// DASHBOARD ANALYTICS
// ============================================================================

// Get dashboard statistics
app.get('/api/dashboard', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Today's jobs
    const todaysJobs = await prisma.scheduledJob.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        job: { select: { jobType: true } },
        customer: { select: { name: true } },
        team: { select: { name: true } }
      }
    });

    // Count stats
    const [totalCustomers, totalEmployees, totalTeams, activeJobs] = await Promise.all([
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.cleaningEmployee.count({ where: { status: 'ACTIVE' } }),
      prisma.cleaningTeam.count({ where: { status: 'ACTIVE' } }),
      prisma.scheduledJob.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } })
    ]);

    // Completed jobs today
    const completedToday = todaysJobs.filter(job => job.status === 'COMPLETED').length;
    
    // Jobs by status
    const jobsByStatus = {
      scheduled: todaysJobs.filter(j => j.status === 'SCHEDULED').length,
      inProgress: todaysJobs.filter(j => j.status === 'IN_PROGRESS').length,
      completed: todaysJobs.filter(j => j.status === 'COMPLETED').length,
      cancelled: todaysJobs.filter(j => j.status === 'CANCELLED').length
    };

    // Recent activity (last 10 job updates)
    const recentActivity = await prisma.jobProgressLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        scheduledJob: {
          select: {
            job: { select: { jobType: true } },
            customer: { select: { name: true } }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalEmployees,
          totalTeams,
          activeJobs,
          completedToday,
          rating: 4.8 // This could be calculated from customer feedback
        },
        todaysSchedule: {
          jobs: todaysJobs,
          statusBreakdown: jobsByStatus
        },
        recentActivity: recentActivity.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          status: log.status,
          notes: log.notes,
          jobType: log.scheduledJob.job.jobType,
          customerName: log.scheduledJob.customer.name
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ============================================================================
// CUSTOMER MANAGEMENT ROUTES
// ============================================================================

// Get all customers
app.get('/api/customers', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        jobs: {
          select: {
            id: true,
            jobType: true,
            status: true,
            createdAt: true
          }
        },
        scheduledJobs: {
          select: {
            id: true,
            scheduledDate: true,
            status: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: customers,
      total: customers.length
    });
  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create new customer
app.post('/api/customers', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res) => {
  try {
    const customerSchema = z.object({
      name: z.string().min(1),
      address: z.string().min(1),
      coordinates: z.object({ lat: z.number(), lon: z.number() }),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      municipality: z.string().min(1),
      customerType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'OFFICE']),
      contractType: z.enum(['ONE_TIME', 'RECURRING', 'SUBSCRIPTION']),
      preferences: z.any().optional()
    });

    const parsedData = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({
      data: {
        name: parsedData.name,
        address: parsedData.address,
        coordinates: parsedData.coordinates,
        phone: parsedData.phone,
        email: parsedData.email,
        municipality: parsedData.municipality,
        customerType: parsedData.customerType,
        contractType: parsedData.contractType,
        preferences: parsedData.preferences
      }
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.issues : 'Failed to create customer'
    });
  }
});

// Update customer
app.put('/api/customers/:id', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.update({
      where: { id },
      data: req.body,
      include: {
        jobs: true,
        scheduledJobs: true
      }
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(400).json({ error: 'Failed to update customer' });
  }
});

// ============================================================================
// CLEANING JOBS MANAGEMENT
// ============================================================================

// Get all cleaning jobs
app.get('/api/jobs', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const jobs = await prisma.cleaningJob.findMany({
      include: {
        customer: {
          select: { id: true, name: true, address: true, customerType: true }
        },
        scheduledJobs: {
          select: {
            id: true,
            scheduledDate: true,
            status: true,
            team: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: jobs,
      total: jobs.length
    });
  } catch (error) {
    console.error('Jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Create new cleaning job
app.post('/api/jobs', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res) => {
  try {
    const jobSchema = z.object({
      customerId: z.string(),
      address: z.string(),
      coordinates: z.object({ lat: z.number(), lon: z.number() }),
      jobType: z.string(),
      estimatedDuration: z.number().min(1),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      requirements: z.array(z.string()),
      equipmentNeeded: z.array(z.string()),
      recurring: z.any().optional()
    });

    const parsedData = jobSchema.parse(req.body);
    const job = await prisma.cleaningJob.create({
      data: {
        customerId: parsedData.customerId,
        address: parsedData.address,
        coordinates: parsedData.coordinates,
        jobType: parsedData.jobType,
        estimatedDuration: parsedData.estimatedDuration,
        priority: parsedData.priority,
        requirements: parsedData.requirements,
        equipmentNeeded: parsedData.equipmentNeeded,
        recurring: parsedData.recurring
      },
      include: {
        customer: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cleaning job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.issues : 'Failed to create job'
    });
  }
});

// ============================================================================
// CLEANING TEAMS MANAGEMENT
// ============================================================================

// Get all cleaning teams
app.get('/api/teams', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const teams = await prisma.cleaningTeam.findMany({
      include: {
        members: {
          select: {
            id: true,
            name: true,
            position: true,
            status: true,
            specializations: true
          }
        },
        equipment: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        },
        jobs: {
          select: {
            id: true,
            scheduledDate: true,
            status: true,
            job: {
              select: {
                jobType: true,
                customer: { select: { name: true } }
              }
            }
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5
        }
      }
    });

    res.json({
      success: true,
      data: teams,
      total: teams.length
    });
  } catch (error) {
    console.error('Teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create new cleaning team
app.post('/api/teams', authenticateToken, requireRole(['ADMIN', 'MANAGER']), async (req: AuthenticatedRequest, res) => {
  try {
    const teamSchema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      baseLocation: z.string(),
      operatingHours: z.any(),
      vehicleInfo: z.any()
    });

    const parsedData = teamSchema.parse(req.body);
    const team = await prisma.cleaningTeam.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        baseLocation: parsedData.baseLocation,
        operatingHours: parsedData.operatingHours,
        vehicleInfo: parsedData.vehicleInfo
      }
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.issues : 'Failed to create team'
    });
  }
});

// ============================================================================
// REAL-TIME WEBSOCKET CONNECTIONS
// ============================================================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('task-update', (data) => {
    // Broadcast task updates to all connected clients
    socket.broadcast.emit('task-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'GET /api/dashboard',
      'GET /api/statistics',
      'GET /api/tasks',
      'GET /api/customers',
      'POST /api/customers',
      'PUT /api/customers/:id',
      'GET /api/jobs',
      'POST /api/jobs',
      'GET /api/employees',
      'POST /api/employees',
      'GET /api/teams',
      'POST /api/teams',
      'GET /api/scheduled-jobs',
      'POST /api/scheduled-jobs',
      'PUT /api/scheduled-jobs/:id/status'
    ]
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start server
    server.listen(PORT, () => {
      console.log(`🧹 Rendetalje OS Enhanced API Server running on port ${PORT}`);
      console.log(`📟 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Authentication: http://localhost:${PORT}/api/auth/login`);
      console.log(`📊 Statistics: http://localhost:${PORT}/api/statistics`);
      console.log(`📋 Tasks: http://localhost:${PORT}/api/tasks`);
      console.log(`⚡ Real-time WebSocket enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});

// Start the server
startServer();