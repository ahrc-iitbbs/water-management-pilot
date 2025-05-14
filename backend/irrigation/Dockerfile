# Use Python 3.9 as base image
FROM --platform=${BUILDPLATFORM:-linux/amd64} python:3.10-slim


# Install system dependencies including GDAL
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL environment variables
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/url/include/gdal

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

RUN pip install --upgrade pip

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create logs and data directories
RUN mkdir -p /app/logs /app/data

# Copy application code
COPY app.py .
COPY *.xlsx .
COPY *.pkl .
COPY sm_tif /app/sm_tif

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    LOG_DIR=/app/logs \
    DATA_DIR=/app/data

# Expose port for FastAPI
EXPOSE 8000

# Set health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/status || exit 1

# Command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]