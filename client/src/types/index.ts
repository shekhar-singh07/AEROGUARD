export type StationStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'CRITICAL';
export type AnomalyType = 'SPIKE' | 'DRIFT' | 'BIAS' | 'STUCK' | 'DROPOUT' | 'MISSING' | 'WEATHER_EVENT';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'INVESTIGATING' | 'CONFIRMED_FAULT' | 'CONFIRMED_WEATHER_EVENT' | 'FALSE_ALARM' | 'QUARANTINED' | 'RESTORED' | 'RESOLVED';
export type UserRole = 'AWS Network Operator' | 'Maintenance Engineer' | 'Meteorologist / Data Quality Expert' | 'Network Administrator';

export interface Station {
  id?: number;
  station_id: string;
  station_name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  installation_date: string;
  station_status: StationStatus;
  last_seen: string;
  sensor_health: number;
  active_anomaly?: string;
  active_severity?: string;
  active_anomaly_type?: string;
  anomaly_severity?: string;
  trust_score?: number;
}

export interface Observation {
  observation_id: string;
  station_id: string;
  timestamp: string;
  temperature: number | null;
  relative_humidity: number | null;
  atmospheric_pressure: number | null;
  quality_status: 'VALID' | 'SUSPECT' | 'INVALID' | 'QUARANTINED' | 'RESTORED';
  anomaly_status: 'NORMAL' | 'GENUINE_WEATHER_EVENT' | 'PROBABLE_SENSOR_FAULT' | 'UNCERTAIN' | 'QUARANTINED' | 'RESTORED';
  trust_score: number;
}

export interface AnomalyEvent {
  id: number;
  observation_id: string;
  station_id: string;
  station_name?: string;
  state?: string;
  district?: string;
  anomaly_type: AnomalyType;
  severity: Severity;
  confidence: number;
  trust_score: number;
  status: AlertStatus;
  created_at: string;
  temperature?: number | null;
  relative_humidity?: number | null;
  atmospheric_pressure?: number | null;
}

export interface EvidenceItem {
  id?: number;
  anomaly_id: number;
  evidence_type: 'TEMPORAL' | 'SPATIAL' | 'MULTIVARIATE' | 'ISOLATION_FOREST' | 'HISTORICAL_BASELINE' | 'RULE_QC';
  description: string;
  score: number;
}

export interface SensorHealthRecord {
  station_id: string;
  station_name?: string;
  state?: string;
  district?: string;
  health_score: number;
  health_status: 'HEALTHY' | 'WATCH' | 'DEGRADING' | 'CRITICAL';
  fault_count: number;
  last_fault: string;
  maintenance_priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  updated_at?: string;
}

export interface MaintenanceTask {
  id: number;
  station_id: string;
  station_name?: string;
  state?: string;
  district?: string;
  sensor_type: 'TEMPERATURE' | 'HUMIDITY' | 'PRESSURE' | 'TELEMETRY' | 'POWER';
  problem: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_engineer: string;
  status: 'OPEN' | 'INVESTIGATING' | 'SCHEDULED' | 'RESOLVED';
  created_at: string;
  resolved_at?: string | null;
}

export interface DashboardKPIs {
  total_stations: number;
  online_stations: number;
  offline_stations: number;
  warning_stations: number;
  critical_stations: number;
  observations_processed: number;
  average_trust_score: number;
  active_anomalies: number;
  critical_alerts: number;
  weather_events_count: number;
  sensor_faults_count: number;
  sensors_requiring_attention: number;
  degrading_sensors: number;
  critical_sensors: number;
}
