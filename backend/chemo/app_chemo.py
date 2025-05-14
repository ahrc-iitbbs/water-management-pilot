
from fastapi import FastAPI, File, UploadFile, HTTPException,Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from project_pages.dataprocessMode import map_data
from project_pages.dataMode import map_dataprocess
import os
import json
from typing import Optional
import io

# Initialize FastAPI app
app = FastAPI(title="Chemotherapy Toxicity Prediction API")

# Load the model
try:
    savedModel = load_model('model.h5')
except Exception as e:
    print(f"Error loading model: {e}")
    savedModel = None

# Request/Response models
class PredictionRequest(BaseModel):
    file_number: str
    
class PredictionResponse(BaseModel):
    file_number: str
    prediction: str
    severity: bool
    confidence: Optional[float] = None

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...), file_number: str = Form(...)):
    
    print(f"Received request - file_number: {file_number}, filename: {file.filename if file else 'No file'}")
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel format")
    
    # Check if file_number is provided
    if not file_number:
        raise HTTPException(status_code=400, detail="File number is required")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        # Check if the file number exists in the data
        if 'FILE NO' not in df.columns:
            raise HTTPException(status_code=400, detail="Excel file must contain 'FILE NO' column")
        
        input_data = df[df['FILE NO'] == file_number]
        
        # Check if any data was found for the given file number
        if input_data.empty:
            raise HTTPException(status_code=404, detail=f"No data found for file number: {file_number}")
        
        columns_to_keep = ['Age', 'Gender','Place of Habitation','Annual Income',
                          'Smoking Status','Alcohol',
                          'Tobacco Chewing Status', 'Comorbidities','ECOG PS',
                          'BMI','Bipedal Edema', 'Site of Primary Cancer Encoded', 'Stage',
                          'Chemotherapy Protocol','Cycle Number','Dosing of Chemotherapy',
                          'Use of Prophylactic Growth Factors', 'Haemoglobin',
                          'WBC','Absolute Lymphocytes','Absolute Neutrophil Count',
                          'Neutrophil to Lymphocyte ratio','Total Platelet count',
                          'Serum Albumin','Serum Creatinine','Eosinophils',
                          'Basophils','Monocytes']
        
        # Check if all required columns exist
        missing_columns = [col for col in columns_to_keep if col not in input_data.columns]
        if missing_columns:
            raise HTTPException(status_code=400, 
                              detail=f"Missing required columns in Excel file: {', '.join(missing_columns)}")
        
        input_data = input_data[columns_to_keep]
        input_data = input_data.fillna(-1)
        
        inputdata = input_data.copy()
        inputdata.replace("", np.nan, inplace=True)
        inputdata.fillna(str(-1), inplace=True)
        
        print(savedModel.input_shape)
        
        # Process the data
        processed_df = map_dataprocess(inputdata)
        # print(processed_df)
        
        result = savedModel.predict(processed_df)
        label = np.argmax(result, axis=1)[0]
        print(result)
        
        # Determine prediction
        is_severe = label == 1
        prediction_text = "Patient may develop severe hematologic toxicity" if is_severe else "No severe hematologic toxicity"
        
        return PredictionResponse(
            file_number=file_number,
            prediction=prediction_text,
            severity=is_severe,
            confidence=float(result[0][label])
        )
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": savedModel is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)  # Note: Changed to port 8002 to match your Docker config