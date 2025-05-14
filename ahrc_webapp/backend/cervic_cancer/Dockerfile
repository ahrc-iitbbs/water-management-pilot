# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create necessary directories
RUN mkdir -p data predictions/Benign/predicted predictions/Benign/validated \
    predictions/Malignant/predicted predictions/Malignant/validated \
    predictions/Suspicious/predicted predictions/Suspicious/validated

EXPOSE 8001

CMD ["uvicorn", "app_cervic:app", "--host", "0.0.0.0", "--port", "8001"]