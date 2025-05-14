from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import InceptionV3
from tensorflow.keras import layers, models
from PIL import Image
from tensorflow.keras.models import load_model
import io
import os
from typing import Optional
from pydantic import BaseModel

app = FastAPI(title="AHRC Cervical Cancer Detection API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_inception_cancer_model():
    """Recreate the InceptionV3-based cancer detection model"""
    
    # Base InceptionV3 model
    base_model = InceptionV3(weights='imagenet', include_top=False, input_shape=(299, 299, 3))
    
    # Freeze base model layers
    for layer in base_model.layers:
        layer.trainable = False
    
    # Add custom top layers
    inputs = base_model.input
    x = base_model.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(3, activation='softmax')(x)
    
    model = models.Model(inputs=inputs, outputs=outputs)
    
    return model

def load_model_safe(weights_path):
    """Safely load the model with multiple fallback methods"""
    
    # Method 1: Try direct loading
    try:
        model = tf.keras.models.load_model(weights_path)
        print("Model loaded directly")
        return model
    except Exception as e:
        print(f"Direct loading failed: {e}")
    
    # Method 2: Create architecture and load weights
    try:
        model = create_inception_cancer_model()
        model.load_weights(weights_path)
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        print("Model loaded by creating architecture and loading weights")
        return model
    except Exception as e:
        print(f"Architecture + weights loading failed: {e}")
    
    # Method 3: Create new model (fallback)
    print("Creating new model without pre-trained weights")
    model = create_inception_cancer_model()
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

# Load model at startup
print("Loading cancer detection model...")
try:
   # model = load_model_safe("model_iv3.h5")
    model = load_model("model_iv3.h5") 
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Pydantic models
class PredictionOutput(BaseModel):
    predicted_class: str
    # confidence: float
    message: str
    image_path: Optional[str] = None

# Class labels
labels = {0: "Benign", 1: "Malignant", 2: "Suspicious"}

@app.post("/predict", response_model=PredictionOutput)
async def predict_cancer(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Preprocess for InceptionV3 (299x299, NOT grayscale)
        image_rgb = image.convert('RGB')
        image_resized = image_rgb.resize((299, 299))
        
        # Convert to array and preprocess
        image_array = np.array(image_resized)
        image_array = tf.keras.applications.inception_v3.preprocess_input(image_array)
        image_expanded = np.expand_dims(image_array, axis=0)
        
        # Make prediction
        prediction = model.predict(image_expanded)
        predicted_class_idx = np.argmax(prediction)
        confidence = float(prediction[0][predicted_class_idx])
        predicted_class = labels[predicted_class_idx]
        
        # Save prediction
        os.makedirs(f"./predictions/{predicted_class}/predicted/", exist_ok=True)
        file_path = f"./predictions/{predicted_class}/predicted/{file.filename}"
        image.save(file_path)
        
        return PredictionOutput(
            predicted_class=predicted_class,
            # confidence=confidence,
            message=f"Predicted class is {predicted_class}",
            image_path=file_path
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "tensorflow_version": tf.__version__,
        "model_type": "InceptionV3-based"
    }

@app.get("/model/info")
async def model_info():
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "model_type": "InceptionV3 Transfer Learning",
        "input_shape": (299, 299, 3),
        "preprocessing": "InceptionV3 preprocessing (NOT grayscale)",
        "classes": labels,
        "base_model": "InceptionV3 (ImageNet)",
        "total_layers": len(model.layers) if model else 0
    }

if __name__ == "__main__":
    # Create necessary directories
    for class_name in labels.values():
        os.makedirs(f"./predictions/{class_name}/predicted/", exist_ok=True)
        os.makedirs(f"./predictions/{class_name}/validated/", exist_ok=True)
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
