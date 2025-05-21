from fastapi import FastAPI, Body, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
import os
import uuid
import math
import rasterio
from rasterio.errors import RasterioIOError
import h5py
from rasterio.transform import from_origin
import pandas as pd
import joblib
import numpy as np
import math
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Tube Well Automation API", 
    description="API for processing tube well data from Next.js",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Adjust for production to be more restrictive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model matching the data sent from Next.js
class IrrigationInput(BaseModel):
    latitude: float
    longitude: float
    croppedArea: float = Field(gt=0, description="Cropped area must be positive")
    cropName: str = Field(min_length=1, description="Crop name cannot be empty")
    sowingDate: str
    basePeriod: int = Field(ge=0, description="Base period must be non-negative")
    lastIrrigationDate: str
    pumpHP: float = Field(gt=0, description="Pump HP must be positive")
    wellDepth: float = Field(description="Well depth")
    wellRadius: float = Field(description="Well radius")
    # pumpDischargeRate: float = Field(gt=0, description="Pump discharge rate must be positive")
    pumpType: str
    irrigationMethod: str
    
    @validator('sowingDate', 'lastIrrigationDate')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v

# Response model matching your Next.js interface
class ProcessedIrrigationData(BaseModel):
    latitude: float
    longitude: float
    croppedArea: float
    cropName: str
    sowingDate: str
    basePeriod: int
    lastIrrigationDate: str
    pumpHP: float
    pumpDischargeRate: float
    pumpType: str
    irrigationMethod: str
    turnOnPump: bool
    pumpRunningTime: float
    timestamp: str

# Error response model
class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: str

# File path constants
RASTER_BASE_PATH = '/app/sm_tif'
EXCEL_PATH = 'Lat_long_SM_RZSM.xlsx'
P_TABLE_PATH = 'p table.xlsx'
MODEL_PATH = 'rf_rzsm_model.pkl'

def get_raster_value(raster_path: str, latitude: float, longitude: float) -> float:
    """
    Extract raster value at given coordinates
    
    Args:
        raster_path: Path to the raster file
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        
    Returns:
        float: Raster value at the coordinates
        
    Raises:
        HTTPException: If raster file is not found or coordinates are out of bounds
    """
    try:
        with rasterio.open(raster_path) as dataset:
            transform = dataset.transform

            # Convert (longitude, latitude) to (col, row)
            col, row = ~transform * (longitude, latitude)
            row, col = int(row), int(col)

            band_data = dataset.read(1)

            if 0 <= row < band_data.shape[0] and 0 <= col < band_data.shape[1]:
                return band_data[row, col]
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Coordinates ({latitude}, {longitude}) are out of bounds for the raster"
                )
    except RasterioIOError:
        raise HTTPException(
            status_code=404, 
            detail=f"Raster file not found at path: {raster_path}"
        )
    except Exception as e:
        logger.error(f"Error reading raster: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error reading raster data: {str(e)}"
        )

