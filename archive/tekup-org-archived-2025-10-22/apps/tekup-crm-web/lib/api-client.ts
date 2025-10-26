// API client for the CRM service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.CRM_API_URL || 'http://localhost:3002/api';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    throw {
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// Contacts API
export const contactsApi = {
  getAll: () => fetchApi('/contacts'),
  getById: (id: string) => fetchApi(`/contacts/${id}`),
  create: (contact: any) => fetchApi('/contacts', {
    method: 'POST',
    body: JSON.stringify(contact),
  }),
  update: (id: string, contact: any) => fetchApi(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(contact),
  }),
  delete: (id: string) => fetchApi(`/contacts/${id}`, {
    method: 'DELETE',
  }),
};

// Companies API
export const companiesApi = {
  getAll: () => fetchApi('/companies'),
  getById: (id: string) => fetchApi(`/companies/${id}`),
  create: (company: any) => fetchApi('/companies', {
    method: 'POST',
    body: JSON.stringify(company),
  }),
  update: (id: string, company: any) => fetchApi(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(company),
  }),
  delete: (id: string) => fetchApi(`/companies/${id}`, {
    method: 'DELETE',
  }),
};

// Deals API
export const dealsApi = {
  getAll: () => fetchApi('/deals'),
  getById: (id: string) => fetchApi(`/deals/${id}`),
  create: (deal: any) => fetchApi('/deals', {
    method: 'POST',
    body: JSON.stringify(deal),
  }),
  update: (id: string, deal: any) => fetchApi(`/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(deal),
  }),
  delete: (id: string) => fetchApi(`/deals/${id}`, {
    method: 'DELETE',
  }),
  getStages: () => fetchApi('/deal-stages'),
};

// Activities API
export const activitiesApi = {
  getAll: () => fetchApi('/activities'),
  getById: (id: string) => fetchApi(`/activities/${id}`),
  create: (activity: any) => fetchApi('/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  }),
  update: (id: string, activity: any) => fetchApi(`/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(activity),
  }),
  delete: (id: string) => fetchApi(`/activities/${id}`, {
    method: 'DELETE',
  }),
  getTypes: () => fetchApi('/activities/types'),
};

// Health API
export const healthApi = {
  getStatus: () => fetchApi('/health'),
};

export default {
  contactsApi,
  companiesApi,
  dealsApi,
  activitiesApi,
  healthApi,
};