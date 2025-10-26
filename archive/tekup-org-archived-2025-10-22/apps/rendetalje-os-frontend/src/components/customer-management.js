// Customer Management Component
// Full CRUD interface for customer management with Danish interface

function createCustomerManagementHTML() {
    return `
        <!-- Customer Management Section -->
        <div class="space-y-6">
            <!-- Header with Add Customer Button -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Kundestyring</h2>
                    <p class="text-gray-500">Administrer alle dine kunder og deres jobhistorik</p>
                </div>
                <button onclick="showAddCustomerModal()" class="btn-primary px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span>Ny Kunde</span>
                </button>
            </div>

            <!-- Search and Filters -->
            <div class="glass-card rounded-xl p-6">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex-1">
                        <input type="text" id="customer-search" placeholder="Søg efter kunde navn, email eller adresse..." 
                               class="form-input w-full px-4 py-2 rounded-lg focus:outline-none"
                               oninput="filterCustomers(this.value)">
                    </div>
                    <div class="flex gap-2">
                        <select id="customer-type-filter" onchange="filterCustomersByType(this.value)" 
                                class="form-input px-4 py-2 rounded-lg focus:outline-none">
                            <option value="">Alle Typer</option>
                            <option value="RESIDENTIAL">Private</option>
                            <option value="COMMERCIAL">Erhverv</option>
                            <option value="OFFICE">Kontor</option>
                        </select>
                        <select id="contract-type-filter" onchange="filterCustomersByContract(this.value)" 
                                class="form-input px-4 py-2 rounded-lg focus:outline-none">
                            <option value="">Alle Kontrakter</option>
                            <option value="ONE_TIME">Engangsjob</option>
                            <option value="RECURRING">Tilbagevendende</option>
                            <option value="SUBSCRIPTION">Abonnement</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Customer Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="glass-card rounded-xl p-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Total Kunder</p>
                            <p id="total-customers" class="text-xl font-bold text-gray-900">-</p>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Aktive Kunder</p>
                            <p id="active-customers" class="text-xl font-bold text-gray-900">-</p>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Erhvervskunder</p>
                            <p id="business-customers" class="text-xl font-bold text-gray-900">-</p>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card rounded-xl p-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Abonnementer</p>
                            <p id="subscription-customers" class="text-xl font-bold text-gray-900">-</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customers List -->
            <div class="glass-card rounded-xl overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800">Kundeliste</h3>
                </div>
                
                <div id="customers-table-container">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontrakt</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handlinger</th>
                                </tr>
                            </thead>
                            <tbody id="customers-table-body" class="bg-white divide-y divide-gray-200">
                                <!-- Dynamic content -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Loading State -->
                <div id="customers-loading" class="text-center py-12">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-gray-500">Indlæser kunder...</p>
                </div>

                <!-- Empty State -->
                <div id="customers-empty" class="text-center py-12 hidden">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Ingen kunder fundet</h3>
                    <p class="text-gray-500 mb-4">Kom i gang ved at tilføje din første kunde</p>
                    <button onclick="showAddCustomerModal()" class="btn-primary px-6 py-2 rounded-lg text-white font-medium">
                        Tilføj Kunde
                    </button>
                </div>
            </div>
        </div>

        <!-- Add/Edit Customer Modal -->
        <div id="customer-modal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 glass-card animate-fade-in max-h-90vh overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h2 id="customer-modal-title" class="text-2xl font-bold text-gray-900">Ny Kunde</h2>
                    <button onclick="hideCustomerModal()" class="p-2 hover:bg-gray-100 rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="customer-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Basic Information -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-gray-800">Grundoplysninger</h3>
                            
                            <div>
                                <label for="customer-name" class="block text-sm font-medium text-gray-700 mb-2">Navn *</label>
                                <input type="text" id="customer-name" name="name" required 
                                       class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                                       placeholder="Firma eller personnavn">
                            </div>
                            
                            <div>
                                <label for="customer-email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input type="email" id="customer-email" name="email" 
                                       class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                                       placeholder="kunde@example.com">
                            </div>
                            
                            <div>
                                <label for="customer-phone" class="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                                <input type="tel" id="customer-phone" name="phone" 
                                       class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                                       placeholder="+45 12 34 56 78">
                            </div>
                        </div>

                        <!-- Address & Location -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-gray-800">Adresse & Lokation</h3>
                            
                            <div>
                                <label for="customer-address" class="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                                <input type="text" id="customer-address" name="address" required 
                                       class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                                       placeholder="Gadenavn 123, 2000 Frederiksberg"
                                       onblur="geocodeAddress()">
                            </div>
                            
                            <div>
                                <label for="customer-municipality" class="block text-sm font-medium text-gray-700 mb-2">Kommune *</label>
                                <input type="text" id="customer-municipality" name="municipality" required 
                                       class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                                       placeholder="København, Aarhus, Odense...">
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label for="customer-lat" class="block text-sm font-medium text-gray-700 mb-2">Breddegrad</label>
                                    <input type="number" id="customer-lat" name="lat" step="any" readonly
                                           class="form-input w-full px-4 py-3 rounded-lg focus:outline-none bg-gray-50"
                                           placeholder="55.6761">
                                </div>
                                <div>
                                    <label for="customer-lon" class="block text-sm font-medium text-gray-700 mb-2">Længdegrad</label>
                                    <input type="number" id="customer-lon" name="lon" step="any" readonly
                                           class="form-input w-full px-4 py-3 rounded-lg focus:outline-none bg-gray-50"
                                           placeholder="12.5683">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Customer & Contract Type -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="customer-type" class="block text-sm font-medium text-gray-700 mb-2">Kundetype *</label>
                            <select id="customer-type" name="customerType" required 
                                    class="form-input w-full px-4 py-3 rounded-lg focus:outline-none">
                                <option value="">Vælg type</option>
                                <option value="RESIDENTIAL">Private</option>
                                <option value="COMMERCIAL">Erhverv</option>
                                <option value="OFFICE">Kontor</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="contract-type" class="block text-sm font-medium text-gray-700 mb-2">Kontrakttype *</label>
                            <select id="contract-type" name="contractType" required 
                                    class="form-input w-full px-4 py-3 rounded-lg focus:outline-none">
                                <option value="">Vælg type</option>
                                <option value="ONE_TIME">Engangsjob</option>
                                <option value="RECURRING">Tilbagevendende</option>
                                <option value="SUBSCRIPTION">Abonnement</option>
                            </select>
                        </div>
                    </div>

                    <!-- Preferences -->
                    <div>
                        <label for="customer-preferences" class="block text-sm font-medium text-gray-700 mb-2">Præferencer & Noter</label>
                        <textarea id="customer-preferences" name="preferences" rows="4" 
                                  class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
                                  placeholder="Specielle ønsker, allergier, adgangsinformationer..."></textarea>
                    </div>

                    <!-- Form Actions -->
                    <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button type="button" onclick="hideCustomerModal()" 
                                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                            Annuller
                        </button>
                        <button type="submit" id="customer-submit-btn" 
                                class="btn-primary px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2">
                            <span id="customer-submit-text">Gem Kunde</span>
                            <div id="customer-submit-spinner" class="loading-spinner hidden"></div>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Customer Detail Modal -->
        <div id="customer-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 glass-card animate-fade-in max-h-90vh overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h2 id="customer-detail-title" class="text-2xl font-bold text-gray-900">Kunde Detaljer</h2>
                    <button onclick="hideCustomerDetailModal()" class="p-2 hover:bg-gray-100 rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div id="customer-detail-content">
                    <!-- Dynamic content -->
                </div>
            </div>
        </div>
    `;
}