def calculate_water_requirements(
    df: pd.DataFrame, 
    sand: float, 
    silt: float, 
    clay: float, 
    rsm: float, 
    crop_name: str, 
    rooting_depth: Optional[float] = None
) -> tuple[bool, float]:
    """
    Calculate water requirements for irrigation decision
    
    Args:
        df: DataFrame containing crop parameters
        sand: Sand content percentage
        silt: Silt content percentage  
        clay: Clay content percentage
        rsm: Root zone soil moisture
        crop_name: Name of the crop
        rooting_depth: Optional rooting depth override
        
    Returns:
        tuple: (irrigation_needed, depth_of_irrigation)
        
    Raises:
        HTTPException: If crop not found in database
    """
    # Step 1: Compute BD (Mg/m³)
    BD = 1.66 - 0.063 * math.log10(clay + 1)

    # Step 2: Compute θ_fc (field capacity) in percent
    theta_fc_percent = 56.37 - 0.51 * sand - 0.27 * silt

    # Step 3: Compute θ_wp (wilting point) in percent
    theta_wp_percent = 0.71 + 0.44 * clay

    # Step 4: Get crop-specific info (p and Zr) from the DataFrame
    crop_row = df[df['crop_name'].str.lower() == crop_name.lower()]
    if crop_row.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Crop '{crop_name}' not found in the database"
        )

    try:
        p = float(crop_row['p'].values[0])
        Zr_val = crop_row['Zr'].values[0]
        
        if rooting_depth is None:
            if isinstance(Zr_val, str) and '-' in Zr_val:
                Zr_range = list(map(float, Zr_val.split('-')))
                Zr = sum(Zr_range) / len(Zr_range)  # average if range
            else:
                Zr = float(Zr_val)
        else:
            Zr = rooting_depth

        Zr_mm = Zr * 1000  # convert Zr to mm

        # Step 5: Calculate TAW (mm)
        TAW = ((theta_fc_percent - theta_wp_percent) / 100) * BD * Zr_mm

        # Step 6: Calculate RAW (mm)
        RAW = p * TAW

        pa = ((theta_fc_percent - rsm) / theta_fc_percent)

        # Step 7: Decide irrigation
        irrigation_needed = p <= pa

        return irrigation_needed, round(RAW, 3)
    
    except Exception as e:
        logger.error(f"Error calculating water requirements: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating water requirements: {str(e)}"
        )


def calculate_pump_discharge_rate(well_depth: float, predicted_water_level: float, well_radius: float) -> float:
    try:
        numerator = 2.72 * (0.5 * well_depth) * (
        predicted_water_level - (well_depth - (predicted_water_level / 3))
    )
        denominator = math.log10(100 - well_radius)
        
        if denominator == 0:
            raise ValueError("Denominator is zero; check that well_radius is not 100.")
        
        pump_discharge_rate = numerator / denominator
        return round(pump_discharge_rate, 3)

    except Exception as e:
        logger.error(f"Error calculating pump discharge rate: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating pump discharge rate: {str(e)}"
        )

def validate_files_exist():
    """Validate that all required files exist"""
    required_files = [EXCEL_PATH, P_TABLE_PATH, MODEL_PATH]
    for file_path in required_files:
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=500,
                detail=f"Required file not found: {file_path}"
            )

@app.on_event("startup")
async def startup_event():
    """Validate environment on startup"""
    try:
        validate_files_exist()
        logger.info("All required files validated")
    except HTTPException as e:
        logger.error(f"Startup validation failed: {e.detail}")
        raise

