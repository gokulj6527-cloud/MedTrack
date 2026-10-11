const API_BASE = '/api';

export interface UserToken {
  user_id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'PHARMACIST' | 'USER';
  organization_id?: string;
  organization_name?: string;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('medtrack_token');
}

export function setAuthToken(token: string, user: UserToken): void {
  localStorage.setItem('medtrack_token', token);
  localStorage.setItem('medtrack_user', JSON.stringify(user));
}

export function clearAuthToken(): void {
  localStorage.removeItem('medtrack_token');
  localStorage.removeItem('medtrack_user');
}

export function getCurrentUser(): UserToken | null {
  const userStr = localStorage.getItem('medtrack_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (userId: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ userId, password }) }),
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: any) => request('/auth/password', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Admin
  getUsers: (filters: { role?: string; status?: string; search?: string } = {}) => {
    const params = new URLSearchParams(filters as any).toString();
    return request(`/admin/users?${params}`);
  },
  createUser: (data: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUserStatus: (userId: string, status: string, reason?: string) =>
    request(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  getUserProfile: (userId: string) => request(`/admin/users/${userId}/profile`),
  getMetrics: () => request('/admin/metrics'),
  getAuditLogs: (filters: { search?: string; action?: string } = {}) => {
    const params = new URLSearchParams(filters as any).toString();
    return request(`/admin/audit-logs?${params}`);
  },
  getDrugInteractions: () => request('/admin/drug-interactions'),
  createDrugInteraction: (data: any) => request('/admin/drug-interactions', { method: 'POST', body: JSON.stringify(data) }),
  getAdminMedicines: () => request('/admin/medicines'),
  updateMedicineStatus: (id: string, status: string) => request(`/admin/medicines/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAdminBatches: () => request('/admin/batches'),
  getAdminRecalls: () => request('/admin/recalls'),
  createAdminRecall: (data: any) => request('/admin/recalls', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminRecall: (id: string, status: string) => request(`/admin/recalls/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getStockMovement: () => request('/admin/stock-movement'),
  getSettings: () => request('/admin/settings'),
  updateSetting: (key: string, value: string) => request('/admin/settings', { method: 'PATCH', body: JSON.stringify({ setting_key: key, setting_value: value }) }),
  getAdminComplaints: () => request('/admin/complaints'),
  updateComplaint: (id: string, data: any) => request(`/admin/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Manufacturer
  getMedicines: (mfrId?: string) => request(`/manufacturer/medicines${mfrId ? `?manufacturer_id=${mfrId}` : ''}`),
  createMedicine: (data: any) => request('/manufacturer/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id: string, data: any) => request(`/manufacturer/medicines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getBatches: (mfrId?: string) => request(`/manufacturer/batches${mfrId ? `?manufacturer_id=${mfrId}` : ''}`),
  createBatch: (data: any) => request('/manufacturer/batches', { method: 'POST', body: JSON.stringify(data) }),
  reportDefectiveBatch: (batchId: string, reason: string) => request(`/manufacturer/batches/${batchId}/defective`, { method: 'POST', body: JSON.stringify({ reason }) }),
  createShipmentToDistributor: (data: any) => request('/manufacturer/shipments', { method: 'POST', body: JSON.stringify(data) }),
  getDistributorNetwork: () => request('/manufacturer/distributor-network'),
  initiateRecall: (data: any) => request('/manufacturer/recall', { method: 'POST', body: JSON.stringify(data) }),
  getManufacturerDashboard: () => request('/manufacturer/dashboard'),
  getManufacturerShipments: () => request('/manufacturer/shipments'),
  getManufacturerProfile: () => request('/manufacturer/profile'),
  updateManufacturerProfile: (data: any) => request('/manufacturer/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // Distributor
  getDistributorInventory: (distId?: string) => request(`/distributor/inventory${distId ? `?distributor_id=${distId}` : ''}`),
  getIncomingShipments: (distId?: string) => request(`/distributor/shipments/incoming${distId ? `?distributor_id=${distId}` : ''}`),
  receiveShipment: (shipmentId: string) => request(`/distributor/shipments/${shipmentId}/receive`, { method: 'POST' }),
  getPharmacyOrders: (distId?: string) => request(`/distributor/orders${distId ? `?distributor_id=${distId}` : ''}`),
  shipPharmacyOrder: (orderId: string) => request(`/distributor/orders/${orderId}/ship`, { method: 'POST' }),
  recordTemperature: (data: any) => request('/distributor/temperature', { method: 'POST', body: JSON.stringify(data) }),
  getAlerts: () => request('/distributor/alerts'),
  getDistributorDashboard: () => request('/distributor/dashboard'),
  getDistributorProfile: () => request('/distributor/profile'),
  updateDistributorProfile: (data: any) => request('/distributor/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  adjustDistributorStock: (inventoryId: string, data: any) => request(`/distributor/inventory/${inventoryId}/adjust`, { method: 'POST', body: JSON.stringify(data) }),
  quarantineDistributorBatch: (inventoryId: string, reason: string) => request(`/distributor/inventory/${inventoryId}/quarantine`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Pharmacist
  getPharmacyInventory: (pharmId?: string) => request(`/pharmacist/inventory${pharmId ? `?pharmacy_id=${pharmId}` : ''}`),
  searchMedicines: (q: string, pharmId?: string) => request(`/pharmacist/medicines/search?q=${encodeURIComponent(q)}${pharmId ? `&pharmacy_id=${pharmId}` : ''}`),
  checkInteractions: (medicine_ids: string[]) => request('/pharmacist/check-interactions', { method: 'POST', body: JSON.stringify({ medicine_ids }) }),
  dispenseMedicine: (data: any) => request('/pharmacist/dispense', { method: 'POST', body: JSON.stringify(data) }),
  getDispensingHistory: (pharmId?: string) => request(`/pharmacist/dispensing-history${pharmId ? `?pharmacy_id=${pharmId}` : ''}`),
  getPharmacistOrders: () => request('/pharmacist/orders'),
  createPharmacistOrder: (data: any) => request('/pharmacist/orders', { method: 'POST', body: JSON.stringify(data) }),
  getPharmacistAlerts: () => request('/pharmacist/alerts'),
  getPharmacistDashboard: () => request('/pharmacist/dashboard'),
  getDistributorsList: () => request('/pharmacist/distributors'),

  // Public / General User
  getUserMedicines: (q?: string) => request(`/user/medicines${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  checkUserBatch: (batchNumber: string) => request(`/user/batches/${encodeURIComponent(batchNumber)}`),
  getUserHistory: () => request('/user/history'),
  getUserProfileData: () => request('/user/profile'),
  updateUserProfileData: (data: any) => request('/user/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  submitComplaint: (data: any) => request('/user/complaints', { method: 'POST', body: JSON.stringify(data) }),
  getUserComplaints: () => request('/user/complaints'),

  // Reports
  getReportInventory: () => request('/reports/inventory'),
  getReportDispensing: () => request('/reports/dispensing'),
  getReportProduction: () => request('/reports/production'),
  getReportExpiry: () => request('/reports/expiry'),
  getReportRecalls: () => request('/reports/recalls'),

  // Viva Inspector
  getSchemaInfo: () => request('/viva/schema'),
  executeRawSql: (sql: string) => request('/viva/execute-sql', { method: 'POST', body: JSON.stringify({ sql }) })
};
