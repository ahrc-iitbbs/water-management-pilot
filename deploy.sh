#!/bin/bash

# AHRC App Docker Hub Deployment Script
# This script builds and pushes the AHRC app docker images to Docker Hub
# with multi-platform support (amd64 and arm64)

# Exit immediately if a command exits with a non-zero status
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print step information
print_step() {
    echo -e "\n${BLUE}==>${NC} ${GREEN}$1${NC}"
}

# Function to print error information
print_error() {
    echo -e "\n${RED}ERROR:${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Docker Buildx is available
if ! docker buildx version &> /dev/null; then
    print_error "Docker Buildx is not available. Please install or enable Docker Buildx."
    exit 1
fi

# Set the Docker Hub username - replace with your Docker Hub username
DOCKER_USERNAME=""

# If username is not set, prompt for it
if [ -z "$DOCKER_USERNAME" ]; then
    read -p "Enter your Docker Hub username: " DOCKER_USERNAME
    
    if [ -z "$DOCKER_USERNAME" ]; then
        print_error "Docker Hub username is required."
        exit 1
    fi
fi

# Export the username for docker-compose to use
export DOCKER_USERNAME

# Define the image names
BACKEND_IMAGE="${DOCKER_USERNAME}/ahrc-api"
FRONTEND_IMAGE="${DOCKER_USERNAME}/ahrc-ui"

# Prompt for version tag or use latest
read -p "Enter version tag (default: latest): " VERSION_TAG
VERSION_TAG=${VERSION_TAG:-latest}

# Setup multi-platform builder if not exists
if ! docker buildx inspect ahrc-builder &> /dev/null; then
    print_step "Creating multi-platform builder"
    docker buildx create --name ahrc-builder --use
fi

print_step "Logging in to Docker Hub"
echo "Please enter your Docker Hub credentials when prompted:"
docker login

print_step "Building multi-platform Docker images (this may take some time)"
echo "Building backend image for amd64 and arm64..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ${BACKEND_IMAGE}:latest \
  --push \
  ./backend

echo "Building frontend image for amd64 and arm64..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ${FRONTEND_IMAGE}:latest \
  --push \
  ./frontend

if [ "$VERSION_TAG" != "latest" ]; then
    print_step "Tagging images with version: ${VERSION_TAG}"
    
    echo "Building backend image with version tag..."
    docker buildx build --platform linux/amd64,linux/arm64 \
      -t ${BACKEND_IMAGE}:${VERSION_TAG} \
      --push \
      ./backend
    
    echo "Building frontend image with version tag..."
    docker buildx build --platform linux/amd64,linux/arm64 \
      -t ${FRONTEND_IMAGE}:${VERSION_TAG} \
      --push \
      ./frontend
fi

print_step "Deployment complete!"
echo -e "${GREEN}The following images have been pushed to Docker Hub:${NC}"
echo -e "  - ${BACKEND_IMAGE}:latest"
echo -e "  - ${FRONTEND_IMAGE}:latest"

if [ "$VERSION_TAG" != "latest" ]; then
    echo -e "  - ${BACKEND_IMAGE}:${VERSION_TAG}"
    echo -e "  - ${FRONTEND_IMAGE}:${VERSION_TAG}"
fi

echo -e "\n${YELLOW}To deploy these images on another server, run:${NC}"
echo -e "  export DOCKER_USERNAME=${DOCKER_USERNAME}"
echo -e "  export VERSION_TAG=${VERSION_TAG}"
echo -e "  docker-compose -f docker-compose.prod.yml pull"
echo -e "  docker-compose -f docker-compose.prod.yml up -d"

echo -e "\n${GREEN}Thank you for using the AHRC App deployment script!${NC}"