// Customer Management Functions
let allCustomers = [];
let filteredCustomers = [];
let editingCustomerId = null;

// Export functions to window object for global access
window.createCustomerManagementHTML = createCustomerManagementHTML;
window.loadCustomers = loadCustomers;
window.showAddCustomerModal = showAddCustomerModal;
window.hideCustomerModal = hideCustomerModal;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.viewCustomerDetails = viewCustomerDetails;
window.hideCustomerDetailModal = hideCustomerDetailModal;
window.filterCustomers = filterCustomers;
window.filterCustomersByType = filterCustomersByType;
window.filterCustomersByContract = filterCustomersByContract;
window.geocodeAddress = geocodeAddress;
window.saveCustomer = saveCustomer;

async function loadCustomers() {
    try {
        const container = document.getElementById('customers-table-body');
        const loading = document.getElementById('customers-loading');
        const empty = document.getElementById('customers-empty');
        
        // Show loading
        loading.classList.remove('hidden');
        container.innerHTML = '';
        empty.classList.add('hidden');
        
        const data = await apiCall('/api/customers');
        if (data && data.success) {
            allCustomers = data.data;
            filteredCustomers = [...allCustomers];
            
            updateCustomerStats();
            renderCustomersTable();
        } else {
            throw new Error('Failed to load customers');
        }
        
        // Hide loading
        loading.classList.add('hidden');
        
    } catch (error) {
        console.error('Load customers error:', error);
        document.getElementById('customers-loading').classList.add('hidden');
        showToast('Fejl ved indlæsning af kunder', 'error');
    }
}

