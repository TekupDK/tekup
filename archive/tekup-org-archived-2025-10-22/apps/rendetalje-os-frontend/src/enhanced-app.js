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
  } else if (req.url === '/components/customer-management.js') {
    const fs = require('fs');
    try {
      const js = fs.readFileSync(path.join(__dirname, 'components', 'customer-management.js'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Component not found');
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
    <script src="/components/customer-management.js"></script>
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
        
        .form-input {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
        }
        
        .form-input:focus {
            background: rgba(255, 255, 255, 1);
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        @media (max-width: 768px) {
            .mobile-hide { display: none; }
        }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    
    <!-- Login Modal -->
    <div id="login-modal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 glass-card animate-fade-in">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">🧹 Rendetalje OS</h1>
                <p class="text-gray-600">Log ind for at fortsætte</p>
            </div>
            
            <form id="login-form" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="email" name="email" required 
                           class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                           placeholder="admin@rendetalje.dk" value="admin@rendetalje.dk">
                </div>
                
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Adgangskode</label>
                    <input type="password" id="password" name="password" required 
                           class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                           placeholder="••••••••" value="admin123">
                </div>
                
                <button type="submit" id="login-btn" class="btn-primary w-full py-3 rounded-lg text-white font-medium">
                    <span id="login-text">Log ind</span>
                    <div id="login-spinner" class="loading-spinner hidden inline-block ml-2"></div>
                </button>
                
                <div id="login-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                </div>
            </form>
            
            <div class="mt-6 pt-6 border-t border-gray-200 text-center">
                <p class="text-xs text-gray-500">
                    Test konti:<br>
                    Admin: admin@rendetalje.dk / admin123<br>
                    Manager: manager@rendetalje.dk / manager123
                </p>
            </div>
        </div>
    </div>

    <!-- Loading Screen -->
    <div id="loading-screen" class="fixed inset-0 bg-white flex items-center justify-center z-40 hidden">
        <div class="text-center">
            <div class="loading-spinner mx-auto mb-4"></div>
            <h2 class="text-xl font-semibold text-gray-700">Indlæser dashboard...</h2>
            <p class="text-gray-500">Forbinder til backend...</p>
        </div>
    </div>

    <!-- Main Application -->
    <div id="main-app" class="hidden">
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
                    Planlagte Jobs
                </a>
                
                <a href="#employees" onclick="showSection('employees')" class="nav-item flex items-center p-3 rounded-lg hover:bg-purple-50 transition-colors">
                    <svg class="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
                    </svg>
                    Medarbejdere
                </a>
                
                <a href="#customers" onclick="showSection('customers')" class="nav-item flex items-center p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                    <svg class="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    Kunder
                </a>
                
                <a href="#teams" onclick="showSection('teams')" class="nav-item flex items-center p-3 rounded-lg hover:bg-orange-50 transition-colors">
                    <svg class="w-5 h-5 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    Teams
                </a>
            </nav>
            
            <!-- User Info -->
            <div class="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span id="user-avatar" class="text-white font-bold">A</span>
                    </div>
                    <div class="flex-1">
                        <p id="user-name" class="text-sm font-medium text-gray-900">Admin User</p>
                        <p id="user-email" class="text-xs text-gray-500">admin@rendetalje.dk</p>
                    </div>
                    <button onclick="logout()" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Log ud">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                    </button>
                </div>
            </div>
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
                            
                            <!-- Real-time notifications -->
                            <div id="notifications" class="relative">
                                <button id="notification-btn" class="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5-5-5h5v-10h-5l5-5 5 5h-5v10z"></path>
                                    </svg>
                                    <span id="notification-count" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center hidden">0</span>
                                </button>
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
                                    <h3 class="text-sm font-medium text-gray-600">Aktive Jobs</h3>
                                    <p id="active-jobs" class="text-3xl font-bold text-blue-600">Loading...</p>
                                    <p class="text-xs text-gray-500">I dag</p>
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
                                    <p class="text-xs text-gray-500">Aktive</p>
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
                                    <h3 class="text-sm font-medium text-gray-600">Kunder</h3>
                                    <p id="customers-count" class="text-3xl font-bold text-indigo-600">Loading...</p>
                                    <p class="text-xs text-gray-500">Totalt</p>
                                </div>
                                <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div class="glass-card rounded-xl p-6 card-hover">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-sm font-medium text-gray-600">Rating</h3>
                                    <p id="rating" class="text-3xl font-bold text-yellow-600">Loading...</p>
                                    <p class="text-xs text-gray-500">Gennemsnit</p>
                                </div>
                                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Today's Schedule -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div class="glass-card rounded-xl p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">I Dag's Program</h3>
                            <div id="todays-schedule" class="space-y-3">
                                <div class="text-center text-gray-500 py-8">
                                    <div class="loading-spinner mx-auto mb-2"></div>
                                    <p>Indlæser dagens jobs...</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="glass-card rounded-xl p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Seneste Aktiviteter</h3>
                            <div id="recent-activities" class="space-y-3">
                                <div class="text-center text-gray-500 py-8">
                                    <div class="loading-spinner mx-auto mb-2"></div>
                                    <p>Indlæser aktiviteter...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Placeholder sections for other views -->
                <section id="tasks-section" class="section-content hidden">
                    <div class="glass-card rounded-xl p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Planlagte Jobs</h2>
                        <div id="scheduled-jobs-list" class="space-y-4">
                            <div class="text-center text-gray-500 py-12">
                                <div class="loading-spinner mx-auto mb-4"></div>
                                <p>Indlæser planlagte jobs...</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section id="employees-section" class="section-content hidden">
                    <div class="glass-card rounded-xl p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Medarbejdere</h2>
                        <div id="employees-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div class="text-center text-gray-500 py-12 col-span-full">
                                <div class="loading-spinner mx-auto mb-4"></div>
                                <p>Indlæser medarbejdere...</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section id="customers-section" class="section-content hidden">
                    <!-- Customer Management Interface -->
                    <div id="customer-management-container">
                        <!-- Dynamic content loaded from customer-management.js -->
                    </div>
                </section>
                
                <section id="teams-section" class="section-content hidden">
                    <div class="glass-card rounded-xl p-6">
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Teams</h2>
                        <div id="teams-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="text-center text-gray-500 py-12 col-span-full">
                                <div class="loading-spinner mx-auto mb-4"></div>
                                <p>Indlæser teams...</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>

    <!-- Notification Toast -->
    <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2">
        <!-- Dynamic notifications will be inserted here -->
    </div>

    <script>
        // Application State
        let authToken = localStorage.getItem('authToken');
        let currentUser = null;
        let socket = null;
        
        // API Configuration
        const API_BASE = 'http://localhost:3006';
        
        // Initialize Application
        document.addEventListener('DOMContentLoaded', () => {
            if (authToken) {
                validateToken();
            } else {
                showLogin();
            }
        });
        
        // Authentication Functions
        async function login(email, password) {
            try {
                const response = await fetch(\`\${API_BASE}/api/auth/login\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    authToken = data.token;
                    currentUser = data.user;
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    showApp();
                    return { success: true };
                } else {
                    return { success: false, error: data.error };
                }
            } catch (error) {
                console.error('Login error:', error);
                return { success: false, error: 'Netværksfejl. Prøv igen.' };
            }
        }
        
        async function validateToken() {
            if (!authToken) {
                showLogin();
                return;
            }
            
            try {
                const response = await fetch(\`\${API_BASE}/api/auth/profile\`, {
                    headers: {
                        'Authorization': \`Bearer \${authToken}\`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    currentUser = data.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    showApp();
                } else {
                    logout();
                }
            } catch (error) {
                console.error('Token validation error:', error);
                logout();
            }
        }
        
        function logout() {
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            if (socket) {
                socket.disconnect();
            }
            showLogin();
        }
        
        function showLogin() {
            document.getElementById('login-modal').classList.remove('hidden');
            document.getElementById('main-app').classList.add('hidden');
        }
        
        function showApp() {
            document.getElementById('login-modal').classList.add('hidden');
            document.getElementById('loading-screen').classList.remove('hidden');
            
            // Update user info
            updateUserInfo();
            
            // Initialize WebSocket
            initializeWebSocket();
            
            // Load dashboard data
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('main-app').classList.remove('hidden');
                loadDashboard();
            }, 1000);
        }
        
        function updateUserInfo() {
            if (currentUser) {
                document.getElementById('user-name').textContent = \`\${currentUser.firstName} \${currentUser.lastName}\`;
                document.getElementById('user-email').textContent = currentUser.email;
                document.getElementById('user-avatar').textContent = currentUser.firstName[0].toUpperCase();
            }
        }
        
        // API Helper Functions
        async function apiCall(endpoint, options = {}) {
            const url = \`\${API_BASE}\${endpoint}\`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${authToken}\`
                },
                ...options
            };
            
            try {
                const response = await fetch(url, config);
                
                if (response.status === 401) {
                    logout();
                    return null;
                }
                
                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                showToast('Netværksfejl - kan ikke forbinde til server', 'error');
                return null;
            }
        }
        
        // Dashboard Functions
        async function loadDashboard() {
            try {
                // Load dashboard data
                const dashboardData = await apiCall('/api/dashboard');
                if (dashboardData && dashboardData.success) {
                    updateDashboardStats(dashboardData.data);
                    updateTodaysSchedule(dashboardData.data.todaysSchedule);
                    updateRecentActivities(dashboardData.data.recentActivity);
                }
                
                // Update connection status
                updateConnectionStatus('connected');
            } catch (error) {
                console.error('Dashboard load error:', error);
                updateConnectionStatus('error');
            }
        }
        
        function updateDashboardStats(data) {
            document.getElementById('active-jobs').textContent = data.summary.activeJobs;
            document.getElementById('employees-count').textContent = data.summary.totalEmployees;
            document.getElementById('customers-count').textContent = data.summary.totalCustomers;
            document.getElementById('rating').textContent = data.summary.rating;
        }
        
        function updateTodaysSchedule(schedule) {
            const container = document.getElementById('todays-schedule');
            
            if (!schedule.jobs || schedule.jobs.length === 0) {
                container.innerHTML = \`
                    <div class="text-center text-gray-500 py-8">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m0 0V7a2 2 0 11-4 0v4M9 11H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2h-2"></path>
                        </svg>
                        <p>Ingen jobs planlagt i dag</p>
                    </div>
                \`;
                return;
            }
            
            const jobsHTML = schedule.jobs.map(job => \`
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 rounded-full \${getStatusColor(job.status)}"></div>
                        <div>
                            <p class="font-medium text-gray-900">\${job.job.jobType}</p>
                            <p class="text-sm text-gray-500">\${job.customer.name}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-900">\${formatTime(job.scheduledStart)}</p>
                        <p class="text-xs text-gray-500">\${job.status}</p>
                    </div>
                </div>
            \`).join('');
            
            container.innerHTML = jobsHTML;
        }
        
        function updateRecentActivities(activities) {
            const container = document.getElementById('recent-activities');
            
            if (!activities || activities.length === 0) {
                container.innerHTML = \`
                    <div class="text-center text-gray-500 py-8">
                        <p>Ingen aktiviteter endnu</p>
                    </div>
                \`;
                return;
            }
            
            const activitiesHTML = activities.map(activity => \`
                <div class="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div class="w-2 h-2 rounded-full bg-blue-400"></div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900">\${activity.status}</p>
                        <p class="text-xs text-gray-500">\${activity.customerName} - \${activity.jobType}</p>
                    </div>
                    <p class="text-xs text-gray-400">\${formatRelativeTime(activity.timestamp)}</p>
                </div>
            \`).join('');
            
            container.innerHTML = activitiesHTML;
        }
        
        // WebSocket Functions
        function initializeWebSocket() {
            if (socket) {
                socket.disconnect();
            }
            
            socket = io(API_BASE);
            
            socket.on('connect', () => {
                console.log('WebSocket connected');
                updateConnectionStatus('connected');
            });
            
            socket.on('disconnect', () => {
                console.log('WebSocket disconnected');
                updateConnectionStatus('disconnected');
            });
            
            socket.on('scheduled-job-updated', (job) => {
                showToast(\`Job opdateret: \${job.job.jobType} - \${job.status}\`, 'info');
                loadDashboard(); // Refresh dashboard
            });
            
            socket.on('scheduled-job-created', (job) => {
                showToast(\`Ny job planlagt: \${job.job.jobType}\`, 'success');
                loadDashboard(); // Refresh dashboard
            });
        }
        
        // UI Helper Functions
        function updateConnectionStatus(status) {
            const statusEl = document.getElementById('connection-status');
            const textEl = document.getElementById('connection-text');
            
            switch (status) {
                case 'connected':
                    statusEl.className = 'w-3 h-3 rounded-full bg-green-400';
                    textEl.textContent = 'Online';
                    break;
                case 'disconnected':
                    statusEl.className = 'w-3 h-3 rounded-full bg-yellow-400';
                    textEl.textContent = 'Forbinder...';
                    break;
                case 'error':
                    statusEl.className = 'w-3 h-3 rounded-full bg-red-400';
                    textEl.textContent = 'Offline';
                    break;
            }
        }
        
        function getStatusColor(status) {
            switch (status) {
                case 'SCHEDULED': return 'bg-blue-400';
                case 'IN_PROGRESS': return 'bg-yellow-400';
                case 'COMPLETED': return 'bg-green-400';
                case 'CANCELLED': return 'bg-red-400';
                default: return 'bg-gray-400';
            }
        }
        
        function formatTime(dateString) {
            return new Date(dateString).toLocaleTimeString('da-DK', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        function formatRelativeTime(dateString) {
            const now = new Date();
            const date = new Date(dateString);
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            
            if (minutes < 1) return 'lige nu';
            if (minutes < 60) return \`\${minutes} min siden\`;
            
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return \`\${hours}t siden\`;
            
            const days = Math.floor(hours / 24);
            return \`\${days}d siden\`;
        }
        
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                warning: 'bg-yellow-500',
                info: 'bg-blue-500'
            };
            
            toast.className = \`notification p-4 rounded-lg text-white shadow-lg \${colors[type] || colors.info}\`;
            toast.innerHTML = \`
                <div class="flex items-center justify-between">
                    <span>\${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            \`;
            
            container.appendChild(toast);
            
            // Show animation
            setTimeout(() => toast.classList.add('show'), 100);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }
        
        // Navigation Functions
        function showSection(section) {
            // Hide all sections
            document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
            
            // Show selected section
            document.getElementById(\`\${section}-section\`).classList.remove('hidden');
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-indigo-100', 'bg-orange-100');
            });
            
            // Load section data
            switch (section) {
                case 'tasks':
                    loadScheduledJobs();
                    break;
                case 'employees':
                    loadEmployees();
                    break;
                case 'customers':
                    loadCustomersSection();
                    break;
                case 'teams':
                    loadTeams();
                    break;
                default:
                    loadDashboard();
            }
            
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                toggleSidebar();
            }
        }
        
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('open');
        }
        
        // Section Loading Functions
        async function loadScheduledJobs() {
            const container = document.getElementById('scheduled-jobs-list');
            container.innerHTML = '<div class="text-center py-8"><div class="loading-spinner mx-auto mb-4"></div><p>Indlæser planlagte jobs...</p></div>';
            
            const data = await apiCall('/api/scheduled-jobs');
            if (data && data.success) {
                // Implementation for displaying scheduled jobs
                container.innerHTML = '<p class="text-gray-500">Planlagte jobs vil blive vist her...</p>';
            }
        }
        
        async function loadEmployees() {
            const container = document.getElementById('employees-list');
            container.innerHTML = '<div class="text-center py-8 col-span-full"><div class="loading-spinner mx-auto mb-4"></div><p>Indlæser medarbejdere...</p></div>';
            
            const data = await apiCall('/api/employees');
            if (data && data.success) {
                // Implementation for displaying employees
                container.innerHTML = '<p class="text-gray-500 col-span-full">Medarbejdere vil blive vist her...</p>';
            }
        }
        
        async function loadCustomersSection() {
            // Load customer management interface
            const container = document.getElementById('customer-management-container');
            if (!container.innerHTML.trim()) {
                // Initialize customer management interface
                container.innerHTML = createCustomerManagementHTML();
                
                // Setup form handler
                const customerForm = document.getElementById('customer-form');
                if (customerForm) {
                    customerForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        const submitBtn = document.getElementById('customer-submit-btn');
                        const submitText = document.getElementById('customer-submit-text');
                        const submitSpinner = document.getElementById('customer-submit-spinner');
                        
                        // Show loading state
                        submitBtn.disabled = true;
                        submitText.textContent = editingCustomerId ? 'Opdaterer...' : 'Gemmer...';
                        submitSpinner.classList.remove('hidden');
                        
                        const formData = new FormData(customerForm);
                        await saveCustomer(formData);
                        
                        // Reset button state
                        submitBtn.disabled = false;
                        submitText.textContent = editingCustomerId ? 'Opdater Kunde' : 'Gem Kunde';
                        submitSpinner.classList.add('hidden');
                    });
                }
            }
            
            // Load customers data using the component function
            if (typeof window.loadCustomers === 'function') {
                await window.loadCustomers();
            }
        }
        
        async function loadTeams() {
            const container = document.getElementById('teams-list');
            container.innerHTML = '<div class="text-center py-8 col-span-full"><div class="loading-spinner mx-auto mb-4"></div><p>Indlæser teams...</p></div>';
            
            const data = await apiCall('/api/teams');
            if (data && data.success) {
                // Implementation for displaying teams
                container.innerHTML = '<p class="text-gray-500 col-span-full">Teams vil blive vist her...</p>';
            }
        }
        
        // Form Event Handlers
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('login-btn');
            const loginText = document.getElementById('login-text');
            const loginSpinner = document.getElementById('login-spinner');
            const errorDiv = document.getElementById('login-error');
            
            // Show loading state
            loginBtn.disabled = true;
            loginText.textContent = 'Logger ind...';
            loginSpinner.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            
            const result = await login(email, password);
            
            if (result.success) {
                // Success handled in login function
            } else {
                errorDiv.textContent = result.error;
                errorDiv.classList.remove('hidden');
            }
            
            // Reset button state
            loginBtn.disabled = false;
            loginText.textContent = 'Log ind';
            loginSpinner.classList.add('hidden');
        });
        
        // Update time
        function updateTime() {
            const now = new Date();
            document.getElementById('current-time').textContent = now.toLocaleString('da-DK', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Update time every minute
        setInterval(updateTime, 60000);
        updateTime();
        
        // Handle window resize for responsive behavior
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    </script>
</body>
</html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
  }
});

const PORT = process.env.PORT || 3051;
server.listen(PORT, () => {
  console.log(`🌐 Rendetalje OS Enhanced Frontend running on port ${PORT}`);
  console.log(`📱 Frontend URL: http://localhost:${PORT}`);
  console.log(`🔗 Backend API: http://localhost:3006`);
});

module.exports = server;