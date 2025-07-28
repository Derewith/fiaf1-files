[![🔄 Fetch and Cache F1 Docs](https://github.com/Derewith/fiaf1-files/actions/workflows/fetch-docs.yml/badge.svg)](https://github.com/Derewith/fiaf1-files/actions/workflows/fetch-docs.yml)

# FIA F1 Documents Viewer

A REST API and Progressive Web App (PWA) for viewing official FIA Formula 1 documents.

## Features

- **REST API**: Fetch F1 documents from FIA's website
- **PWA**: Responsive web application with offline support
- **Document Viewer**: View PDF documents directly in the browser
- **PDF Caching**: Downloads PDFs to our server for reliable viewing
- **Filtering and Search**: Filter by events and search by document titles
- **Installable**: Install as a native app on mobile and desktop

## Getting Started

### Automatic Event Discovery

The system now includes automatic discovery of new Formula 1 events:

```bash
# Fetch and update event IDs from FIA website
bun run fetch-events

# Test the event fetcher with sample data
bun run fetch-events:test
```

This automatically updates the configuration with new race IDs as they are published on the FIA website.

### Fetch Documents

Before starting the server for the first time, you should fetch and cache all documents:

```bash
# Fetch and download all F1 documents
bun run fetch
```

This command will:
1. Fetch document metadata from FIA's website
2. Download each PDF document to the `/public/documents/` directory
3. Create a local cache with document information and local paths

### API Server

```bash
# Development mode with hot reload
bun run dev

# Build for production
bun run build

# Start the production server
bun run start
```

### PWA Server

```bash
# Development mode with hot reload
bun run dev:pwa

# Build for production
bun run build:pwa

# Start the production server
bun run start:pwa
```

By default, the API runs on port 3000 and the PWA on port 3001 to work with railway deployments

## API Endpoints

- `GET /documents` - Get all cached documents
- `GET /events` - Get list of events
- `POST /admin/regen` - Regenerate documents cache (requires `CACHE_TOKEN` header)

## PWA Routes

- `GET /` - The main PWA interface
- `GET /manifest.json` - PWA manifest for app installation
- `GET /service-worker.js` - Service worker for offline functionality

## PWA Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Offline Support**: Caches assets and data for offline use
- **Document Viewing**: View PDFs directly in the app
- **Filtering**: Filter documents by event
- **Search**: Search documents by title
- **Dark Theme**: Easy on the eyes

## How It Works

### Document Fetching and Storage

1. The application fetches document metadata from the FIA website
2. Each PDF is downloaded to our local server in `/public/documents/`
3. The documents are served directly from our server instead of FIA's URLs
4. This approach provides better reliability and prevents automatic downloads

### Document Viewing

The application uses a multi-layered approach to display PDFs:

1. First attempts to display PDFs using browser's native capabilities
2. If that fails, provides options to view using Google Docs Viewer or download directly
3. Local PDFs (downloaded to our server) are displayed directly in the browser
