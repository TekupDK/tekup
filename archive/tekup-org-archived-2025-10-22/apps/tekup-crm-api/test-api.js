#!/usr/bin/env node

/**
 * Test script for Danish Cleaning System API
 * Tests all major endpoints to ensure they work correctly
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
let authToken = '';
let tenantId = '';
let userId = '';
let customerId = '';
let jobId = '';
let teamMemberId = '';

// Test data
const testTenant = {
  name: 'Test Rengøringsfirma A/S',
  domain: 'test-rengoering.dk',
  address: 'Testvej 123',
  city: 'København',
  postalCode: '2100',
  phone: '+45 33 12 34 56',
  email: 'test@rengoering.dk',
  industry: 'CLEANING',
  size: 'SMALL',
  isActive: true
};

const testUser = {
  email: 'admin@test-rengoering.dk',
  password: 'TestPassword123!',
  name: 'Test Administrator',
  role: 'ADMIN'
};

const testCustomer = {
  name: 'Copenhagen Business Center',
  segment: 'COMMERCIAL',
  email: 'kontakt@cbcenter.dk',
  phone: '+45 33 12 34 56',
  address: 'Vesterbrogade 123',
  city: 'København V',
  postalCode: '1620',
  cvrNumber: '87654321',
  annualContractValue: 500000,
  serviceLevel: 'ENTERPRISE'
};

const testTeamMember = {
  name: 'Anna Larsen',
  role: 'CLEANER',
  phone: '+45 31 87 65 43',
  email: 'anna@test-rengoering.dk',
  hourlyRate: 250,
  skills: ['BASIC_CLEANING', 'WINDOW_CLEANING'],
  certifications: ['Kemikaliesikkerhed', 'Førstehjælp']
};

const testJob = {
  customerId: '', // Will be set after customer creation
  title: 'Ugeligt kontorrenhold - Hovedkontor',
  description: 'Fuld rengøring af kontorområder, køkkener, toiletter og mødelokaler.',
  jobType: 'KONTORRENHOLD',
  priority: 'NORMAL',
  scheduledDate: '2025-09-15T18:00:00Z',
  scheduledTime: '18:00',
  estimatedDuration: 240
};

// Helper functions
const log = (message, data = null) => {
  console.log(`\n✅ ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const logError = (message, error) => {
  console.log(`\n❌ ${message}`);
  if (error.response) {
    console.log(`Status: ${error.response.status}`);
    console.log(`Data:`, error.response.data);
  } else {
    console.log(`Error:`, error.message);
  }
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Test functions
const testHealthCheck = async () => {
  try {
    const response = await makeRequest('GET', '/health');
    log('Health check passed', response);
    return true;
  } catch (error) {
    logError('Health check failed', error);
    return false;
  }
};

const testAuth = async () => {
  try {
    // Register user
    const registerResponse = await makeRequest('POST', '/auth/register', {
      ...testUser,
      tenantId: 'temp' // Will be updated after tenant creation
    });
    log('User registration successful', registerResponse);
    
    // Login
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.access_token;
    userId = loginResponse.user.id;
    tenantId = loginResponse.user.tenantId;
    
    log('Login successful', { userId, tenantId });
    return true;
  } catch (error) {
    logError('Authentication failed', error);
    return false;
  }
};

const testTenantManagement = async () => {
  try {
    // Create tenant
    const tenantResponse = await makeRequest('POST', '/tenants', testTenant, {
      'Authorization': `Bearer ${authToken}`
    });
    
    tenantId = tenantResponse.id;
    log('Tenant created successfully', tenantResponse);
    
    // Get tenant statistics
    const statsResponse = await makeRequest('GET', `/tenants/${tenantId}/statistics`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Tenant statistics retrieved', statsResponse);
    
    return true;
  } catch (error) {
    logError('Tenant management failed', error);
    return false;
  }
};

const testCustomerManagement = async () => {
  try {
    // Create customer
    const customerResponse = await makeRequest('POST', '/customers', testCustomer, {
      'Authorization': `Bearer ${authToken}`
    });
    
    customerId = customerResponse.id;
    testJob.customerId = customerId;
    log('Customer created successfully', customerResponse);
    
    // Get customers
    const customersResponse = await makeRequest('GET', '/customers', null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Customers retrieved', customersResponse);
    
    // Get customer statistics
    const statsResponse = await makeRequest('GET', `/customers/${customerId}/statistics`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Customer statistics retrieved', statsResponse);
    
    return true;
  } catch (error) {
    logError('Customer management failed', error);
    return false;
  }
};

const testTeamManagement = async () => {
  try {
    // Create team member
    const teamResponse = await makeRequest('POST', '/team', testTeamMember, {
      'Authorization': `Bearer ${authToken}`
    });
    
    teamMemberId = teamResponse.id;
    log('Team member created successfully', teamResponse);
    
    // Get available team members
    const availableResponse = await makeRequest('GET', '/team/available?date=2025-09-15&startTime=09:00&endTime=17:00', null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Available team members retrieved', availableResponse);
    
    return true;
  } catch (error) {
    logError('Team management failed', error);
    return false;
  }
};

const testJobManagement = async () => {
  try {
    // Create job
    const jobResponse = await makeRequest('POST', '/jobs', testJob, {
      'Authorization': `Bearer ${authToken}`
    });
    
    jobId = jobResponse.id;
    log('Job created successfully', jobResponse);
    
    // Assign team member to job
    const assignResponse = await makeRequest('POST', `/jobs/${jobId}/team-members/assign`, {
      teamMemberId: teamMemberId,
      role: 'Team Leader'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Team member assigned to job', assignResponse);
    
    // Get job statistics
    const statsResponse = await makeRequest('GET', '/jobs/statistics', null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Job statistics retrieved', statsResponse);
    
    return true;
  } catch (error) {
    logError('Job management failed', error);
    return false;
  }
};

const testRouteOptimization = async () => {
  try {
    // Create route
    const routeResponse = await makeRequest('POST', '/routes', {
      teamMemberId: teamMemberId,
      date: '2025-09-15',
      jobIds: [jobId],
      startLocation: {
        address: 'Rengøringsfirmaet A/S',
        city: 'København',
        postalCode: '2100'
      }
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    const routeId = routeResponse.id;
    log('Route created successfully', routeResponse);
    
    // Optimize route
    const optimizeResponse = await makeRequest('POST', `/routes/${routeId}/optimize`, {
      algorithm: 'balanced'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Route optimized successfully', optimizeResponse);
    
    return true;
  } catch (error) {
    logError('Route optimization failed', error);
    return false;
  }
};

const testAnalytics = async () => {
  try {
    // Get dashboard metrics
    const dashboardResponse = await makeRequest('GET', '/analytics/dashboard', null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Dashboard analytics retrieved', dashboardResponse);
    
    // Get revenue analytics
    const revenueResponse = await makeRequest('GET', '/analytics/revenue', null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Revenue analytics retrieved', revenueResponse);
    
    // Get performance analytics
    const performanceResponse = await makeRequest('GET', '/analytics/performance', null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Performance analytics retrieved', performanceResponse);
    
    return true;
  } catch (error) {
    logError('Analytics failed', error);
    return false;
  }
};

const testDanishBusinessLogic = async () => {
  try {
    // Test postal code validation
    const postalResponse = await makeRequest('GET', '/danish-business/postal-codes?postalCode=2100', null, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Postal code validation successful', postalResponse);
    
    // Test phone validation
    const phoneResponse = await makeRequest('POST', '/danish-business/validate-phone', {
      phone: '+45 33 12 34 56'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    log('Phone validation successful', phoneResponse);
    
    // Test CVR validation
    const cvrResponse = await makeRequest('POST', '/danish-business/validate-cvr', {
      cvrNumber: '87654321'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    log('CVR validation successful', cvrResponse);
    
    return true;
  } catch (error) {
    logError('Danish business logic failed', error);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Danish Cleaning System API Tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Authentication', fn: testAuth },
    { name: 'Tenant Management', fn: testTenantManagement },
    { name: 'Customer Management', fn: testCustomerManagement },
    { name: 'Team Management', fn: testTeamManagement },
    { name: 'Job Management', fn: testJobManagement },
    { name: 'Route Optimization', fn: testRouteOptimization },
    { name: 'Analytics', fn: testAnalytics },
    { name: 'Danish Business Logic', fn: testDanishBusinessLogic }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Running ${test.name}...`);
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`${test.name} failed with error`, error);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
};

// Run tests
runTests().catch(console.error);

