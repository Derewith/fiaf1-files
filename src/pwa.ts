import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import path from "path";
import fs from "fs/promises";
import { loadCache, loadConfig } from "./utils";

// Import the loadConfig and loadCache functions

const app = new Elysia()
  .use(html())
  .use(
    staticPlugin({
      assets: path.join(__dirname, "../assets"),
      prefix: "/assets",
    })
  )
  .get("/", async () => {
    const cache = await loadCache();
    const config = await loadConfig();

    // If no cache, redirect to API to generate it
    if (!cache) {
      return `<html>
        <head>
          <meta http-equiv="refresh" content="5;url=/">
          <title>FIA F1 Documents - Loading</title>
          <style>
            body { font-family: 'Futura', sans-serif; text-align: center; margin: 100px auto; }
            .spinner { width: 40px; height: 40px; margin: 20px auto; border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: #09f; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <h1>Loading documents...</h1>
          <div class="spinner"></div>
          <p>This may take a moment. Please wait...</p>
        </body>
      </html>`;
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FIA Formula 1 Documents</title>
      <link rel="manifest" href="/manifest.json">
      <meta name="theme-color" content="#E10600">
      <link rel="icon" href="/assets/images/favicon.ico">
      <link rel="apple-touch-icon" href="/assets/images/fia-formula-logo.png">
      <style>
        @font-face {
          font-family: 'Futura';
          src: url('/assets/fonts/FuturaCyrillicMedium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
        }
        @font-face {
          font-family: 'Futura';
          src: url('/assets/fonts/FuturaCyrillicBold.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
        }
        @font-face {
          font-family: 'Futura';
          src: url('/assets/fonts/FuturaCyrillicLight.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
        }

        :root {
          --f1-red: #E10600;
          --f1-dark: #15151E;
          --f1-gray: #949498;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Futura', sans-serif;
          background-color: var(--f1-dark);
          color: #fff;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          background-color: #000;
          border-bottom: 2px solid var(--f1-red);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .logo {
          display: flex;
          align-items: center;
        }
        
        .logo img {
          height: 40px;
          margin-right: 10px;
        }
        
        h1 {
          font-size: 24px;
          font-weight: 700;
        }
        
        .filter-container {
          padding: 15px 20px;
          background-color: rgba(0,0,0,0.3);
          margin-bottom: 20px;
        }
        
        select {
          padding: 8px 12px;
          background-color: var(--f1-dark);
          color: white;
          border: 1px solid var(--f1-gray);
          border-radius: 4px;
          font-family: 'Futura', sans-serif;
          font-weight: 300;
          margin-right: 10px;
        }
        
        .search-box {
          padding: 8px 12px;
          background-color: var(--f1-dark);
          color: white;
          border: 1px solid var(--f1-gray);
          border-radius: 4px;
          font-family: 'Futura', sans-serif;
          font-weight: 300;
          width: 250px;
        }
        
        .documents {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .document-card {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .document-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          border-color: var(--f1-red);
        }
        
        .document-header {
          background-color: rgba(0, 0, 0, 0.5);
          padding: 10px 15px;
          border-bottom: 2px solid var(--f1-red);
        }
        
        .event-name {
          font-size: 14px;
          font-weight: 300;
          color: var(--f1-gray);
          display: block;
          margin-bottom: 5px;
        }
        
        .document-title {
          font-size: 16px;
          font-weight: 500;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .document-body {
          padding: 15px;
        }
        
        .document-date {
          font-size: 13px;
          color: var(--f1-gray);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }
        
        .document-date svg {
          margin-right: 5px;
          width: 14px;
          height: 14px;
        }
        
        .document-view {
          background-color: var(--f1-red);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Futura', sans-serif;
          font-weight: 500;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .document-view svg {
          margin-right: 5px;
        }
        
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.9);
          z-index: 100;
          flex-direction: column;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #000;
          border-bottom: 2px solid var(--f1-red);
        }
        
        .modal-title {
          font-size: 18px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 80%;
        }
        
        .modal-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 5px 10px;
        }
        
        .modal-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        
        iframe {
          flex-grow: 1;
          border: none;
          width: 100%;
          height: 100%;
        }
        
        .modal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.1);
          border-left-color: var(--f1-red);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .modal-actions {
          display: flex;
          justify-content: center;
          padding: 15px;
          background-color: #000;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .modal-actions button {
          background-color: var(--f1-red);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Futura', sans-serif;
          font-weight: 500;
          margin: 0 10px;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px;
          width: 100%;
          grid-column: 1 / -1;
        }
        
        .empty-state svg {
          width: 60px;
          height: 60px;
          color: var(--f1-gray);
          margin-bottom: 20px;
        }
        
        .empty-state h2 {
          font-size: 24px;
          margin-bottom: 10px;
          font-weight: 500;
        }
        
        .empty-state p {
          color: var(--f1-gray);
          font-weight: 300;
        }
        
        footer {
          margin-top: 40px;
          text-align: center;
          padding: 20px;
          color: var(--f1-gray);
          font-size: 12px;
          font-weight: 300;
        }
        
        @media (max-width: 768px) {
          header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .logo {
            margin-bottom: 10px;
          }
          
          .filter-container {
            flex-direction: column;
            align-items: stretch;
          }
          
          select, .search-box {
            width: 100%;
            margin-bottom: 10px;
            margin-right: 0;
          }
          
          .documents {
            grid-template-columns: 1fr;
          }
          
          .modal-title {
            max-width: 70%;
            font-size: 16px;
          }
        }
        
        /* PWA Install Button */
        #install-button {
          display: none;
          background-color: var(--f1-red);
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Futura', sans-serif;
          font-weight: 500;
        }
        
        @media (display-mode: standalone) {
          #install-button {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="logo">
          <img src="/assets/images/fia-formula-logo.png" alt="FIA Formula 1 Logo">
          <h1>Formula 1 Documents</h1>
        </div>
        <button id="install-button">Install App</button>
      </header>
      
      <div class="container">
        <div class="filter-container">
          <select id="event-filter">
            <option value="all">All Events</option>
            ${Object.entries(config.eventMappings || {})
              .map(([id, name]) => `<option value="${id}">${name}</option>`)
              .join("")}
          </select>
          <input type="text" class="search-box" id="search" placeholder="Search documents...">
        </div>
        
        <div class="documents" id="document-container">
          <!-- Documents will be loaded here dynamically -->
        </div>
        
        <div class="empty-state" style="display: none;" id="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2>No documents found</h2>
          <p>Try changing your search or filter criteria</p>
        </div>
      </div>
      
      <div class="modal" id="document-modal">
        <div class="modal-header">
          <div class="modal-title" id="modal-title">Document Title</div>
          <button class="modal-close" id="modal-close">&times;</button>
        </div>
        <div class="modal-content">
          <div class="modal-loading" id="modal-loading">
            <div class="spinner"></div>
            <p>Loading document...</p>
          </div>
          <iframe id="document-iframe" src="about:blank" title="Document Viewer" style="background:white"></iframe>
        </div>
        <div class="modal-actions">
          <button id="download-document">Download</button>
          <button id="modal-close-button">Close</button>
        </div>
      </div>
      
      <footer>
        &copy; ${new Date().getFullYear()} FIA Formula 1 Document Viewer - Unofficial PWA
      </footer>
    
      <script>
        // Cache data locally
        const documents = ${JSON.stringify(cache.data || [])};
        const eventMappings = ${JSON.stringify(config.eventMappings || {})};
        
        // DOM Elements
        const documentContainer = document.getElementById('document-container');
        const eventFilter = document.getElementById('event-filter');
        const searchInput = document.getElementById('search');
        const emptyState = document.getElementById('empty-state');
        
        // Modal Elements
        const modal = document.getElementById('document-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalClose = document.getElementById('modal-close');
        const modalCloseButton = document.getElementById('modal-close-button');
        const documentIframe = document.getElementById('document-iframe');
        const modalLoading = document.getElementById('modal-loading');
        const downloadButton = document.getElementById('download-document');
        
        // Install button
        const installButton = document.getElementById('install-button');
        
        // Filter documents by event and search term
        function filterDocuments() {
          const selectedEvent = eventFilter.value;
          const searchTerm = searchInput.value.toLowerCase();
          
          // Clear container
          documentContainer.innerHTML = '';
          
          // Filter documents
          let filteredDocs = documents.filter(doc => {
            // Check for missing properties that would make this document invalid
            if (!doc.title || !doc.href || !doc.eventName) return false;
            
            // Event filter
            if (selectedEvent !== 'all' && doc.eventId != selectedEvent) return false;
            
            // Search filter
            if (searchTerm && !doc.title.toLowerCase().includes(searchTerm) && 
                !doc.eventName.toLowerCase().includes(searchTerm)) {
              return false;
            }
            
            return true;
          });
          
          // Show empty state if no results
          if (filteredDocs.length === 0) {
            emptyState.style.display = 'block';
            return;
          } else {
            emptyState.style.display = 'none';
          }
          
          // Sort by published date (newest first)
          filteredDocs.sort((a, b) => {
            if (!a.published || !b.published) return 0;
            // Parse date like "01.06.25 19:22"
            const dateA = parsePublishedDate(a.published);
            const dateB = parsePublishedDate(b.published);
            return dateB - dateA;
          });
          
          // Create document cards
          filteredDocs.forEach((doc, index) => {
            const card = document.createElement('div');
            card.className = 'document-card';
            card.innerHTML = \`
              <div class="document-header">
                <span class="event-name">\${doc.eventName}</span>
                <span class="document-title" title="\${doc.title}">\${doc.title}</span>
              </div>
              <div class="document-body">
                <div class="document-date">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  \${doc.published || 'Date not available'}
                </div>
                <button class="document-view" data-index="\${index}">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Document
                </button>
              </div>
            \`;
            
            documentContainer.appendChild(card);
            
            // Add event listener to the button
            const viewButton = card.querySelector('.document-view');
            viewButton.addEventListener('click', () => openDocument(filteredDocs[index]));
          });
        }
        
        // Helper to parse the document's published date
        function parsePublishedDate(dateString) {
          if (!dateString) return new Date(0); // Invalid date
          
          // Format: "01.06.25 19:22" (DD.MM.YY HH:MM)
          const parts = dateString.split(' ');
          const dateParts = parts[0].split('.');
          const timeParts = parts[1].split(':');
          
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
          const year = 2000 + parseInt(dateParts[2], 10); // Assuming 20xx
          
          const hour = parseInt(timeParts[0], 10);
          const minute = parseInt(timeParts[1], 10);
          
          return new Date(year, month, day, hour, minute);
        }
        
        // Open document in the modal
        function openDocument(doc) {
          modalTitle.textContent = doc.title;
          modalLoading.style.display = 'flex';
          documentIframe.style.display = 'none';
          modal.style.display = 'flex';
          
          // Set iframe source
          documentIframe.src = 'https://docs.google.com/gview?url='+doc.href;
          //documentIframe.src = doc.href;
          
          // Update download button href
          downloadButton.onclick = () => {
            window.open(doc.href, '_blank');
          };
          
          // When iframe loads
          documentIframe.onload = () => {
            modalLoading.style.display = 'none';
            documentIframe.style.display = 'block';
          };
          
          // Disable scrolling of the background
          document.body.style.overflow = 'hidden';
        }
        
        // Close the modal
        function closeModal() {
          modal.style.display = 'none';
          documentIframe.src = '';
          // Re-enable scrolling
          document.body.style.overflow = 'auto';
        }
        
        // Event listeners
        eventFilter.addEventListener('change', filterDocuments);
        searchInput.addEventListener('input', filterDocuments);
        modalClose.addEventListener('click', closeModal);
        modalCloseButton.addEventListener('click', closeModal);
        
        // Initial load
        filterDocuments();
        
        // PWA Install
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
          // Prevent Chrome 67+ from automatically showing the prompt
          e.preventDefault();
          // Stash the event so it can be triggered later
          deferredPrompt = e;
          // Show the install button
          installButton.style.display = 'block';
        });
        
        installButton.addEventListener('click', (e) => {
          // Show the install prompt
          if (deferredPrompt) {
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                installButton.style.display = 'none';
              }
              deferredPrompt = null;
            });
          }
        });
        
        // Service worker registration for PWA
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').then(registration => {
              console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
              console.log('ServiceWorker registration failed: ', err);
            });
          });
        }
      </script>
    </body>
    </html>
    `;
  })
  .get("/manifest.json", () => {
    return {
      name: "FIA F1 Documents",
      short_name: "F1 Docs",
      description: "Official FIA Formula 1 documents viewer",
      start_url: "/",
      display: "standalone",
      background_color: "#15151E",
      theme_color: "#E10600",
      icons: [
        {
          src: "/assets/images/adaptive-icon.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/assets/images/adaptive-icon.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/assets/images/adaptive-icon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    };
  })
  .get("/service-worker.js", () => {
    return `
    const CACHE_NAME = 'fia-f1-documents-v1';
    const urlsToCache = [
      '/',
      '/manifest.json',
      '/assets/images/favicon.png',
      '/assets/images/fia-formula-logo.png',
      '/assets/images/fia-logo.png',
      '/assets/images/adaptive-icon.png',
      '/assets/fonts/FuturaCyrillicBold.ttf',
      '/assets/fonts/FuturaCyrillicBook.ttf',
      '/assets/fonts/FuturaCyrillicDemi.ttf',
      '/assets/fonts/FuturaCyrillicExtraBold.ttf',
      '/assets/fonts/FuturaCyrillicHeavy.ttf',
      '/assets/fonts/FuturaCyrillicLight.ttf',
      '/assets/fonts/FuturaCyrillicMedium.ttf'
    ];

    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            return cache.addAll(urlsToCache);
          })
      );
    });

    self.addEventListener('fetch', event => {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            // Cache hit - return response
            if (response) {
              return response;
            }
            return fetch(event.request).then(
              response => {
                // Check if we received a valid response
                if(!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }

                // IMPORTANT: Clone the response. A response is a stream
                // and can only be consumed once.
                var responseToCache = response.clone();

                caches.open(CACHE_NAME)
                  .then(cache => {
                    // Only cache same-origin requests
                    if (event.request.url.startsWith(self.location.origin)) {
                      cache.put(event.request, responseToCache);
                    }
                  });

                return response;
              }
            );
          })
      );
    });

    self.addEventListener('activate', event => {
      const cacheWhitelist = [CACHE_NAME];
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
    });
    `;
  });

export { app as pwaApp };
