# Use Python 3.10 with slim image for smaller size
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for OpenCV and other packages
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application files
COPY app.py .

# Copy the model weights file
COPY OCT_segmentation_jaccard.h5 .

# Expose the port
EXPOSE 8004

# Command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8004"]