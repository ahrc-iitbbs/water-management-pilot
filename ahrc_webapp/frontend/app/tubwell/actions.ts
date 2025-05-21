'use server';
// File: app/actions.ts

import { ProcessedFormData } from '../types';

export async function createInvoice(formData: FormData): Promise<ProcessedFormData> {
  try {
    // Extract form data and convert to correct types
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const croppedArea = parseFloat(formData.get('croppedArea') as string);
    const cropName = formData.get('cropName') as string;
    const sowingDate = formData.get('sowingDate') as string;
    const basePeriod = parseInt(formData.get('basePeriod') as string);
    const lastIrrigationDate = formData.get('lastIrrigationDate') as string;
    const pumpHP = parseFloat(formData.get('pumpHP') as string);
    const wellDepth = parseFloat(formData.get('wellDepth') as string);
    const wellRadius = parseFloat(formData.get('wellRadius') as string);
    // const pumpDischargeRate = parseFloat(formData.get('pumpDischargeRate') as string);
    const pumpType = formData.get('pumpType') as string;
    const irrigationMethod = formData.get('irrigationMethod') as string;
    
    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid coordinates provided');
    }
    
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
      wellDepth,
      wellRadius,
      // pumpDischargeRate,
      pumpType,
      irrigationMethod
    };
    
    // Get API URL from environment variable
    // The service name in docker-compose is 'irrigation-backend', not just 'backend'
    const API_URL = process.env.NEXT_PUBLIC_IRRIGATION_API_URL || 'http://127.0.0.1:8000';
    
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
      let errorMessage = `FastAPI request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }
    
    // Parse the response from FastAPI
    const processedData: ProcessedFormData = await response.json();
    return processedData;
    
  } catch (error) {
    console.error('Error calling FastAPI:', error);
    
    // More detailed error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check if it's a connection error
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      console.error('Connection refused. Make sure the FastAPI backend is running and accessible.');
      console.error('Expected URL:', process.env.NEXT_PUBLIC_IRRIGATION_API_URL || 'http://127.0.0.1:8000');
    }
    
    // Fallback to JavaScript processing if FastAPI call fails
    const currentDate = new Date();
    const lastIrrigationDateObj = new Date(formData.get('lastIrrigationDate') as string);
    
    // Calculate days since last irrigation
    const daysSinceIrrigation = Math.floor(
      (currentDate.getTime() - lastIrrigationDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Simple fallback logic
    const turnOnPump = daysSinceIrrigation >= 7;
    let pumpRunningTime = 0;
    
    if (turnOnPump) {
      // Assuming 25mm of water required (depth of irrigation)
      pumpRunningTime = 25;
    }
    
    return {
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
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
      apiData: { error: `Failed to connect to FastAPI service: ${errorMessage}` }
    };
  }
}