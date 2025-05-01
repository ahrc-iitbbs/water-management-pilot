from fastapi import FastAPI, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import httpx
import json
import os
import logging
from logging.handlers import RotatingFileHandler
import uuid
import sys
from fastapi import APIRouter, HTTPException, Query
import os
import logging
import json
from typing import List, Optional


# Setup logging with environment-aware configuration
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_DIR = os.environ.get("LOG_DIR", "/app/logs")
DATA_DIR = os.environ.get("DATA_DIR", "/app/data")

# Create directories if they don't exist
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Configure two log files - one for detailed debug logs and one for irrigation decisions
api_logger = logging.getLogger("irrigation_api")
api_logger.setLevel(getattr(logging, LOG_LEVEL))

# Add console handler to display logs in container output
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
api_logger.addHandler(console_handler)

# Handler for detailed API logs (all requests, responses, errors)
api_handler = RotatingFileHandler(
    os.path.join(LOG_DIR, "irrigation_api.log"),
    maxBytes=10485760,  # 10MB
    backupCount=10
)
api_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
api_logger.addHandler(api_handler)

# Handler for irrigation decisions log (focused on irrigation recommendations)
decision_logger = logging.getLogger("irrigation_decisions")
decision_logger.setLevel(logging.INFO)
decision_handler = RotatingFileHandler(
    os.path.join(LOG_DIR, "irrigation_decisions.log"),
    maxBytes=10485760,  # 10MB
    backupCount=10
)
decision_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(message)s'
))
decision_logger.addHandler(decision_handler)
decision_logger.addHandler(console_handler)  # Also log decisions to console

# Startup message
api_logger.info(f"Starting Irrigation Management API in Docker container")
api_logger.info(f"LOG_DIR: {LOG_DIR}")
api_logger.info(f"DATA_DIR: {DATA_DIR}")
api_logger.info(f"Log level: {LOG_LEVEL}")

# Create FastAPI app
app = FastAPI(title="Irrigation Management API", description="API for processing irrigation data from Next.js")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production to be more restrictive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model matching the data sent from Next.js
class IrrigationInput(BaseModel):
    latitude: str
    longitude: str
    croppedArea: float
    cropName: str
    sowingDate: str
    basePeriod: int
    lastIrrigationDate: str
    pumpHP: float
    pumpDischargeRate: float
    pumpType: str
    irrigationMethod: str

# Response model matching your Next.js interface
class ProcessedIrrigationData(BaseModel):
    latitude: str
    longitude: str
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
    pumpRunningTime: str
    timestamp: str
    apiData: Dict[str, Any]

# Define a model for storing past irrigation logs
class IrrigationRecord(BaseModel):
    id: str
    timestamp: str
    latitude: str
    longitude: str
    cropName: str
    croppedArea: float
    lastIrrigationDate: str
    turnOnPump: bool
    pumpRunningTime: str
    daysSinceIrrigation: int
    weatherData: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

# Path to the irrigation records JSON file
RECORDS_FILE = os.path.join(DATA_DIR, "irrigation_records.json")

# Function to save irrigation records to a JSON file
def save_irrigation_record(record: IrrigationRecord):
    try:
        # Load existing records if file exists
        existing_records = []
        if os.path.exists(RECORDS_FILE):
            with open(RECORDS_FILE, 'r') as f:
                try:
                    existing_records = json.load(f)
                except json.JSONDecodeError:
                    api_logger.error("Error decoding JSON records file, creating new file")
                    existing_records = []
        
        # Add new record
        existing_records.append(record.dict())
        
        # Write all records back to file
        with open(RECORDS_FILE, 'w') as f:
            json.dump(existing_records, f, indent=2)
            
        api_logger.debug(f"Saved irrigation record with ID {record.id}")
    except Exception as e:
        api_logger.error(f"Error saving irrigation record: {str(e)}")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Generate request ID
    request_id = str(uuid.uuid4())
    
    # Log request details
    api_logger.info(f"Request {request_id}: {request.method} {request.url}")
    
    # Process the request
    try:
        response = await call_next(request)
        api_logger.info(f"Response {request_id}: Status {response.status_code}")
        return response
    except Exception as e:
        api_logger.error(f"Error {request_id}: {str(e)}")
        raise

