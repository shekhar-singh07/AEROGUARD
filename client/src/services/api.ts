const API_BASE = '/api';

export const api = {
  // Dashboard & Network
  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`);
    return await res.json();
  },

  async getNetworkSummary() {
    const res = await fetch(`${API_BASE}/network/summary`);
    return await res.json();
  },

  async getNetworkMap() {
    const res = await fetch(`${API_BASE}/network/map`);
    return await res.json();
  },

  // Stations
  async getStations(params: { page?: number; limit?: number; search?: string; state?: string; status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.state) query.append('state', params.state);
    if (params.status) query.append('status', params.status);

    const res = await fetch(`${API_BASE}/stations?${query.toString()}`);
    return await res.json();
  },

  async getStationDetail(stationId: string) {
    const res = await fetch(`${API_BASE}/stations/${stationId}`);
    return await res.json();
  },

  async getStationObservations(stationId: string, timeRange: string = '24H') {
    const res = await fetch(`${API_BASE}/stations/${stationId}/observations?timeRange=${timeRange}`);
    return await res.json();
  },

  // Anomalies
  async getAnomalies(params: { page?: number; limit?: number; severity?: string; status?: string; state?: string; type?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.severity) query.append('severity', params.severity);
    if (params.status) query.append('status', params.status);
    if (params.state) query.append('state', params.state);
    if (params.type) query.append('type', params.type);

    const res = await fetch(`${API_BASE}/anomalies?${query.toString()}`);
    return await res.json();
  },

  async getAnomalyDetail(alertId: string | number) {
    const res = await fetch(`${API_BASE}/anomalies/${alertId}`);
    return await res.json();
  },

  async reviewAnomaly(alertId: string | number, decision: string, comment?: string, reviewer?: string) {
    const res = await fetch(`${API_BASE}/anomalies/${alertId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comment, reviewer })
    });
    return await res.json();
  },

  async quarantineAnomaly(alertId: string | number, reviewer?: string) {
    const res = await fetch(`${API_BASE}/anomalies/${alertId}/quarantine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer })
    });
    return await res.json();
  },

  async restoreAnomaly(alertId: string | number, reviewer?: string) {
    const res = await fetch(`${API_BASE}/anomalies/${alertId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer })
    });
    return await res.json();
  },

  // Sensor Health
  async getSensorHealth() {
    const res = await fetch(`${API_BASE}/sensor-health`);
    return await res.json();
  },

  // Maintenance
  async getMaintenance(params: { status?: string; priority?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);

    const res = await fetch(`${API_BASE}/maintenance?${query.toString()}`);
    return await res.json();
  },

  async createMaintenance(data: { station_id: string; sensor_type: string; problem: string; priority: string; assigned_engineer?: string }) {
    const res = await fetch(`${API_BASE}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async updateMaintenance(id: number, data: { status?: string; assigned_engineer?: string }) {
    const res = await fetch(`${API_BASE}/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Simulation Lab
  async injectSimulation(data: {
    station_id: string;
    parameter: string;
    fault_type: string;
    severity: string;
    duration_intervals?: number;
    magnitude?: number;
  }) {
    const res = await fetch(`${API_BASE}/simulation/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Reports
  getReportDownloadUrl(format: 'pdf' | 'csv' | 'xlsx', type: string = 'all') {
    return `${API_BASE}/reports?format=${format}&type=${type}`;
  },

  // Audit Logs
  async getAuditLogs(limit: number = 50) {
    const res = await fetch(`${API_BASE}/audit-logs?limit=${limit}`);
    return await res.json();
  }
};
