'use server';
import { CancerDetectionResult } from '../types';

export async function analyzeCervicalCancer(formData: FormData): Promise<CancerDetectionResult> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Get API URL from environment variable or use default
    const API_URL = process.env.NEXT_PUBLIC_CERVIC_API_URL || 'http://backend:8001';
    console.log(`Connecting to Cancer Detection API at: ${API_URL}`);
    
    // Create a new FormData for the API request
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    
    // Send the image to the FastAPI backend
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      body: apiFormData,
      // Don't set Content-Type header - let the browser set it with boundary
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Parse the response from FastAPI
    const data = await response.json();
    
    return {
      predicted_class: data.predicted_class,
    //   confidence: data.confidence,
      message: data.message,
      filename: file.name,
      timestamp: new Date().toISOString(),
      error: null
    };
    
  } catch (error) {
    console.error('Error calling Cancer Detection API:', error);
    
    // Return error response
    return {
      predicted_class: 'Unknown',
    //   confidence: 0,
      message: 'Failed to analyze image',
      filename: formData.get('file') ? (formData.get('file') as File).name : '',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to connect to Cancer Detection API'
    };
  }
}

export async function validatePrediction(
  filename: string, 
  currentClass: string, 
  newClass: string
): Promise<{ success: boolean; message: string }> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_CERVIC_API_URL || 'http://backend:8001';
    
    const response = await fetch(`${API_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: filename,
        current_class: currentClass,
        new_class: newClass
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Validation failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      message: data.message
    };
    
  } catch (error) {
    console.error('Error validating prediction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

export async function getModelStatistics(): Promise<any> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_CERVIC_API_URL || 'http://backend:8001';
    
    const response = await fetch(`${API_URL}/statistics`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics with status ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}