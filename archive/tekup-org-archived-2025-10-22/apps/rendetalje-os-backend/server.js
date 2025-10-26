const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3051', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Rendetalje OS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Rendetalje OS API',
    description: 'Professional cleaning service management for Danish market',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      swagger: '/api/docs',
      tasks: '/api/tasks',
      employees: '/api/employees',
      customers: '/api/customers',
      scheduling: '/api/scheduling'
    }
  });
});

// Mock data
const mockData = {
  tasks: [
    {
      id: 1,
      title: 'Kontor rengøring - Novo Nordisk',
      customer: 'Novo Nordisk A/S',
      employee: 'Maria Hansen',
      status: 'IN_PROGRESS',
      scheduled: '2025-01-12T09:00:00Z',
      location: 'Bagsværd Hovedgade 99, Bagsværd',
      duration: 120,
      type: 'OFFICE_CLEANING',
      priority: 'HIGH'
    },
    {
      id: 2,
      title: 'Butik rengøring - Netto',
      customer: 'Netto A/S',
      employee: 'Lars Nielsen',
      status: 'ASSIGNED',
      scheduled: '2025-01-12T14:00:00Z',
      location: 'Århus C, Store Torv 1',
      duration: 90,
      type: 'RETAIL_CLEANING',
      priority: 'MEDIUM'
    },
    {
      id: 3,
      title: 'Restaurant rengøring - Madklubben',
      customer: 'Madklubben A/S',
      employee: 'Anna Sørensen',
      status: 'COMPLETED',
      scheduled: '2025-01-11T20:00:00Z',
      location: 'Frederiksberg Allé 12, Frederiksberg',
      duration: 180,
      type: 'RESTAURANT_CLEANING',
      priority: 'HIGH'
    }
  ],
  employees: [
    {
      id: 1,
      name: 'Maria Hansen',
      position: 'Senior Rengøringsassistent',
      status: 'ACTIVE',
      phone: '+45 12 34 56 78',
      email: 'maria@rendetalje.dk',
      specializations: ['Kontor', 'Medicinal'],
      workingHours: '08:00-16:00'
    },
    {
      id: 2,
      name: 'Lars Nielsen',
      position: 'Rengøringsassistent',
      status: 'ACTIVE',
      phone: '+45 23 45 67 89',
      email: 'lars@rendetalje.dk',
      specializations: ['Butik', 'Restaurant'],
      workingHours: '09:00-17:00'
    }
  ],
  customers: [
    {
      id: 1,
      name: 'Novo Nordisk A/S',
      type: 'CORPORATE',
      address: 'Bagsværd Hovedgade 99, Bagsværd',
      phone: '+45 44 44 88 88',
      email: 'facilities@novonordisk.com',
      contractType: 'RECURRING',
      services: ['Daglig rengøring', 'Vinduesrengøring']
    },
    {
      id: 2,
      name: 'Netto A/S',
      type: 'RETAIL',
      address: 'Århus C, Store Torv 1',
      phone: '+45 87 87 87 87',
      email: 'butik.aarhus@netto.dk',
      contractType: 'WEEKLY',
      services: ['Butiksvask', 'Gulvbehandling']
    }
  ],
  statistics: {
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
  }
};

// Tasks endpoints
app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: mockData.tasks,
    total: mockData.tasks.length
  });
});

app.get('/api/tasks/:id', (req, res) => {
  const task = mockData.tasks.find(t => t.id == req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ success: true, data: task });
});

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: mockData.tasks.length + 1,
    ...req.body,
    status: 'ASSIGNED',
    created: new Date().toISOString()
  };
  mockData.tasks.push(newTask);
  res.status(201).json({ success: true, data: newTask });
});

// Employees endpoints
app.get('/api/employees', (req, res) => {
  res.json({
    success: true,
    data: mockData.employees,
    total: mockData.employees.length
  });
});

app.get('/api/employees/:id', (req, res) => {
  const employee = mockData.employees.find(e => e.id == req.params.id);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  res.json({ success: true, data: employee });
});

// Customers endpoints
app.get('/api/customers', (req, res) => {
  res.json({
    success: true,
    data: mockData.customers,
    total: mockData.customers.length
  });
});

app.get('/api/customers/:id', (req, res) => {
  const customer = mockData.customers.find(c => c.id == req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json({ success: true, data: customer });
});

// Statistics endpoint
app.get('/api/statistics', (req, res) => {
  res.json({
    success: true,
    data: mockData.statistics
  });
});

// Scheduling endpoints
app.get('/api/scheduling/optimize', (req, res) => {
  res.json({
    success: true,
    data: {
      optimizedRoutes: [
        {
          employeeId: 1,
          employee: 'Maria Hansen',
          tasks: mockData.tasks.filter(t => t.employee === 'Maria Hansen'),
          totalDistance: 15.2,
          estimatedTime: 180,
          fuelSaving: '12%'
        }
      ],
      totalSavings: {
        time: '45 minutter',
        fuel: '12%',
        co2: '2.1 kg'
      }
    }
  });
});

app.post('/api/scheduling/assign', (req, res) => {
  const { taskId, employeeId } = req.body;
  const task = mockData.tasks.find(t => t.id == taskId);
  const employee = mockData.employees.find(e => e.id == employeeId);
  
  if (!task || !employee) {
    return res.status(404).json({ error: 'Task or employee not found' });
  }
  
  task.employee = employee.name;
  task.status = 'ASSIGNED';
  
  res.json({
    success: true,
    message: `Opgave tildelt til ${employee.name}`,
    data: task
  });
});

// Booking endpoint
app.post('/api/booking', (req, res) => {
  const booking = {
    id: Date.now(),
    ...req.body,
    status: 'PENDING',
    created: new Date().toISOString(),
    estimatedPrice: req.body.duration * 349 // 349 kr/time
  };
  
  res.status(201).json({
    success: true,
    message: 'Booking modtaget. Vi kontakter dig inden for 24 timer.',
    data: booking
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/health',
      '/api/info',
      '/api/tasks',
      '/api/employees',
      '/api/customers',
      '/api/statistics',
      '/api/scheduling/optimize',
      '/api/booking'
    ]
  });
});

const port = process.env.PORT || 3006;
app.listen(port, () => {
  console.log(`🧹 Rendetalje OS API Server running on port ${port}`);
  console.log(`📖 API Info: http://localhost:${port}/api/info`);
  console.log(`🩺 Health Check: http://localhost:${port}/health`);
  console.log(`📊 Statistics: http://localhost:${port}/api/statistics`);
});