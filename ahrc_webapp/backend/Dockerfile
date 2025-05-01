# Use Python 3.9 as base image
FROM --platform=${BUILDPLATFORM:-linux/amd64} python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create logs and data directories
RUN mkdir -p /app/logs /app/data

# Copy application code
COPY app.py .

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