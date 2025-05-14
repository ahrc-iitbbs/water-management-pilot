// app/types.ts

/**
 * Interface for the irrigation form input data
 */
export interface IrrigationInput {
  latitude: number;
  longitude: number;
  croppedArea: number;
  cropName: string;
  sowingDate: string;
  basePeriod: number;
  lastIrrigationDate: string;
  pumpHP: number;
  pumpDischargeRate: number;
  pumpType: string;
  irrigationMethod: string;
}

export interface ProcessedIrrigationData {
  latitude: number;
  longitude: number;
  croppedArea: number;
  cropName: string;
  sowingDate: string;
  basePeriod: number;
  lastIrrigationDate: string;
  pumpHP: number;
  pumpDischargeRate: number;
  pumpType: string;
  irrigationMethod: string;
  turnOnPump: boolean;
  pumpRunningTime: number;  // Depth of irrigation in mm
  timestamp: string;
}

export interface ProcessedFormData {
  latitude: number;          
  longitude: number;         
  croppedArea: number;
  cropName: string;
  sowingDate: string;
  basePeriod: number;
  lastIrrigationDate: string;
  pumpHP: number;
  pumpDischargeRate: number;
  pumpType: string;
  irrigationMethod: string;
  turnOnPump: boolean;
  pumpRunningTime: number;   // Changed from string to number (depth in mm)
  timestamp: string;
  apiData?: { error: string }; // Optional, used for fallback error messages
}

// Error response type
export interface ErrorResponse {
  error: string;
  detail: string;
  timestamp: string;
}
  export interface CancerDetectionResult {
    predicted_class: string;
    // confidence: number;
    message: string;
    filename: string;
    timestamp: string;
    error: string | null;
  }
  
  export interface ValidationInput {
    file_name: string;
    current_class: string;
    new_class: string;
  }
  
  export interface StatisticsOutput {
    benign_predicted: number;
    benign_validated: number;
    malignant_predicted: number;
    malignant_validated: number;
    suspicious_predicted: number;
    suspicious_validated: number;
    total_predicted: number;
    total_validated: number;
    accuracy: number;
  }


export interface ChemoFormData {
  file_number: string;  // Changed from fileNumber to file_number
  prediction: string;
  severity: boolean;
  confidence: number | null;  // To match Optional[float] from FastAPI
  timestamp: string;
  apiData?: {
    error?: string;
  };
}

export interface ProcessResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}