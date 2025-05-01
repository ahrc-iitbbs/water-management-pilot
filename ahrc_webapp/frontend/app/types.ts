// app/types.ts

/**
 * Interface for the irrigation form input data
 */
export interface IrrigationFormInput {
    latitude: string;
    longitude: string;
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
  
  /**
   * Interface for processed irrigation data returned from the server action
   * Must match the response structure from the FastAPI backend
   */
  export interface ProcessedFormData {
    /** Input latitude value */
    latitude: string;
    /** Input longitude value */
    longitude: string;
    /** Cropped area in acres */
    croppedArea: number;
    /** Name of the crop */
    cropName: string;
    /** Sowing/transplanting date */
    sowingDate: string;
    /** Base period of the crop in days */
    basePeriod: number;
    /** Last irrigation date */
    lastIrrigationDate: string;
    /** Pump horsepower */
    pumpHP: number;
    /** Pump discharge rate in liters/minute */
    pumpDischargeRate: number;
    /** Type of pump being used */
    pumpType: string;
    /** Method of irrigation being used */
    irrigationMethod: string;
    /** Decision on whether to turn on the pump */
    turnOnPump: boolean;
    /** Recommended pump running time */
    pumpRunningTime: string;
    /** Timestamp of when the data was processed */
    timestamp: string;
    /** Additional data or error information */
    apiData: any | { error: string };
  }