@app.post("/process", response_model=ProcessedIrrigationData)
async def process_irrigation_data(data: IrrigationInput):
    """
    Process the irrigation data received from Next.js server action
    """
    # Log the received data
    api_logger.info(f"Processing irrigation data for {data.cropName} at coordinates ({data.latitude}, {data.longitude})")
    api_logger.debug(f"Input data: {data.dict()}")
    
    # Convert string dates to datetime objects
    sowing_date = datetime.strptime(data.sowingDate, "%Y-%m-%d")
    last_irrigation_date = datetime.strptime(data.lastIrrigationDate, "%Y-%m-%d")
    current_date = datetime.now()
    
    # Calculate days since last irrigation
    days_since_irrigation = (current_date - last_irrigation_date).days
    
    # Calculate crop age in days
    crop_age = (current_date - sowing_date).days
    
    # Log the calculated values
    api_logger.debug(f"Days since last irrigation: {days_since_irrigation}")
    api_logger.debug(f"Crop age: {crop_age} days")
    
    # Logic to determine if pump needs to be turned on
    # This is a simplified example - real implementation would consider 
    # many factors such as soil moisture, weather data, crop water needs, etc.
    turn_on_pump = False
    pump_running_time = "0 hours 0 minutes"
    
    # Simple logic: If days since last irrigation is greater than 7 days, turn on pump
    # In a real system, this would be much more sophisticated
    if days_since_irrigation >= 7:
        turn_on_pump = True
        
        # Calculate irrigation duration based on crop area and pump discharge rate
        # This is a simplified calculation
        # Area in acres, converted to square meters
        area_square_meters = data.croppedArea * 4046.86
        
        # Water requirement (assuming 25mm of water)
        water_requirement_liters = area_square_meters * 25
        
        # Time required in minutes = water required / pump discharge rate
        time_required_minutes = water_requirement_liters / data.pumpDischargeRate
        
        # Convert to hours and minutes
        hours = int(time_required_minutes // 60)
        minutes = int(time_required_minutes % 60)
        
        pump_running_time = f"{hours} hours {minutes} minutes"
        
        # Log the irrigation decision with details
        api_logger.info(f"Recommendation: Turn ON pump for {pump_running_time}")
    else:
        # Log the decision not to irrigate
        api_logger.info(f"Recommendation: Do NOT turn on pump (last irrigation was {days_since_irrigation} days ago)")
    
    # Try to get weather data from an external API for enriched recommendations
    weather_data = {"error": "Weather data not fetched"}
    try:
        # Example API call to get weather data - replace with actual weather API
        # This is a placeholder URL - you'd need to use a real weather API
        weather_api_url = f"https://api.example.com/weather?lat={data.latitude}&lon={data.longitude}"
        
        # In a real implementation, you would make this call
        # For now, we'll simulate weather data
        # async with httpx.AsyncClient() as client:
        #     response = await client.get(weather_api_url)
        #     response.raise_for_status()
        #     weather_data = response.json()
        
        # Simulated weather data for demo purposes
        weather_data = {
            "temperature": 28.5,
            "humidity": 65,
            "precipitation_chance": 10,
            "wind_speed": 5.2
        }
        
        api_logger.debug(f"Weather data: {json.dumps(weather_data)}")
            
    except Exception as e:
        error_msg = f"Failed to fetch weather data: {str(e)}"
        api_logger.error(error_msg)
        weather_data = {"error": error_msg}
    
    # Record timestamp for the response
    timestamp = datetime.now().isoformat()
    
    # Prepare the response data
    processed_data = {
        "latitude": data.latitude,
        "longitude": data.longitude,
        "croppedArea": data.croppedArea,
        "cropName": data.cropName,
        "sowingDate": data.sowingDate,
        "basePeriod": data.basePeriod,
        "lastIrrigationDate": data.lastIrrigationDate,
        "pumpHP": data.pumpHP,
        "pumpDischargeRate": data.pumpDischargeRate,
        "pumpType": data.pumpType,
        "irrigationMethod": data.irrigationMethod,
        "turnOnPump": turn_on_pump,
        "pumpRunningTime": pump_running_time,
        "timestamp": timestamp,
        "apiData": weather_data
    }
    
    # Log the processed data
    api_logger.debug(f"Response data: {json.dumps(processed_data)}")
    
    # Record detailed decision log
    decision_log_message = (
        f"FIELD: {data.cropName} ({data.croppedArea} acres) at ({data.latitude}, {data.longitude}) | "
        f"DECISION: {'Irrigate' if turn_on_pump else 'Skip'} | "
        f"DETAILS: Last irrigation {days_since_irrigation} days ago, "
        f"Crop age {crop_age} days, "
        f"Pump time {pump_running_time}"
    )
    decision_logger.info(decision_log_message)
    
    # Create and save a detailed irrigation record
    record_id = str(uuid.uuid4())
    irrigation_record = IrrigationRecord(
        id=record_id,
        timestamp=timestamp,
        latitude=data.latitude,
        longitude=data.longitude,
        cropName=data.cropName,
        croppedArea=data.croppedArea,
        lastIrrigationDate=data.lastIrrigationDate,
        turnOnPump=turn_on_pump,
        pumpRunningTime=pump_running_time,
        daysSinceIrrigation=days_since_irrigation,
        weatherData=weather_data,
        notes=f"Base decision on days since irrigation: {days_since_irrigation} days"
    )
    save_irrigation_record(irrigation_record)
    
    return processed_data

@app.get("/logs/decisions", response_model=List[str])
async def get_decision_logs(limit: int = 50):
    """
    Retrieve recent irrigation decision logs
    """
    try:
        log_file = os.path.join(LOG_DIR, "irrigation_decisions.log")
        if not os.path.exists(log_file):
            return []
            
        with open(log_file, 'r') as f:
            # Get the last 'limit' lines
            lines = f.readlines()
            return lines[-limit:] if len(lines) > limit else lines
    except Exception as e:
        api_logger.error(f"Error reading decision logs: {str(e)}")
        return []

@app.get("/logs/records", response_model=List[IrrigationRecord])
async def get_irrigation_records(limit: int = 50):
    """
    Retrieve irrigation records
    """
    try:
        if not os.path.exists(RECORDS_FILE):
            return []
            
        with open(RECORDS_FILE, 'r') as f:
            records = json.load(f)
            return records[-limit:] if len(records) > limit else records
    except Exception as e:
        api_logger.error(f"Error reading irrigation records: {str(e)}")
        return []

@app.get("/status")
async def get_system_status():
    """
    Check system status and log file information
    """
    try:
        log_file = os.path.join(LOG_DIR, "irrigation_api.log")
        decision_file = os.path.join(LOG_DIR, "irrigation_decisions.log")
        
        log_size = os.path.getsize(log_file) if os.path.exists(log_file) else 0
        decision_size = os.path.getsize(decision_file) if os.path.exists(decision_file) else 0
        record_size = os.path.getsize(RECORDS_FILE) if os.path.exists(RECORDS_FILE) else 0
        
        # Count records
        record_count = 0
        if os.path.exists(RECORDS_FILE):
            with open(RECORDS_FILE, 'r') as f:
                try:
                    records = json.load(f)
                    record_count = len(records)
                except:
                    pass
        
        return {
            "status": "operational",
            "timestamp": datetime.now().isoformat(),
            "environment": "container",
            "logs": {
                "api_log_size_kb": round(log_size / 1024, 2),
                "decision_log_size_kb": round(decision_size / 1024, 2),
                "record_file_size_kb": round(record_size / 1024, 2),
                "record_count": record_count
            }
        }
    except Exception as e:
        api_logger.error(f"Error checking system status: {str(e)}")
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }



