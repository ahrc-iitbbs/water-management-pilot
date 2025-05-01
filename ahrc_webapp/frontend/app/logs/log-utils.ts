'use server';

// This file contains server actions for fetching logs
// It will be imported by the client component

/**
 * Fetches decision logs from the backend
 */
export async function fetchDecisionLogs(): Promise<string[]> {
  try {
    // Use absolute URL with fetch in server component
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    const response = await fetch(`${API_URL}/logs/decisions`, {
      cache: 'no-store' // Ensure we get fresh data each time
    });
    
    if (!response.ok) {
      console.error(`Error fetching decision logs: ${response.status} ${response.statusText}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching decision logs:', error);
    return [];
  }
}

/**
 * Interface for irrigation records
 */
export interface IrrigationRecord {
  id: string;
  timestamp: string;
  latitude: string;
  longitude: string;
  cropName: string;
  croppedArea: number;
  lastIrrigationDate: string;
  turnOnPump: boolean;
  pumpRunningTime: string;
  daysSinceIrrigation: number;
  weatherData?: any;
  notes?: string;
}

/**
 * Fetches irrigation records from the backend
 */
export async function fetchIrrigationRecords(): Promise<IrrigationRecord[]> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    const response = await fetch(`${API_URL}/logs/records`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`Error fetching irrigation records: ${response.status} ${response.statusText}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching irrigation records:', error);
    return [];
  }
}

/**
 * Interface for system status
 */
export interface SystemStatus {
  status: string;
  timestamp: string;
  logs: {
    api_log_size_kb: number;
    decision_log_size_kb: number;
    record_file_size_kb: number;
    record_count: number;
  };
  error?: string;
}

/**
 * Fetches system status from the backend
 */
export async function fetchSystemStatus(): Promise<SystemStatus | null> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    const response = await fetch(`${API_URL}/status`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`Error fetching system status: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching system status:', error);
    return null;
  }
}