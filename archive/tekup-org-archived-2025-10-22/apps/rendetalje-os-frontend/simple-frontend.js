const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Serve the main page
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rendetalje OS - Professionel Rengøringsstyring</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-5xl font-bold text-gray-800 mb-4">
                🧹 Rendetalje OS
            </h1>
            <p class="text-xl text-gray-600 mb-2">
                Professionel Rengøringsstyring - Dansk Edition
            </p>
            <p class="text-sm text-gray-500" id="api-status">
                API Status: Checking...
            </p>
        </div>

        <!-- Quick Stats -->
        <div class="grid md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">📋 Opgaver</h3>
                <p class="text-3xl font-bold text-blue-600">12</p>
                <p class="text-sm text-gray-500">Aktive i dag</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">👥 Medarbejdere</h3>
                <p class="text-3xl font-bold text-green-600">8</p>
                <p class="text-sm text-gray-500">På arbejde</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibent text-gray-700 mb-2">💰 Omsætning</h3>
                <p class="text-3xl font-bold text-indigo-600">125k</p>
                <p class="text-sm text-gray-500">DKK denne måned</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">⭐ Rating</h3>
                <p class="text-3xl font-bold text-yellow-600">4.8</p>
                <p class="text-sm text-gray-500">Gennemsnit</p>
            </div>
        </div>

        <!-- Navigation Cards -->
        <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" onclick="openPlanning()">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">📅 Planlægning</h2>
                <p class="text-gray-600 mb-4">AI-optimeret rute og opgaveplanlægning</p>
                <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Åbn Planlægning
                </button>
            </div>
            <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" onclick="openDashboard()">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">📊 Dashboard</h2>
                <p class="text-gray-600 mb-4">Realtids overblik over alle opgaver</p>
                <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    Se Dashboard
                </button>
            </div>
            <div class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" onclick="openSettings()">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">⚙️ Indstillinger</h2>
                <p class="text-gray-600 mb-4">Konfigurer system og medarbejdere</p>
                <button class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">
                    Åbn Indstillinger
                </button>
            </div>
        </div>

        <!-- Business Data -->
        <div class="mt-12 bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold text-gray-800 mb-4">💼 Forretningsdata</h3>
            <div class="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                    <strong>Timepris:</strong> 349 kr/time inkl. moms
                </div>
                <div>
                    <strong>MobilePay:</strong> 71759
                </div>
                <div>
                    <strong>Serviceområde:</strong> Aarhus og omegn
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-12 text-gray-500">
            <p>Rendetalje OS - Bygget med ❤️ i Danmark</p>
            <p class="text-sm">Backend API: http://localhost:3006 | Frontend: http://localhost:3051</p>
        </div>
    </div>

    <script>
        // Test API connection
        async function checkApiStatus() {
            try {
                const response = await fetch('http://localhost:3006/health');
                const data = await response.json();
                document.getElementById('api-status').textContent = 'API Status: ' + data.message;
                document.getElementById('api-status').className = 'text-sm text-green-500';
            } catch (error) {
                document.getElementById('api-status').textContent = 'API Status: Connection Failed';
                document.getElementById('api-status').className = 'text-sm text-red-500';
            }
        }

        function openPlanning() {
            alert('Planlægningsmodul kommer snart! 🚀\\n\\nDenne funktion vil indeholde:\\n- AI rute optimering\\n- Automatisk task scheduling\\n- Danske arbejdstidsregler\\n- GPS tracking');
        }

        async function openDashboard() {
            const dashboardDiv = document.createElement('div');
            dashboardDiv.innerHTML = '' +
                '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeDashboard()">' +
                    '<div class="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">' +
                        '<div class="flex justify-between items-center mb-6">' +
                            '<h2 class="text-2xl font-bold">📊 Live Dashboard</h2>' +
                            '<button onclick="closeDashboard()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>' +
                        '</div>' +
                        '<div id="dashboard-content" class="space-y-6">' +
                            '<div class="text-center">Loading dashboard data...</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(dashboardDiv);
            
            try {
                // Load statistics from API
                const statsResponse = await fetch('http://localhost:3006/api/statistics');
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    displayDashboardData(statsData.data);
                } else {
                    document.getElementById('dashboard-content').innerHTML = '<div class="text-red-500">Could not load dashboard data</div>';
                }
            } catch (error) {
                document.getElementById('dashboard-content').innerHTML = '<div class="text-red-500">API connection failed</div>';
            }
        }
        
        function displayDashboardData(stats) {
            var servicesHtml = stats.businessData.services.map(function(service) { return '<div>• ' + service + '</div>'; }).join('');
            document.getElementById('dashboard-content').innerHTML = 
                '<div class="grid md:grid-cols-4 gap-4 mb-6">' +
                    '<div class="bg-blue-50 p-4 rounded">' +
                        '<h3 class="font-semibold text-blue-700">📋 Aktive Opgaver</h3>' +
                        '<p class="text-2xl font-bold text-blue-600">' + stats.activeTasks + '</p>' +
                    '</div>' +
                    '<div class="bg-green-50 p-4 rounded">' +
                        '<h3 class="font-semibold text-green-700">👥 Medarbejdere</h3>' +
                        '<p class="text-2xl font-bold text-green-600">' + stats.employees + '</p>' +
                    '</div>' +
                    '<div class="bg-indigo-50 p-4 rounded">' +
                        '<h3 class="font-semibold text-indigo-700">✅ Afsluttet i dag</h3>' +
                        '<p class="text-2xl font-bold text-indigo-600">' + stats.completedToday + '</p>' +
                    '</div>' +
                    '<div class="bg-yellow-50 p-4 rounded">' +
                        '<h3 class="font-semibold text-yellow-700">⭐ Vurdering</h3>' +
                        '<p class="text-2xl font-bold text-yellow-600">' + stats.rating + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="grid md:grid-cols-2 gap-6">' +
                    '<div class="bg-gray-50 p-4 rounded">' +
                        '<h3 class="font-bold text-lg mb-3">💰 Forretningsdata</h3>' +
                        '<div class="space-y-2 text-sm">' +
                            '<div><strong>Timepris:</strong> ' + stats.businessData.hourlyRate + ' kr/time inkl. moms</div>' +
                            '<div><strong>MobilePay:</strong> ' + stats.businessData.mobilePay + '</div>' +
                            '<div><strong>Serviceområde:</strong> ' + stats.businessData.serviceArea + '</div>' +
                            '<div><strong>Månedlig omsætning:</strong> ' + (stats.monthlyRevenue / 1000).toFixed(0) + 'k DKK</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="bg-gray-50 p-4 rounded">' +
                        '<h3 class="font-bold text-lg mb-3">🧹 Services</h3>' +
                        '<div class="space-y-1 text-sm">' + servicesHtml + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="mt-6">' +
                    '<button onclick="loadTasks()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2">' +
                        '📋 Vis Opgaver' +
                    '</button>' +
                    '<button onclick="loadEmployees()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2">' +
                        '👥 Vis Medarbejdere' +
                    '</button>' +
                    '<button onclick="loadCustomers()" class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">' +
                        '🏢 Vis Kunder' +
                    '</button>' +
                '</div>' +
                '<div id="data-section" class="mt-6"></div>';
        }
        
        function closeDashboard() {
            const modal = document.querySelector('.fixed.inset-0');
            if (modal) modal.remove();
        }
        
        async function loadTasks() {
            const dataSection = document.getElementById('data-section');
            dataSection.innerHTML = '<div class="text-center">Loading opgaver...</div>';
            
            try {
                const response = await fetch('http://localhost:3006/api/tasks');
                if (response.ok) {
                    const data = await response.json();
                    displayTasks(data.data);
                } else {
                    dataSection.innerHTML = '<div class="text-red-500">Kunne ikke indlæse opgaver</div>';
                }
            } catch (error) {
                dataSection.innerHTML = '<div class="text-red-500">API forbindelse fejlede</div>';
            }
        }
        
        function displayTasks(tasks) {
            const dataSection = document.getElementById('data-section');
            var tasksHtml = tasks.map(function(task) {
                var statusClass = task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800';
                return '<div class="border rounded-lg p-4 bg-white shadow-sm">' +
                    '<div class="flex justify-between items-start mb-2">' +
                        '<h4 class="font-semibold text-lg">' + task.title + '</h4>' +
                        '<span class="px-2 py-1 rounded text-xs ' + statusClass + '">' + task.status + '</span>' +
                    '</div>' +
                    '<div class="grid md:grid-cols-2 gap-4 text-sm text-gray-600">' +
                        '<div>' +
                            '<div><strong>Kunde:</strong> ' + task.customer + '</div>' +
                            '<div><strong>Medarbejder:</strong> ' + task.employee + '</div>' +
                            '<div><strong>Type:</strong> ' + task.type + '</div>' +
                        '</div>' +
                        '<div>' +
                            '<div><strong>Lokation:</strong> ' + task.location + '</div>' +
                            '<div><strong>Varighed:</strong> ' + task.duration + ' min</div>' +
                            '<div><strong>Prioritet:</strong> ' + task.priority + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
            
            dataSection.innerHTML = 
                '<h3 class="text-xl font-bold mb-4">📋 Aktive Opgaver</h3>' +
                '<div class="space-y-3">' + tasksHtml + '</div>';
        }
        
        async function loadEmployees() {
            const dataSection = document.getElementById('data-section');
            dataSection.innerHTML = '<div class="text-center">Loading medarbejdere...</div>';
            
            try {
                const response = await fetch('http://localhost:3006/api/employees');
                if (response.ok) {
                    const data = await response.json();
                    displayEmployees(data.data);
                } else {
                    dataSection.innerHTML = '<div class="text-red-500">Kunne ikke indlæse medarbejdere</div>';
                }
            } catch (error) {
                dataSection.innerHTML = '<div class="text-red-500">API forbindelse fejlede</div>';
            }
        }
        
        function displayEmployees(employees) {
            const dataSection = document.getElementById('data-section');
            var employeesHtml = employees.map(function(emp) {
                return '<div class="border rounded-lg p-4 bg-white shadow-sm">' +
                    '<div class="flex justify-between items-center mb-2">' +
                        '<h4 class="font-semibold text-lg">' + emp.name + '</h4>' +
                        '<span class="px-2 py-1 rounded text-xs bg-green-100 text-green-800">' + emp.status + '</span>' +
                    '</div>' +
                    '<div class="text-sm text-gray-600 space-y-1">' +
                        '<div><strong>Position:</strong> ' + emp.position + '</div>' +
                        '<div><strong>Telefon:</strong> ' + emp.phone + '</div>' +
                        '<div><strong>Email:</strong> ' + emp.email + '</div>' +
                        '<div><strong>Arbejdstid:</strong> ' + emp.workingHours + '</div>' +
                        '<div><strong>Specialer:</strong> ' + emp.specializations.join(', ') + '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
            
            dataSection.innerHTML = 
                '<h3 class="text-xl font-bold mb-4">👥 Medarbejdere</h3>' +
                '<div class="grid md:grid-cols-2 gap-4">' + employeesHtml + '</div>';
        }
        
        async function loadCustomers() {
            const dataSection = document.getElementById('data-section');
            dataSection.innerHTML = '<div class="text-center">Loading kunder...</div>';
            
            try {
                const response = await fetch('http://localhost:3006/api/customers');
                if (response.ok) {
                    const data = await response.json();
                    displayCustomers(data.data);
                } else {
                    dataSection.innerHTML = '<div class="text-red-500">Kunne ikke indlæse kunder</div>';
                }
            } catch (error) {
                dataSection.innerHTML = '<div class="text-red-500">API forbindelse fejlede</div>';
            }
        }
        
        function displayCustomers(customers) {
            const dataSection = document.getElementById('data-section');
            var customersHtml = customers.map(function(customer) {
                return '<div class="border rounded-lg p-4 bg-white shadow-sm">' +
                    '<div class="flex justify-between items-start mb-2">' +
                        '<h4 class="font-semibold text-lg">' + customer.name + '</h4>' +
                        '<span class="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">' + customer.type + '</span>' +
                    '</div>' +
                    '<div class="grid md:grid-cols-2 gap-4 text-sm text-gray-600">' +
                        '<div>' +
                            '<div><strong>Adresse:</strong> ' + customer.address + '</div>' +
                            '<div><strong>Telefon:</strong> ' + customer.phone + '</div>' +
                            '<div><strong>Email:</strong> ' + customer.email + '</div>' +
                        '</div>' +
                        '<div>' +
                            '<div><strong>Kontrakt:</strong> ' + customer.contractType + '</div>' +
                            '<div><strong>Services:</strong> ' + customer.services.join(', ') + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
            
            dataSection.innerHTML = 
                '<h3 class="text-xl font-bold mb-4">🏢 Kunder</h3>' +
                '<div class="space-y-3">' + customersHtml + '</div>';
        }

        function openSettings() {
            alert('Indstillinger kommer snart! ⚙️\\n\\nDenne funktion vil indeholde:\\n- Medarbejder administration\\n- System konfiguration\\n- Integration med Billy\\n- Backup indstillinger');
        }

        // Check API status on load
        checkApiStatus();
        
        // Refresh API status every 30 seconds
        setInterval(checkApiStatus, 30000);
    </script>
</body>
</html>
    `);
    return;
  }

  // Handle other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const port = process.env.PORT || 3051;
server.listen(port, () => {
  console.log(`🎨 Rendetalje OS Frontend running on port ${port}`);
  console.log(`🌐 Open: http://localhost:${port}`);
});