from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, UpSampling2D, concatenate, Dropout
from tensorflow.keras.models import Model
from PIL import Image
import io
import logging
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OCT Segmentation API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the model
model = None

def unet(img_rows, img_cols, nb_classes):
    """Define the U-Net architecture"""
    inputs = tf.keras.Input(shape=(img_rows, img_cols, 1))
    
    conv1 = Conv2D(8, 3, activation='elu', padding='same', kernel_initializer='he_normal')(inputs)
    conv1 = Conv2D(8, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv1)
    pool1 = MaxPooling2D(pool_size=(2, 2))(conv1)
    
    conv2 = Conv2D(16, 3, activation='elu', padding='same', kernel_initializer='he_normal')(pool1)
    conv2 = Conv2D(16, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv2)
    pool2 = MaxPooling2D(pool_size=(2, 2))(conv2)
    
    conv3 = Conv2D(32, 3, activation='elu', padding='same', kernel_initializer='he_normal')(pool2)
    conv3 = Conv2D(32, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv3)
    pool3 = MaxPooling2D(pool_size=(2, 2))(conv3)
    
    conv4 = Conv2D(64, 3, activation='elu', padding='same', kernel_initializer='he_normal')(pool3)
    conv4 = Conv2D(64, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv4)
    drop4 = Dropout(0.5)(conv4)
    pool4 = MaxPooling2D(pool_size=(1, 1))(drop4)
    
    conv5 = Conv2D(64, 3, activation='elu', padding='same', kernel_initializer='he_normal')(pool4)
    conv5 = Conv2D(64, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv5)
    drop5 = Dropout(0.5)(conv5)
    
    up6 = Conv2D(64, 2, activation='elu', padding='same', kernel_initializer='he_normal')(UpSampling2D(size=(1,1))(drop5))
    merge6 = concatenate([drop4, up6], axis=3)
    conv6 = Conv2D(64, 3, activation='elu', padding='same', kernel_initializer='he_normal')(merge6)
    conv6 = Conv2D(64, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv6)
    
    up7 = Conv2D(32, 2, activation='elu', padding='same', kernel_initializer='he_normal')(UpSampling2D(size=(2,2))(conv6))
    merge7 = concatenate([conv3, up7], axis=3)
    conv7 = Conv2D(32, 3, activation='elu', padding='same', kernel_initializer='he_normal')(merge7)
    conv7 = Conv2D(32, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv7)
    
    up8 = Conv2D(16, 2, activation='elu', padding='same', kernel_initializer='he_normal')(UpSampling2D(size=(2,2))(conv7))
    merge8 = concatenate([conv2, up8], axis=3)
    conv8 = Conv2D(16, 3, activation='elu', padding='same', kernel_initializer='he_normal')(merge8)
    conv8 = Conv2D(16, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv8)
    
    up9 = Conv2D(8, 2, activation='elu', padding='same', kernel_initializer='he_normal')(UpSampling2D(size=(2,2))(conv8))
    merge9 = concatenate([conv1, up9], axis=3)
    conv9 = Conv2D(8, 3, activation='elu', padding='same', kernel_initializer='he_normal')(merge9)
    conv9 = Conv2D(8, 3, activation='elu', padding='same', kernel_initializer='he_normal')(conv9)
    
    conv10 = Conv2D(nb_classes, 1, activation='softmax')(conv9)
    
    model = Model(inputs=[inputs], outputs=[conv10])
    return model

def load_model():
    """Load the pre-trained model"""
    global model
    try:
        # Define model parameters (same as used during training)
        img_rows = 200  # Update based on your dataset
        img_cols = 400  # Update based on your dataset
        nb_classes = 11  # Number of segmentation classes
        
        # Create model
        model = unet(img_rows, img_cols, nb_classes)
        
        # Load the saved weights
        model.load_weights('OCT_segmentation_jaccard.h5')
        
        logger.info("Weights loaded successfully!")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

def process_label(label_file):
    """
    This function maps segmentation labels to their corresponding colors.
    Labels are assumed to be from 0 to 11.
    """
    colors = np.array([
        [0, 0, 0],      # Background
        [255, 0, 0],    # Red
        [0, 255, 0],    # Green
        [0, 0, 255],    # Blue
        [255, 255, 0],  # Yellow
        [255, 0, 255],  # Magenta
        [0, 255, 255],  # Cyan
        [255, 153, 51], # Orange
        [255, 100, 10], # Dark Orange
        [255, 50, 100], # Pinkish Red
        [50, 50, 50],   # Gray
        [255, 255, 255] # White
    ], dtype=np.uint8)
    
    H, W = label_file.shape
    img = np.zeros((H, W, 3), dtype=np.uint8)
    
    # Apply color mapping efficiently
    for label in np.unique(label_file):
        if label < len(colors):  # Ensure we don't go out of bounds
            img[label_file == label] = colors[label]
    
    return img

