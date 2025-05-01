'use server';
// File: app/actions.ts

import { ProcessedFormData } from '../types';

export async function createInvoice(formData: FormData): Promise<ProcessedFormData> {
  try {
    // Extract form data
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const croppedArea = parseFloat(formData.get('croppedArea') as string);
    const cropName = formData.get('cropName') as string;
    const sowingDate = formData.get('sowingDate') as string;
    const basePeriod = parseInt(formData.get('basePeriod') as string);
    const lastIrrigationDate = formData.get('lastIrrigationDate') as string;
    const pumpHP = parseFloat(formData.get('pumpHP') as string);
    const pumpDischargeRate = parseFloat(formData.get('pumpDischargeRate') as string);
    const pumpType = formData.get('pumpType') as string;
    const irrigationMethod = formData.get('irrigationMethod') as string;
    
    // Prepare data for the FastAPI request
    const requestData = {
      latitude,
      longitude,
      croppedArea,
      cropName,
      sowingDate,
      basePeriod,
      lastIrrigationDate,
      pumpHP,
      pumpDischargeRate,
      pumpType,
      irrigationMethod
    };
    
    // Get API URL from environment variable or use default based on environment
    // In Docker, this should point to the backend service name
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    console.log(`Connecting to API at: ${API_URL}`);
    
    // Send the data to the FastAPI backend
    const response = await fetch(`${API_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      throw new Error(`FastAPI request failed with status ${response.status}`);
    }
    
    // Parse the response from FastAPI
    const processedData: ProcessedFormData = await response.json();
    return processedData;
    
  } catch (error) {
    console.error('Error calling FastAPI:', error);
    
    // Fallback to JavaScript processing if FastAPI call fails
    // Get current date for calculations
    const currentDate = new Date();
    const lastIrrigationDate = new Date(formData.get('lastIrrigationDate') as string);
    
    // Calculate days since last irrigation
    const daysSinceIrrigation = Math.floor(
      (currentDate.getTime() - lastIrrigationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Simple fallback logic
    const turnOnPump = daysSinceIrrigation >= 7;
    let pumpRunningTime = "0 hours 0 minutes";
    
    if (turnOnPump) {
      // Simple calculation based on area and pump discharge rate
      const area = parseFloat(formData.get('croppedArea') as string);
      const dischargeRate = parseFloat(formData.get('pumpDischargeRate') as string);
      
      // Convert area to square meters (1 acre = 4046.86 square meters)
      const areaInSqMeters = area * 4046.86;
      
      // Assuming 25mm of water required
      const waterRequiredLiters = areaInSqMeters * 25;
      
      // Calculate time in minutes
      const timeRequiredMinutes = waterRequiredLiters / dischargeRate;
      
      // Convert to hours and minutes
      const hours = Math.floor(timeRequiredMinutes / 60);
      const minutes = Math.floor(timeRequiredMinutes % 60);
      
      pumpRunningTime = `${hours} hours ${minutes} minutes`;
    }
    
    return {
      latitude: formData.get('latitude') as string,
      longitude: formData.get('longitude') as string,
      croppedArea: parseFloat(formData.get('croppedArea') as string),
      cropName: formData.get('cropName') as string,
      sowingDate: formData.get('sowingDate') as string,
      basePeriod: parseInt(formData.get('basePeriod') as string),
      lastIrrigationDate: formData.get('lastIrrigationDate') as string,
      pumpHP: parseFloat(formData.get('pumpHP') as string),
      pumpDischargeRate: parseFloat(formData.get('pumpDischargeRate') as string),
      pumpType: formData.get('pumpType') as string,
      irrigationMethod: formData.get('irrigationMethod') as string,
      turnOnPump,
      pumpRunningTime,
      timestamp: new Date().toISOString(),
      apiData: { error: 'Failed to connect to FastAPI service' }
    };
  }
}