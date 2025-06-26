[![🔄 Fetch and Cache F1 Docs](https://github.com/Derewith/fiaf1-files/actions/workflows/fetch-docs.yml/badge.svg)](https://github.com/Derewith/fiaf1-files/actions/workflows/fetch-docs.yml)

# FIA F1 Documents Viewer

A REST API and Progressive Web App (PWA) for viewing official FIA Formula 1 documents.

## Features

- **REST API**: Fetch F1 documents from FIA's website
- **PWA**: Responsive web application with offline support
- **Document Viewer**: View PDF documents directly in the browser
- **Filtering and Search**: Filter by events and search by document titles
- **Installable**: Install as a native app on mobile and desktop

## Getting Started

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

By default, the API runs on port 3000 and the PWA on port 3001.
You can change these by setting the `API_PORT` and `PWA_PORT` environment variables.

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
