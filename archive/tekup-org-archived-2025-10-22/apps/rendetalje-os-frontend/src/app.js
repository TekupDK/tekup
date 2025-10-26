const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/manifest.json') {
    const fs = require('fs');
    try {
      const manifest = fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(manifest);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Manifest not found' }));
    }
  } else if (req.url === '/dist/output.css') {
    const fs = require('fs');
    try {
      const css = fs.readFileSync(path.join(__dirname, '..', 'dist', 'output.css'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(css);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('CSS file not found');
    }
  } else if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="da" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rendetalje OS - Professionel Rengøringsstyring</title>
    <link rel="stylesheet" href="/dist/output.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#3B82F6">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
            --primary: #3B82F6;
            --primary-dark: #1E40AF;
            --secondary: #10B981;
            --danger: #EF4444;
            --warning: #F59E0B;
            --dark: #111827;
            --light: #F9FAFB;
            --border: #E5E7EB;
        }
        
        * {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .animate-fade-in {
            animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .loading-spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid var(--primary);
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .notification {
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .modal-overlay {
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
        }
        
        .btn-primary {
            background: linear-gradient(45deg, var(--primary), var(--primary-dark));
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
        }
        
        .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease-out;
        }
        
        .sidebar.open {
            transform: translateX(0);
        }
        
        @media (max-width: 768px) {
            .mobile-hide { display: none; }
        }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <!-- Loading Screen -->
    <div id="loading-screen" class="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div class="text-center">
            <div class="loading-spinner mx-auto mb-4"></div>
            <h2 class="text-xl font-semibold text-gray-700">Indlæser Rendetalje OS...</h2>
            <p class="text-gray-500">Forbinder til system...</p>
        </div>
    </div>

    <!-- Sidebar -->
    <div id="sidebar" class="sidebar fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-40 overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-800">🧹 Rendetalje OS</h2>
                <button onclick="toggleSidebar()" class="p-2 hover:bg-gray-100 rounded-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- Navigation Menu -->
        <nav class="p-6 space-y-2">
            <a href="#dashboard" onclick="showSection('dashboard')" class="nav-item flex items-center p-3 rounded-lg hover:bg-blue-50 transition-colors">
                <svg class="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
                Dashboard
            </a>
            
            <a href="#tasks" onclick="showSection('tasks')" class="nav-item flex items-center p-3 rounded-lg hover:bg-green-50 transition-colors">
                <svg class="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                Opgaver
            </a>
            
            <a href="#employees" onclick="showSection('employees')" class="nav-item flex items-center p-3 rounded-lg hover:bg-purple-50 transition-colors">
                <svg class="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
                </svg>
                Medarbejdere
            </a>
            
            <a href="#customers" onclick="showSection('customers')" class="nav-item flex items-center p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                <svg class="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Kunder
            </a>
            
            <a href="#analytics" onclick="showSection('analytics')" class="nav-item flex items-center p-3 rounded-lg hover:bg-yellow-50 transition-colors">
                <svg class="w-5 h-5 mr-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Analyser
            </a>
            
            <a href="#settings" onclick="showSection('settings')" class="nav-item flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Indstillinger
            </a>
        </nav>
    </div>

    <!-- Main Content -->
    <div class="flex-1">
        <!-- Top Navigation -->
        <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div class="px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <button onclick="toggleSidebar()" class="p-2 hover:bg-gray-100 rounded-lg md:hidden">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                        
                        <div class="hidden md:block">
                            <h1 class="text-2xl font-bold text-gray-900">🧹 Rendetalje OS</h1>
                            <p class="text-sm text-gray-500" id="current-time">Professionel Rengøringsstyring</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <!-- Connection Status -->
                        <div class="flex items-center space-x-2">
                            <div id="connection-status" class="w-3 h-3 rounded-full bg-gray-400"></div>
                            <span id="connection-text" class="text-sm text-gray-600">Forbinder...</span>
                        </div>
                        
                        <!-- Notifications -->
                        <button class="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5-5-5h5v-10h-5l5-5 5 5h-5v10z"></path>
                            </svg>
                            <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                        </button>
                        
                        <!-- User Menu -->
                        <div class="flex items-center space-x-3">
                            <div class="hidden md:block text-right">
                                <p class="text-sm font-medium text-gray-900">Admin User</p>
                                <p class="text-xs text-gray-500">admin@rendetalje.dk</p>
                            </div>
                            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <span class="text-white text-sm font-bold">A</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content Area -->
        <main class="p-6 max-w-7xl mx-auto">
            <!-- Dashboard Section -->
            <section id="dashboard-section" class="section-content animate-fade-in">
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="glass-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-medium text-gray-600">Aktive Opgaver</h3>
                                <p id="active-tasks" class="text-3xl font-bold text-blue-600">Loading...</p>
                                <p class="text-xs text-gray-500">+12% fra i går</p>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-medium text-gray-600">Medarbejdere</h3>
                                <p id="employees-count" class="text-3xl font-bold text-green-600">Loading...</p>
                                <p class="text-xs text-gray-500">På arbejde</p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-medium text-gray-600">Månedlig Omsætning</h3>
                                <p id="monthly-revenue" class="text-3xl font-bold text-indigo-600">Loading...</p>
                                <p class="text-xs text-gray-500">+8% fra sidste måned</p>
                            </div>
                            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-medium text-gray-600">Kundetilfredshed</h3>
                                <p id="rating" class="text-3xl font-bold text-yellow-600">Loading...</p>
                                <p class="text-xs text-gray-500">Gennemsnitlig rating</p>
                            </div>
                            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="glass-card rounded-xl p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Opgave Status Oversigt</h3>
                        <canvas id="tasksChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="glass-card rounded-xl p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Månedlig Omsætning</h3>
                        <canvas id="revenueChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Recent Activities -->
                <div class="glass-card rounded-xl p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-gray-800">Seneste Aktiviteter</h3>
                        <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">Se alle</button>
                    </div>
                    
                    <div id="recent-activities" class="space-y-4">
                        <div class="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <p class="font-medium text-gray-900">Opgave afsluttet</p>
                                <p class="text-sm text-gray-500">Maria Hansen afsluttede "Kontor rengøring - Novo Nordisk"</p>
                            </div>
                            <p class="text-xs text-gray-400">2 min siden</p>
                        </div>
                        
                        <div class="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <p class="font-medium text-gray-900">Ny opgave oprettet</p>
                                <p class="text-sm text-gray-500">Restaurant rengøring planlagt til i morgen</p>
                            </div>
                            <p class="text-xs text-gray-400">15 min siden</p>
                        </div>
                        
                        <div class="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <p class="font-medium text-gray-900">Ny medarbejder</p>
                                <p class="text-sm text-gray-500">Anna Sørensen tilføjet til teamet</p>
                            </div>
                            <p class="text-xs text-gray-400">1 time siden</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Tasks Section -->
            <section id="tasks-section" class="section-content hidden">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Opgaver</h2>
                    <button onclick="createTask()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium">
                        Ny Opgave
                    </button>
                </div>
                
                <div id="tasks-list" class="space-y-4">
                    <div class="text-center py-8">
                        <div class="loading-spinner mx-auto mb-4"></div>
                        <p class="text-gray-500">Indlæser opgaver...</p>
                    </div>
                </div>
            </section>

            <!-- Employees Section -->
            <section id="employees-section" class="section-content hidden">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Medarbejdere</h2>
                    <button onclick="addEmployee()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium">
                        Tilføj Medarbejder
                    </button>
                </div>
                
                <div id="employees-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="text-center py-8 col-span-full">
                        <div class="loading-spinner mx-auto mb-4"></div>
                        <p class="text-gray-500">Indlæser medarbejdere...</p>
                    </div>
                </div>
            </section>

            <!-- Customers Section -->
            <section id="customers-section" class="section-content hidden">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Kunder</h2>
                    <button onclick="addCustomer()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium">
                        Ny Kunde
                    </button>
                </div>
                
                <div id="customers-list" class="space-y-4">
                    <div class="text-center py-8">
                        <div class="loading-spinner mx-auto mb-4"></div>
                        <p class="text-gray-500">Indlæser kunder...</p>
                    </div>
                </div>
            </section>

            <!-- Analytics Section -->
            <section id="analytics-section" class="section-content hidden">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Analyser</h2>
                <div class="text-center py-12">
                    <p class="text-gray-500 mb-4">Avancerede analyser kommer snart!</p>
                    <div class="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                    </div>
                </div>
            </section>

            <!-- Settings Section -->
            <section id="settings-section" class="section-content hidden">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Indstillinger</h2>
                <div class="text-center py-12">
                    <p class="text-gray-500 mb-4">Systemindstillinger kommer snart!</p>
                    <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- Notifications Container -->
    <div id="notifications" class="fixed top-4 right-4 space-y-2 z-50"></div>

    <!-- PWA Install Banner -->
    <div id="pwa-banner" class="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg hidden">
        <div class="flex items-center justify-between">
            <div>
                <p class="font-medium">Installer Rendetalje OS</p>
                <p class="text-sm text-blue-100">Få hurtig adgang direkte fra din hjemmeskærm</p>
            </div>
            <div class="flex space-x-2">
                <button onclick="dismissPWABanner()" class="text-blue-100 hover:text-white">Luk</button>
                <button onclick="installPWA()" class="bg-white text-blue-600 px-3 py-1 rounded font-medium">Installer</button>
            </div>
        </div>
    </div>

    <script>
        // ============================================================================
        // APPLICATION STATE & CONFIGURATION
        // ============================================================================
        
        const API_BASE = 'http://localhost:3006';
        let currentUser = null;
        let authToken = localStorage.getItem('authToken');
        let socket = null;
        let cachedData = {
            statistics: null,
            tasks: [],
            employees: [],
            customers: []
        };

        // ============================================================================
        // UTILITY FUNCTIONS
        // ============================================================================
        
        function formatCurrency(amount) {
            return new Intl.NumberFormat('da-DK', {
                style: 'currency',
                currency: 'DKK',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        }

        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('da-DK', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = \`notification p-4 rounded-lg shadow-lg text-white mb-2 \${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 
                type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }\`;
            notification.innerHTML = \`
                <div class="flex items-center justify-between">
                    <span>\${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">×</button>
                </div>
            \`;
            
            document.getElementById('notifications').appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }

        // ============================================================================
        // API COMMUNICATION
        // ============================================================================
        
        async function apiRequest(endpoint, options = {}) {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken && { 'Authorization': \`Bearer \${authToken}\` })
                    },
                    ...options
                };

                const response = await fetch(\`\${API_BASE}\${endpoint}\`, config);
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(\`API Error (\${endpoint}):\`, error);
                throw error;
            }
        }

        async function checkApiHealth() {
            try {
                const health = await apiRequest('/health');
                updateConnectionStatus(true, health.message);
                return true;
            } catch (error) {
                updateConnectionStatus(false, 'Forbindelse fejlede');
                return false;
            }
        }

        function updateConnectionStatus(isConnected, message) {
            const statusDot = document.getElementById('connection-status');
            const statusText = document.getElementById('connection-text');
            
            if (isConnected) {
                statusDot.className = 'w-3 h-3 rounded-full bg-green-500';
                statusText.textContent = 'Forbundet';
                statusText.className = 'text-sm text-green-600';
            } else {
                statusDot.className = 'w-3 h-3 rounded-full bg-red-500';
                statusText.textContent = 'Offline';
                statusText.className = 'text-sm text-red-600';
            }
        }

        // ============================================================================
        // DATA LOADING FUNCTIONS
        // ============================================================================
        
        async function loadStatistics() {
            try {
                const result = await apiRequest('/api/statistics');
                if (result.success) {
                    cachedData.statistics = result.data;
                    updateDashboardStats(result.data);
                    return result.data;
                }
            } catch (error) {
                console.error('Failed to load statistics:', error);
                showNotification('Kunne ikke indlæse statistikker', 'error');
            }
            return null;
        }

        async function loadTasks() {
            try {
                const result = await apiRequest('/api/tasks');
                if (result.success) {
                    cachedData.tasks = result.data;
                    renderTasks(result.data);
                    return result.data;
                }
            } catch (error) {
                console.error('Failed to load tasks:', error);
                showNotification('Kunne ikke indlæse opgaver', 'error');
            }
            return [];
        }

        async function loadEmployees() {
            try {
                const result = await apiRequest('/api/employees');
                if (result.success) {
                    cachedData.employees = result.data;
                    renderEmployees(result.data);
                    return result.data;
                }
            } catch (error) {
                console.error('Failed to load employees:', error);
                showNotification('Kunne ikke indlæse medarbejdere', 'error');
            }
            return [];
        }

        async function loadCustomers() {
            try {
                const result = await apiRequest('/api/customers');
                if (result.success) {
                    cachedData.customers = result.data;
                    renderCustomers(result.data);
                    return result.data;
                }
            } catch (error) {
                console.error('Failed to load customers:', error);
                showNotification('Kunne ikke indlæse kunder', 'error');
            }
            return [];
        }

        // ============================================================================
        // UI RENDERING FUNCTIONS
        // ============================================================================
        
        function updateDashboardStats(stats) {
            document.getElementById('active-tasks').textContent = stats.activeTasks;
            document.getElementById('employees-count').textContent = stats.employees;
            document.getElementById('monthly-revenue').textContent = formatCurrency(stats.monthlyRevenue);
            document.getElementById('rating').textContent = stats.rating;
            
            // Update charts
            updateTasksChart();
            updateRevenueChart();
        }

        function renderTasks(tasks) {
            const container = document.getElementById('tasks-list');
            
            if (tasks.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-12">
                        <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                        <p class="text-gray-500">Ingen opgaver fundet</p>
                    </div>
                \`;
                return;
            }

            container.innerHTML = tasks.map(task => \`
                <div class="glass-card rounded-xl p-6 card-hover">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">\${task.title}</h3>
                            <div class="flex items-center space-x-4 text-sm text-gray-600">
                                <span class="flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"></path>
                                    </svg>
                                    \${task.customer}
                                </span>
                                <span class="flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    \${task.employee}
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-3 py-1 text-xs font-semibold rounded-full \${getStatusBadgeClass(task.status)}">
                                \${task.status}
                            </span>
                            <span class="px-3 py-1 text-xs font-semibold rounded-full \${getPriorityBadgeClass(task.priority)}">
                                \${task.priority}
                            </span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div class="flex items-center text-gray-600">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            \${task.location}
                        </div>
                        <div class="flex items-center text-gray-600">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            \${task.duration} minutter
                        </div>
                        <div class="flex items-center text-gray-600">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4H8z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7v10a2 2 0 002 2h8a2 2 0 002-2V7"></path>
                            </svg>
                            \${task.type}
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <span class="text-sm text-gray-500">
                            Planlagt: \${formatDate(task.scheduled)}
                        </span>
                        <div class="flex space-x-2">
                            <button onclick="editTask(\${task.id})" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Rediger
                            </button>
                            <button onclick="deleteTask(\${task.id})" class="text-red-600 hover:text-red-800 text-sm font-medium">
                                Slet
                            </button>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function renderEmployees(employees) {
            const container = document.getElementById('employees-list');
            
            if (employees.length === 0) {
                container.innerHTML = \`
                    <div class="col-span-full text-center py-12">
                        <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                        </div>
                        <p class="text-gray-500">Ingen medarbejdere fundet</p>
                    </div>
                \`;
                return;
            }

            container.innerHTML = employees.map(employee => \`
                <div class="glass-card rounded-xl p-6 card-hover">
                    <div class="flex items-center space-x-4 mb-4">
                        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span class="text-white font-bold text-lg">\${employee.name.charAt(0)}</span>
                        </div>
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900">\${employee.name}</h3>
                            <p class="text-sm text-gray-600">\${employee.position}</p>
                        </div>
                        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            \${employee.status}
                        </span>
                    </div>
                    
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            \${employee.phone}
                        </div>
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            \${employee.email}
                        </div>
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            \${employee.workingHours}
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex items-center justify-between">
                            <div class="text-xs text-gray-500">
                                Specialer: \${employee.specializations.join(', ')}
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="editEmployee(\${employee.id})" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    Rediger
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function renderCustomers(customers) {
            const container = document.getElementById('customers-list');
            
            if (customers.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-12">
                        <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"></path>
                            </svg>
                        </div>
                        <p class="text-gray-500">Ingen kunder fundet</p>
                    </div>
                \`;
                return;
            }

            container.innerHTML = customers.map(customer => \`
                <div class="glass-card rounded-xl p-6 card-hover">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">\${customer.name}</h3>
                            <div class="flex items-center space-x-4 text-sm text-gray-600">
                                <span class="flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    </svg>
                                    \${customer.address}
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                \${customer.type}
                            </span>
                            <span class="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                \${customer.contractType}
                            </span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            \${customer.phone}
                        </div>
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            \${customer.email}
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-200 pt-4">
                        <div class="flex items-center justify-between">
                            <div class="text-xs text-gray-500">
                                Services: \${customer.services.join(', ')}
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="viewCustomer(\${customer.id})" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    Se detaljer
                                </button>
                                <button onclick="editCustomer(\${customer.id})" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                    Rediger
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        // ============================================================================
        // CHART FUNCTIONS
        // ============================================================================
        
        function updateTasksChart() {
            const ctx = document.getElementById('tasksChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Afsluttet', 'I gang', 'Planlagt', 'Aflyst'],
                    datasets: [{
                        data: [45, 12, 23, 3],
                        backgroundColor: [
                            '#10B981',
                            '#3B82F6', 
                            '#F59E0B',
                            '#EF4444'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        function updateRevenueChart() {
            const ctx = document.getElementById('revenueChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun'],
                    datasets: [{
                        label: 'Omsætning (DKK)',
                        data: [85000, 92000, 78000, 98000, 115000, 125000],
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // ============================================================================
        // UI INTERACTION FUNCTIONS
        // ============================================================================
        
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }

        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.section-content').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show selected section
            const targetSection = document.getElementById(\`\${sectionName}-section\`);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('animate-fade-in');
            }
            
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                toggleSidebar();
            }
            
            // Load section data if needed
            switch (sectionName) {
                case 'tasks':
                    if (cachedData.tasks.length === 0) {
                        loadTasks();
                    }
                    break;
                case 'employees':
                    if (cachedData.employees.length === 0) {
                        loadEmployees();
                    }
                    break;
                case 'customers':
                    if (cachedData.customers.length === 0) {
                        loadCustomers();
                    }
                    break;
            }
        }

        // ============================================================================
        // UTILITY FUNCTIONS FOR UI
        // ============================================================================
        
        function getStatusBadgeClass(status) {
            switch (status) {
                case 'COMPLETED': return 'bg-green-100 text-green-800';
                case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
                case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        }

        function getPriorityBadgeClass(priority) {
            switch (priority) {
                case 'HIGH': return 'bg-red-100 text-red-800';
                case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
                case 'LOW': return 'bg-green-100 text-green-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        }

        // ============================================================================
        // ACTION FUNCTIONS (PLACEHOLDERS)
        // ============================================================================
        
        function createTask() {
            showNotification('Opret opgave kommer snart!', 'info');
        }

        function editTask(taskId) {
            showNotification(\`Rediger opgave \${taskId} kommer snart!\`, 'info');
        }

        function deleteTask(taskId) {
            showNotification(\`Slet opgave \${taskId} kommer snart!\`, 'info');
        }

        function addEmployee() {
            showNotification('Tilføj medarbejder kommer snart!', 'info');
        }

        function editEmployee(employeeId) {
            showNotification(\`Rediger medarbejder \${employeeId} kommer snart!\`, 'info');
        }

        function addCustomer() {
            showNotification('Tilføj kunde kommer snart!', 'info');
        }

        function editCustomer(customerId) {
            showNotification(\`Rediger kunde \${customerId} kommer snart!\`, 'info');
        }

        function viewCustomer(customerId) {
            showNotification(\`Se kunde \${customerId} kommer snart!\`, 'info');
        }

        // ============================================================================
        // PWA FUNCTIONS
        // ============================================================================
        
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('pwa-banner').classList.remove('hidden');
        });

        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        showNotification('Rendetalje OS installeret!', 'success');
                    }
                    deferredPrompt = null;
                    dismissPWABanner();
                });
            }
        }

        function dismissPWABanner() {
            document.getElementById('pwa-banner').classList.add('hidden');
        }

        // ============================================================================
        // REAL-TIME WEBSOCKET CONNECTION
        // ============================================================================
        
        function initializeWebSocket() {
            socket = io(API_BASE);
            
            socket.on('connect', () => {
                console.log('WebSocket connected');
                showNotification('Realtids forbindelse etableret', 'success');
            });
            
            socket.on('disconnect', () => {
                console.log('WebSocket disconnected');
                showNotification('Realtids forbindelse afbrudt', 'warning');
            });
            
            socket.on('task-updated', (data) => {
                showNotification(\`Opgave opdateret: \${data.title}\`, 'info');
                // Refresh tasks if on tasks page
                if (!document.getElementById('tasks-section').classList.contains('hidden')) {
                    loadTasks();
                }
            });
        }

        // ============================================================================
        // APPLICATION INITIALIZATION
        // ============================================================================
        
        async function initializeApp() {
            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
            }, 2000);
            
            // Update current time
            document.getElementById('current-time').textContent = 
                new Date().toLocaleDateString('da-DK', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            
            // Check API health
            const isHealthy = await checkApiHealth();
            
            if (isHealthy) {
                // Load initial data
                await loadStatistics();
                
                // Initialize WebSocket
                initializeWebSocket();
                
                showNotification('Rendetalje OS er klar!', 'success');
            } else {
                showNotification('Kunne ikke forbinde til serveren', 'error');
            }
        }

        // ============================================================================
        // EVENT LISTENERS
        // ============================================================================
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (!sidebar.contains(e.target) && !e.target.closest('button[onclick="toggleSidebar()"]')) {
                sidebar.classList.remove('open');
            }
        });

        // Periodic health check
        setInterval(checkApiHealth, 30000);

        // ============================================================================
        // START APPLICATION
        // ============================================================================
        
        // Initialize app when DOM is ready
        document.addEventListener('DOMContentLoaded', initializeApp);
        
    </script>
</body>
</html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const port = process.env.PORT || 3051;
server.listen(port, () => {
  console.log(`🎨 Rendetalje OS Enhanced Frontend running on port ${port}`);
  console.log(`🌐 Open: http://localhost:${port}`);
});