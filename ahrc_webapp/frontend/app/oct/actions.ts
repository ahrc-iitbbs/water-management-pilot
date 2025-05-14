'use server';
import { ProcessResult } from '../types';

export async function processNpyFile(formData: FormData): Promise<ProcessResult> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Create a new FormData for the API request
    const apiFormData = new FormData();
    apiFormData.append('file', file);

    // Get the API URL from environment variable or fallback to localhost
    const apiUrl = process.env.NEXT_PUBLIC_OCT_API_URL || 'http://localhost:8004';
    
    // Make request to your FastAPI backend
    const response = await fetch(`${apiUrl}/segment`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to process image';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If response is not JSON, use default error message
      }
      return { success: false, error: errorMessage };
    }

    // Get the image blob from the response
    const imageBlob = await response.blob();
    
    // Convert blob to base64 for displaying in the browser
    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    return { success: true, imageUrl };
  } catch (error) {
    console.error('Error processing file:', error);
    return { success: false, error: 'Failed to connect to the segmentation service' };
  }
}