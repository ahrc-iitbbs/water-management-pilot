## Next.js



# Irrigation System: Centralized Architecture

This document provides a complete overview of the irrigation system architecture with Next.js frontend and FastAPI backend deployed in separate folders.

## Project Structure

```
irrigation-system/
├── frontend/                 # Next.js application
│   ├── app/
│   │   ├── actions.ts        # Server actions
│   │   ├── types.ts          # Type definitions
│   │   ├── page.tsx          # Main page
│   │   ├── logs/             # Log viewer pages
│   │   │   └── page.tsx      # Log viewer component
│   │   └── ui/               # UI components
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── backend/                  # FastAPI application
│   ├── app.py                # FastAPI server
│   ├── Dockerfile            # Docker configuration
│   ├── docker-compose.yml    # Docker compose configuration
│   ├── requirements.txt      # Python dependencies
│   ├── logs/                 # Log storage directory
│   └── data/                 # Data storage directory
│
└── README.md                 # System documentation
```

## System Components

### 1. Next.js Frontend (`/frontend`)

The frontend application handles user interactions and displays irrigation recommendations:

- **Server Actions (`actions.ts`)**: Communicates with the FastAPI backend
- **Type Definitions (`types.ts`)**: Ensures type safety across the application
- **Main Form (`page.tsx`)**: Collects irrigation parameters from users
- **Log Viewer (`logs/page.tsx`)**: Displays system logs and records
- **UI Components**: Reusable interface elements

### 2. FastAPI Backend (`/backend`)

The backend processes irrigation data and generates recommendations:

- **API Server (`app.py`)**: Processes irrigation data and makes decisions
- **Docker Configuration**: Containerizes the application
- **Log System**: Records detailed information about system activity
- **Data Storage**: Maintains irrigation records

## Communication Flow

1. **User Input**: Users enter irrigation parameters in the Next.js frontend
2. **Server Action**: `createInvoice()` in `actions.ts` sends data to the FastAPI backend
3. **Data Processing**: FastAPI processes the data and generates a recommendation
4. **Response**: FastAPI returns the decision to the Next.js application
5. **Display**: Next.js renders the recommendation for the user

```
┌───────────────┐         ┌──────────────┐         ┌──────────────┐
│   Next.js UI  │         │  Server      │         │   FastAPI    │
│   (Browser)   │◄─────►  │  Action      │◄─────►  │   Backend    │
└───────────────┘         └──────────────┘         └──────────────┘
                                                          │
                                                          ▼
                                                   ┌──────────────┐
                                                   │ Logs & Data  │
                                                   └──────────────┘
```

## Deployment Architecture

### Local Development

During development, both applications run separately:

- Next.js: `npm run dev` (localhost:3000)
- FastAPI: `uvicorn app:app --reload` (localhost:8000)

### Production Deployment

In production, the system is deployed as follows:

1. **Backend**: Containerized with Docker and deployed to a server
2. **Frontend**: Built with `next build` and deployed to a hosting service

```
┌─────────────────────────┐     ┌─────────────────────────┐
│      Server 1           │     │      Server 2           │
│  ┌─────────────────┐    │     │  ┌─────────────────┐    │
│  │   Docker        │    │     │  │    Next.js      │    │
│  │   Container     │◄───┼─────┼──┤    Frontend     │    │
│  │   (FastAPI)     │    │     │  │                 │    │
│  └─────────────────┘    │     │  └─────────────────┘    │
│          │              │     │                         │
│  ┌───────┴───────┐      │     │                         │
│  │ Volume Mounts │      │     │                         │
│  │ - logs/       │      │     │                         │
│  │ - data/       │      │     │                         │
│  └───────────────┘      │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

## Configuration

### Frontend Configuration

The Next.js frontend requires configuration to connect to the FastAPI backend:

```typescript
// .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8000

// .env.production (production)
NEXT_PUBLIC_API_URL=https://api.your-server.com
```

Update the server action to use this configuration:

```typescript
// actions.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function createInvoice(formData: FormData): Promise<ProcessedFormData> {
  // ...
  const response = await fetch(`${API_URL}/process`, {
    // ...
  });
  // ...
}
```

### Backend Configuration

The FastAPI backend can be configured through environment variables in `docker-compose.yml`:

```yaml
environment:
  - LOG_LEVEL=INFO
  - TZ=UTC
  - CORS_ORIGINS=https://your-frontend-domain.com
```

## Log Management

The system maintains logs in multiple locations:

1. **Backend Logs**:
   - API Logs: `/backend/logs/irrigation_api.log`
   - Decision Logs: `/backend/logs/irrigation_decisions.log`
   - Records: `/backend/data/irrigation_records.json`

2. **Frontend Logs**:
   - Next.js Server Logs: Generated during runtime

3. **Log Access**:
   - API Endpoints: `/logs/decisions`, `/logs/records`, `/status`
   - Log Viewer UI: Access through the frontend application

## Scaling Considerations

For scaling the system:

1. **Backend**:
   - Deploy multiple FastAPI instances behind a load balancer
   - Use centralized logging services (ELK, Graylog)
   - Consider Kubernetes for container orchestration

2. **Frontend**:
   - Deploy to a CDN-enabled hosting service
   - Implement caching strategies
   - Consider server-side rendering for performance

## Maintenance Tasks

Regular maintenance tasks include:

1. **Log Rotation and Cleanup**:
   - Automated via the RotatingFileHandler in FastAPI
   - Additional cleanup scripts for older backups

2. **Database Backups**:
   - Regular backups of the irrigation records
   - Version control of configuration files

3. **Updates**:
   - Frontend package updates (`npm update`)
   - Backend dependency updates (update `requirements.txt`)
   - Container rebuilds (`docker-compose build --no-cache`)