@app.delete("/logs/clear")
async def clear_logs(
    log_type: str = Query(..., description="Type of logs to clear: 'api', 'decisions', 'records', or 'all'")
):
    """
    Clear log files based on the specified type.
    """
    api_logger.info(f"Request to clear logs of type: {log_type}")
    
    try:
        if log_type == "api" or log_type == "all":
            # Clear API logs
            api_log_path = os.path.join(LOG_DIR, "irrigation_api.log")
            if os.path.exists(api_log_path):
                with open(api_log_path, 'w') as f:
                    f.write("")
                api_logger.info("API logs cleared")
        
        if log_type == "decisions" or log_type == "all":
            # Clear decision logs
            decision_log_path = os.path.join(LOG_DIR, "irrigation_decisions.log")
            if os.path.exists(decision_log_path):
                with open(decision_log_path, 'w') as f:
                    f.write("")
                api_logger.info("Decision logs cleared")
        
        if log_type == "records" or log_type == "all":
            # Clear irrigation records
            records_path = os.path.join(DATA_DIR, "irrigation_records.json")
            if os.path.exists(records_path):
                with open(records_path, 'w') as f:
                    f.write("[]")  # Empty JSON array
                api_logger.info("Irrigation records cleared")
                
        return {
            "status": "success",
            "message": f"Successfully cleared {log_type} logs"
        }
    
    except Exception as e:
        api_logger.error(f"Error clearing logs: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear logs: {str(e)}"
        )

@app.delete("/logs/records/{record_id}")
async def delete_record(record_id: str):
    """
    Delete a specific irrigation record by ID
    """
    try:
        records_path = os.path.join(DATA_DIR, "irrigation_records.json")
        
        # Check if records file exists
        if not os.path.exists(records_path):
            raise HTTPException(
                status_code=404,
                detail="Records file not found"
            )
            
        # Read existing records
        with open(records_path, 'r') as f:
            try:
                records = json.load(f)
            except json.JSONDecodeError:
                records = []
        
        # Find record by ID and remove it
        initial_count = len(records)
        records = [record for record in records if record.get('id') != record_id]
        
        # If no records were removed, the ID wasn't found
        if len(records) == initial_count:
            raise HTTPException(
                status_code=404,
                detail=f"Record with ID {record_id} not found"
            )
        
        # Write updated records back to file
        with open(records_path, 'w') as f:
            json.dump(records, f, indent=2)
        
        api_logger.info(f"Deleted record with ID: {record_id}")
        
        return {
            "status": "success",
            "message": f"Record {record_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error deleting record: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete record: {str(e)}"
        )
        
if __name__ == "__main__":
    import uvicorn
    api_logger.info("Starting Irrigation Management API server")
    uvicorn.run("app:app", host="0.0.0.0", port=8000)