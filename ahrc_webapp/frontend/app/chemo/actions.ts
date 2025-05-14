// app/chemo/actions.ts
'use server';

import { ChemoFormData } from '../types';

export async function analyzeToxicity(formData: FormData): Promise<ChemoFormData> {
  try {
    // Extract form data
    const fileNumber = formData.get('fileNumber') as string;
    const file = formData.get('file') as File;
      // Debug logging
    console.log('Frontend sending:', {
        fileNumber,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type
    });
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    // Get API URL from environment variable or use default
    const API_URL = process.env.NEXT_PUBLIC_CHEMO_API_URL || 'http://backend:8002';
    console.log(`Connecting to API at: ${API_URL}`);
    console.log(`filename: ${fileNumber}` );
    // Create form data for FastAPI
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('file_number', fileNumber);
    
    // Send the data to the FastAPI backend
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      body: apiFormData,
    });
    
    if (!response.ok) {
      throw new Error(`FastAPI request failed with status ${response.status}`);
    }
    
    // Parse the response from FastAPI (directly matches PredictionResponse)
    const apiResponse = await response.json();
    
    // Return the response with added timestamp
    const processedData: ChemoFormData = {
      ...apiResponse,  // This includes file_number, prediction, severity, confidence
      timestamp: new Date().toISOString(),
    };
    
    return processedData;
    
  } catch (error) {
    console.error('Error calling FastAPI:', error);
    
    // Return error response with matching structure
    return {
      file_number: formData.get('fileNumber') as string,
      prediction: 'Error processing request',
      severity: false,
      confidence: null,
      timestamp: new Date().toISOString(),
      apiData: { error: error instanceof Error ? error.message : 'Failed to connect to FastAPI service' }
    };
  }
}