@app.post("/process", response_model=ProcessedIrrigationData, responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def process_irrigation_data(data: IrrigationInput):
    """
    Process the irrigation data received from Next.js server action
    
    Args:
        data: Irrigation input data
        
    Returns:
        ProcessedIrrigationData: Processed irrigation data with pump decisions
        
    Raises:
        HTTPException: Various errors related to data processing
    """
    try:
        # Calculate date for 3 days ago
        current_date = datetime.now()
        three_days_ago = current_date - timedelta(days=3)
        
        month_padded = f"{three_days_ago.month:02d}"
        day_padded = f"{three_days_ago.day:02d}"
        year = three_days_ago.year

        # Get surface soil moisture from raster
        # Option 1: Static filename
        # raster_path = f"{RASTER_BASE_PATH}/{month_padded}/{day_padded}/sm_surface_analysis_georeferenced_20250507.tif"
        
        # Option 2: Dynamic filename based on three_days_ago date
        date_str = f"{year}{month_padded}{day_padded}"
        raster_path = f"{RASTER_BASE_PATH}/{year}/{month_padded}/{day_padded}/sm_surface_analysis_georeferenced_{date_str}.tif"
        
        
        if not os.path.exists(raster_path):
            raise HTTPException(
                status_code=404,
                detail=f"Raster data not found for date: {three_days_ago.strftime('%Y-%m-%d')}"
            )
        
        SSM = get_raster_value(raster_path, data.latitude, data.longitude) / 255
        
        # Read Excel data
        try:
            df = pd.read_excel(EXCEL_PATH)
        except FileNotFoundError:
            raise HTTPException(
                status_code=500,
                detail=f"Excel file not found: {EXCEL_PATH}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error reading Excel file: {str(e)}"
            )

        # Find matching row
        rounded_lat = round(data.latitude, 4)
        rounded_lon = round(data.longitude, 4)

        df.columns = df.columns.str.strip()
        matching_row = df[(df['LATITUDE'].round(4) == rounded_lat) & 
                         (df['LONGITUDE'].round(4) == rounded_lon)]

        if matching_row.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for coordinates: ({data.latitude}, {data.longitude})"
            )

        # Extract soil parameters
        required_columns = ['SAND', 'SILT', 'CLAY', 'BD', 'HC']
        for col in required_columns:
            if col not in matching_row.columns:
                raise HTTPException(
                    status_code=500,
                    detail=f"Required column '{col}' not found in Excel data"
                )

        SAND = matching_row.iloc[0]['SAND']
        SILT = matching_row.iloc[0]['SILT']
        CLAY = matching_row.iloc[0]['CLAY']
        BD = matching_row.iloc[0]['BD']
        HC = matching_row.iloc[0]['HC']

        logger.info(f"Soil parameters - SAND: {SAND}, SILT: {SILT}, CLAY: {CLAY}, BD: {BD}, HC: {HC}, SSM: {SSM:.7f}")

        # Load and use ML model
        try:
            model = joblib.load(MODEL_PATH)
        except FileNotFoundError:
            raise HTTPException(
                status_code=500,
                detail=f"Model file not found: {MODEL_PATH}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error loading model: {str(e)}"
            )

        input_features = np.array([[SAND, SILT, CLAY, HC, SSM]])
        rzsm_pred = model.predict(input_features)[0]
        
        # Read p-table
        try:
            df_p = pd.read_excel(P_TABLE_PATH)
        except FileNotFoundError:
            raise HTTPException(
                status_code=500,
                detail=f"P-table file not found: {P_TABLE_PATH}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error reading P-table: {str(e)}"
            )
        
        # Calculate water requirements
        decision, depth = calculate_water_requirements(
            df_p, 
            SAND, 
            SILT, 
            CLAY, 
            rzsm_pred * 100, 
            data.cropName
        )

        pump_discharge_rate = calculate_pump_discharge_rate(data.wellDepth, depth, data.wellRadius)
        
        timestamp = datetime.now().isoformat()
        
        # Prepare the response data
        processed_data = ProcessedIrrigationData(
            latitude=data.latitude,
            longitude=data.longitude,
            croppedArea=data.croppedArea,
            cropName=data.cropName,
            sowingDate=data.sowingDate,
            basePeriod=data.basePeriod,
            lastIrrigationDate=data.lastIrrigationDate,
            pumpHP=data.pumpHP,
            pumpDischargeRate=pump_discharge_rate,
            pumpType=data.pumpType,
            irrigationMethod=data.irrigationMethod,
            turnOnPump=decision,
            pumpRunningTime=depth,
            timestamp=timestamp
        )
        
        logger.info(f"Processing completed for {data.cropName} at ({data.latitude}, {data.longitude})")
        return processed_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during processing: {str(e)}"
        )

@app.get("/status")
async def get_system_status():
    """
    Check system status
    
    Returns:
        dict: System status information
    """
    try:
        validate_files_exist()
        
        return {
            "status": "operational",
            "timestamp": datetime.now().isoformat(),
            "files_validated": True
        }
    except HTTPException as e:
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": e.detail
        }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Returns:
        dict: Health status
    """
    return {"status": "healthy"}

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle value errors"""
    return HTTPException(
        status_code=400,
        detail=str(exc)
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger.error(f"Uncaught exception: {str(exc)}")
    error_response = ErrorResponse(
        error="Internal Server Error",
        detail=str(exc),
        timestamp=datetime.now().isoformat()
    )
    return JSONResponse(
        status_code=500,
        content=error_response.dict()
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )