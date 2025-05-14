# Use Python 3.9 slim image as base
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for TensorFlow and pandas
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libhdf5-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY app_chemo.py .
COPY model.h5 .

# Copy additional modules if you have them
COPY project_pages/ ./project_pages/

# Copy configuration files if needed
# COPY config.json .
# OR if using a service account key file
# COPY service-account-key.json .

# Expose the port the app runs on
EXPOSE 8002

# Create a non-root user for security
RUN useradd -m -u 1000 appuser
USER appuser

# Set environment variables if needed
# ENV SPREADSHEET_ID=your_spreadsheet_id
# ENV GCP_CREDENTIALS='{"type": "service_account", ...}'

# Command to run the application
CMD ["uvicorn", "app_chemo:app", "--host", "0.0.0.0", "--port", "8002"]