const http = require('http');
const url = require('url');

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

function enableCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  enableCors(res);
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      message: 'Rendetalje OS API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    }));
  } else if (path === '/api/statistics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: mockData.statistics
    }));
  } else if (path === '/api/tasks') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: mockData.tasks,
      total: mockData.tasks.length
    }));
  } else if (path === '/api/employees') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: mockData.employees,
      total: mockData.employees.length
    }));
  } else if (path === '/api/customers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: mockData.customers,
      total: mockData.customers.length
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Endpoint not found',
      path: path,
      availableEndpoints: [
        '/health',
        '/api/statistics',
        '/api/tasks',
        '/api/employees',
        '/api/customers'
      ]
    }));
  }
});

const port = process.env.PORT || 3006;
server.listen(port, () => {
  console.log(`🧹 Rendetalje OS API Server running on port ${port}`);
  console.log(`📟 Health check: http://localhost:${port}/health`);
  console.log(`📊 Statistics: http://localhost:${port}/api/statistics`);
  console.log(`📋 Tasks: http://localhost:${port}/api/tasks`);
});