function updateCustomerStats() {
    const total = allCustomers.length;
    const active = allCustomers.filter(c => c.status === 'ACTIVE').length;
    const business = allCustomers.filter(c => c.customerType !== 'RESIDENTIAL').length;
    const subscriptions = allCustomers.filter(c => c.contractType === 'SUBSCRIPTION').length;
    
    document.getElementById('total-customers').textContent = total;
    document.getElementById('active-customers').textContent = active;
    document.getElementById('business-customers').textContent = business;
    document.getElementById('subscription-customers').textContent = subscriptions;
}

function renderCustomersTable() {
    const container = document.getElementById('customers-table-body');
    const empty = document.getElementById('customers-empty');
    
    if (filteredCustomers.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    
    const customersHTML = filteredCustomers.map(customer => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        ${customer.name[0].toUpperCase()}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${customer.name}</div>
                        <div class="text-sm text-gray-500">${customer.email || 'Ingen email'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(customer.customerType)}">
                    ${getCustomerTypeLabel(customer.customerType)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getContractTypeColor(customer.contractType)}">
                    ${getContractTypeLabel(customer.contractType)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${customer.jobs ? customer.jobs.length : 0} jobs
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                    ${customer.status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center space-x-2">
                    <button onclick="viewCustomerDetails('${customer.id}')" 
                            class="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="Se detaljer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                    </button>
                    <button onclick="editCustomer('${customer.id}')" 
                            class="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded" title="Rediger">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="deleteCustomer('${customer.id}')" 
                            class="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded" title="Slet">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = customersHTML;
}

// Helper functions for styling
function getCustomerTypeColor(type) {
    switch (type) {
        case 'RESIDENTIAL': return 'bg-green-100 text-green-800';
        case 'COMMERCIAL': return 'bg-blue-100 text-blue-800';
        case 'OFFICE': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getCustomerTypeLabel(type) {
    switch (type) {
        case 'RESIDENTIAL': return 'Private';
        case 'COMMERCIAL': return 'Erhverv';
        case 'OFFICE': return 'Kontor';
        default: return type;
    }
}

function getContractTypeColor(type) {
    switch (type) {
        case 'ONE_TIME': return 'bg-yellow-100 text-yellow-800';
        case 'RECURRING': return 'bg-blue-100 text-blue-800';
        case 'SUBSCRIPTION': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getContractTypeLabel(type) {
    switch (type) {
        case 'ONE_TIME': return 'Engangs';
        case 'RECURRING': return 'Tilbagevendende';
        case 'SUBSCRIPTION': return 'Abonnement';
        default: return type;
    }
}

// Filtering functions
function filterCustomers(searchTerm) {
    filteredCustomers = allCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderCustomersTable();
}

function filterCustomersByType(type) {
    const searchTerm = document.getElementById('customer-search').value;
    const contractType = document.getElementById('contract-type-filter').value;
    
    applyAllFilters(searchTerm, type, contractType);
}

function filterCustomersByContract(contractType) {
    const searchTerm = document.getElementById('customer-search').value;
    const customerType = document.getElementById('customer-type-filter').value;
    
    applyAllFilters(searchTerm, customerType, contractType);
}

function applyAllFilters(searchTerm, customerType, contractType) {
    filteredCustomers = allCustomers.filter(customer => {
        const matchesSearch = !searchTerm || 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            customer.address.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCustomerType = !customerType || customer.customerType === customerType;
        const matchesContractType = !contractType || customer.contractType === contractType;
        
        return matchesSearch && matchesCustomerType && matchesContractType;
    });
    
    renderCustomersTable();
}

// Modal functions
function showAddCustomerModal() {
    editingCustomerId = null;
    document.getElementById('customer-modal-title').textContent = 'Ny Kunde';
    document.getElementById('customer-submit-text').textContent = 'Gem Kunde';
    document.getElementById('customer-form').reset();
    document.getElementById('customer-modal').classList.remove('hidden');
}

function showEditCustomerModal(customer) {
    editingCustomerId = customer.id;
    document.getElementById('customer-modal-title').textContent = 'Rediger Kunde';
    document.getElementById('customer-submit-text').textContent = 'Opdater Kunde';
    
    // Fill form with customer data
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-phone').value = customer.phone || '';
    document.getElementById('customer-address').value = customer.address;
    document.getElementById('customer-municipality').value = customer.municipality;
    document.getElementById('customer-lat').value = customer.coordinates?.lat || '';
    document.getElementById('customer-lon').value = customer.coordinates?.lon || '';
    document.getElementById('customer-type').value = customer.customerType;
    document.getElementById('contract-type').value = customer.contractType;
    document.getElementById('customer-preferences').value = typeof customer.preferences === 'object' ? 
        JSON.stringify(customer.preferences) : (customer.preferences || '');
    
    document.getElementById('customer-modal').classList.remove('hidden');
}

function hideCustomerModal() {
    document.getElementById('customer-modal').classList.add('hidden');
    editingCustomerId = null;
}

// CRUD operations
async function saveCustomer(formData) {
    try {
        const customerData = {
            name: formData.get('name'),
            email: formData.get('email') || null,
            phone: formData.get('phone') || null,
            address: formData.get('address'),
            municipality: formData.get('municipality'),
            coordinates: {
                lat: parseFloat(formData.get('lat')) || 55.6761,
                lon: parseFloat(formData.get('lon')) || 12.5683
            },
            customerType: formData.get('customerType'),
            contractType: formData.get('contractType'),
            preferences: formData.get('preferences') || null
        };

        let result;
        if (editingCustomerId) {
            // Update existing customer
            result = await apiCall(`/api/customers/${editingCustomerId}`, {
                method: 'PUT',
                body: JSON.stringify(customerData)
            });
        } else {
            // Create new customer
            result = await apiCall('/api/customers', {
                method: 'POST',
                body: JSON.stringify(customerData)
            });
        }

        if (result && result.success) {
            showToast(editingCustomerId ? 'Kunde opdateret' : 'Kunde oprettet', 'success');
            hideCustomerModal();
            loadCustomers();
        } else {
            throw new Error(result?.error || 'Failed to save customer');
        }
    } catch (error) {
        console.error('Save customer error:', error);
        showToast('Fejl ved gemning af kunde', 'error');
    }
}

async function editCustomer(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (customer) {
        showEditCustomerModal(customer);
    }
}

async function deleteCustomer(customerId) {
    if (confirm('Er du sikker på, at du vil slette denne kunde?')) {
        try {
            const result = await apiCall(`/api/customers/${customerId}`, {
                method: 'DELETE'
            });

            if (result && result.success) {
                showToast('Kunde slettet', 'success');
                loadCustomers();
            } else {
                throw new Error('Failed to delete customer');
            }
        } catch (error) {
            console.error('Delete customer error:', error);
            showToast('Fejl ved sletning af kunde', 'error');
        }
    }
}

async function viewCustomerDetails(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) return;

    document.getElementById('customer-detail-title').textContent = customer.name;
    
    // Build detailed customer view with job history
    const detailHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Customer Information -->
            <div class="space-y-6">
                <div class="glass-card rounded-xl p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Kunde Information</h3>
                    <dl class="space-y-3">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Navn</dt>
                            <dd class="text-sm text-gray-900">${customer.name}</dd>
                        </div>
                        ${customer.email ? `
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Email</dt>
                            <dd class="text-sm text-gray-900">${customer.email}</dd>
                        </div>
                        ` : ''}
                        ${customer.phone ? `
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Telefon</dt>
                            <dd class="text-sm text-gray-900">${customer.phone}</dd>
                        </div>
                        ` : ''}
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Adresse</dt>
                            <dd class="text-sm text-gray-900">${customer.address}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Kommune</dt>
                            <dd class="text-sm text-gray-900">${customer.municipality}</dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Kundetype</dt>
                            <dd><span class="px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(customer.customerType)}">
                                ${getCustomerTypeLabel(customer.customerType)}
                            </span></dd>
                        </div>
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Kontrakttype</dt>
                            <dd><span class="px-2 py-1 text-xs font-semibold rounded-full ${getContractTypeColor(customer.contractType)}">
                                ${getContractTypeLabel(customer.contractType)}
                            </span></dd>
                        </div>
                    </dl>
                </div>
            </div>

            <!-- Job History -->
            <div class="space-y-6">
                <div class="glass-card rounded-xl p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Job Historik</h3>
                    <div class="space-y-3">
                        ${customer.jobs && customer.jobs.length > 0 ? 
                            customer.jobs.map(job => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p class="font-medium text-gray-900">${job.jobType}</p>
                                        <p class="text-sm text-gray-500">${new Date(job.createdAt).toLocaleDateString('da-DK')}</p>
                                    </div>
                                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                        ${job.status}
                                    </span>
                                </div>
                            `).join('') :
                            '<p class="text-gray-500 text-center py-8">Ingen jobs endnu</p>'
                        }
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
            <button onclick="editCustomer('${customer.id}'); hideCustomerDetailModal();" 
                    class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Rediger Kunde
            </button>
            <button onclick="hideCustomerDetailModal()" 
                    class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Luk
            </button>
        </div>
    `;
    
    document.getElementById('customer-detail-content').innerHTML = detailHTML;
    document.getElementById('customer-detail-modal').classList.remove('hidden');
}

function hideCustomerDetailModal() {
    document.getElementById('customer-detail-modal').classList.add('hidden');
}

// Geocoding function (simplified - in production you'd use Google Maps API)
async function geocodeAddress() {
    const address = document.getElementById('customer-address').value;
    if (!address) return;
    
    // Simplified geocoding for Danish addresses
    // In production, integrate with Google Maps Geocoding API
    const danishCities = {
        'københavn': { lat: 55.6761, lon: 12.5683 },
        'aarhus': { lat: 56.1629, lon: 10.2039 },
        'odense': { lat: 55.4038, lon: 10.4024 },
        'aalborg': { lat: 57.0488, lon: 9.9217 },
        'esbjerg': { lat: 55.4658, lon: 8.4517 },
        'bagsværd': { lat: 55.7586, lon: 12.4629 },
        'frederiksberg': { lat: 55.6788, lon: 12.5344 }
    };
    
    const city = Object.keys(danishCities).find(city => 
        address.toLowerCase().includes(city)
    );
    
    if (city) {
        document.getElementById('customer-lat').value = danishCities[city].lat;
        document.getElementById('customer-lon').value = danishCities[city].lon;
    }
}