def preprocess_image(image_file_contents):
    """Preprocess the uploaded image file to numpy array format"""
    try:
        # Open the image
        image = Image.open(io.BytesIO(image_file_contents))
        
        # Convert to grayscale if necessary
        if image.mode != 'L':
            image = image.convert('L')
        
        # Resize to expected dimensions (200x400)
        image = image.resize((400, 200))
        
        # Convert to numpy array
        image_array = np.array(image)
        
        return image_array
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise

@app.post("/segment")
async def segment_image(file: UploadFile = File(...)):
    """Process a JPEG/PNG file and return the colored segmentation result as PNG"""
    
    # Check file type
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="File must be a JPEG or PNG file")
    
    try:
        # Read file content
        contents = await file.read()
        
        # Preprocess the image
        image = preprocess_image(contents)
        
        # Store original image for later
        original_image = image.copy()
        
        # Normalize and reshape correctly
        image = image / 255.0  # Normalize values to [0,1]
        image = np.expand_dims(image, axis=-1)  # Add channel dimension (200, 400, 1)
        image = np.expand_dims(image, axis=0)  # Add batch dimension (1, 200, 400, 1)
        
        # Ensure correct type
        image = np.array(image, dtype=np.float32)
        
        # Debugging: Print input shape
        logger.info(f"Processing {file.filename}, input shape: {image.shape}")
        
        # Run prediction through the model
        prediction = model.predict(image)  # Shape: (1, 200, 400, num_classes)
        prediction = np.argmax(prediction, axis=-1)  # Convert to class indices
        
        # Remove batch dimension
        prediction = prediction.squeeze()  # Shape: (200, 400)
        
        # Apply process_label function to visualize the segmentation labels
        processed_image = process_label(prediction)
        
        # Convert to PIL Image for saving
        pil_image = Image.fromarray(processed_image)
        
        # Save as PNG in memory
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Return the image
        filename_base = file.filename.rsplit('.', 1)[0]
        return StreamingResponse(
            img_byte_arr, 
            media_type="image/png",
            headers={
                "Content-Disposition": f'inline; filename="{filename_base}_segmented.png"'
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/segment_both")
async def segment_image_both(file: UploadFile = File(...)):
    """Process a JPEG/PNG file and return both original and segmented images"""
    
    # Check file type
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="File must be a JPEG or PNG file")
    
    try:
        # Read file content
        contents = await file.read()
        
        # Preprocess the image
        image = preprocess_image(contents)
        
        # Store original image
        original_normalized = (image / image.max() * 255).astype(np.uint8)
        original_pil = Image.fromarray(original_normalized)
        
        # Convert grayscale to RGB for display
        if original_pil.mode == 'L':
            original_pil = original_pil.convert('RGB')
        
        # Save original as PNG
        original_byte_arr = io.BytesIO()
        original_pil.save(original_byte_arr, format='PNG')
        original_byte_arr.seek(0)
        original_base64 = base64.b64encode(original_byte_arr.getvalue()).decode()
        
        # Process segmentation
        image = image / 255.0  # Normalize values to [0,1]
        image = np.expand_dims(image, axis=-1)  # Add channel dimension (200, 400, 1)
        image = np.expand_dims(image, axis=0)  # Add batch dimension (1, 200, 400, 1)
        
        # Ensure correct type
        image = np.array(image, dtype=np.float32)
        
        # Run prediction through the model
        prediction = model.predict(image)  # Shape: (1, 200, 400, num_classes)
        prediction = np.argmax(prediction, axis=-1)  # Convert to class indices
        
        # Remove batch dimension
        prediction = prediction.squeeze()  # Shape: (200, 400)
        
        # Apply process_label function to visualize the segmentation labels
        processed_image = process_label(prediction)
        
        # Convert to PIL Image for saving
        pil_image = Image.fromarray(processed_image)
        
        # Save as PNG in memory
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        segmented_base64 = base64.b64encode(img_byte_arr.getvalue()).decode()
        
        # Return both images as JSON
        return JSONResponse(content={
            "original": f"data:image/png;base64,{original_base64}",
            "segmented": f"data:image/png;base64,{segmented_base64}",
            "filename": file.filename
        })
        
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/original")
async def return_original(file: UploadFile = File(...)):
    """Process a JPEG/PNG file and return the original image as PNG"""
    
    # Check file type
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(status_code=400, detail="File must be a JPEG or PNG file")
    
    try:
        # Read file content
        contents = await file.read()
        
        # Open the image directly from contents
        pil_image = Image.open(io.BytesIO(contents))
        
        # Resize to expected dimensions
        pil_image = pil_image.resize((400, 200))
        
        # Save as PNG in memory
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Return the image
        filename_base = file.filename.rsplit('.', 1)[0]
        return StreamingResponse(
            img_byte_arr, 
            media_type="image/png",
            headers={
                "Content-Disposition": f'inline; filename="{filename_base}_original.png"'
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)