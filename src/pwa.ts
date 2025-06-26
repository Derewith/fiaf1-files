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
      <!-- PDF.js library -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
      <script>
        // Define the PDF.js worker source
        window.pdfjsLib = window.pdfjsLib || {};
        window.pdfjsLib.GlobalWorkerOptions = window.pdfjsLib.GlobalWorkerOptions || {};
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      </script>
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
        
        /* PDF Viewer Styles */
        .pdf-container {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          background-color: #333;
          overflow: auto;
          position: relative;
        }
        
        #pdf-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px;
          background-color: rgba(0,0,0,0.7);
          position: sticky;
          top: 0;
          z-index: 5;
          gap: 10px;
        }
        
        .pdf-control-btn {
          background-color: var(--f1-dark);
          color: white;
          border: 1px solid var(--f1-gray);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          cursor: pointer;
          font-family: 'Futura', sans-serif;
          font-weight: 300;
          font-size: 14px;
        }
        
        .pdf-control-btn svg {
          margin: 0 5px;
        }
        
        .pdf-control-btn:hover {
          background-color: var(--f1-red);
          border-color: white;
        }
        
        #page-info {
          color: white;
          margin: 0 15px;
          font-size: 14px;
        }
        
        #pdf-canvas {
          margin: 0 auto;
          display: block;
          background-color: white;
        }
        
        /* Hide the PDF viewer by default */
        #pdf-viewer {
          display: none;
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
          <div id="pdf-viewer" class="pdf-container">
            <div id="pdf-controls">
              <button id="prev-page" class="pdf-control-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <span id="page-info">Page <span id="page-num">0</span> / <span id="page-count">0</span></span>
              <button id="next-page" class="pdf-control-btn">
                Next
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button id="zoom-in" class="pdf-control-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              <button id="zoom-out" class="pdf-control-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
            </div>
            <canvas id="pdf-canvas"></canvas>
          </div>
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
        const pdfCanvas = document.getElementById('pdf-canvas');
        const modalLoading = document.getElementById('modal-loading');
        const downloadButton = document.getElementById('download-document');
        const prevPageButton = document.getElementById('prev-page');
        const nextPageButton = document.getElementById('next-page');
        const zoomInButton = document.getElementById('zoom-in');
        const zoomOutButton = document.getElementById('zoom-out');
        const pageNumSpan = document.getElementById('page-num');
        const pageCountSpan = document.getElementById('page-count');
        var pdfDoc = null; // Global PDF document variable
        
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
          document.getElementById('pdf-viewer').style.display = 'none';
          modal.style.display = 'flex';
          
          // Reset current document and page
          if (pdfDoc) {
            pdfDoc = null;
            currentPage = 1;
            document.getElementById('page-num').textContent = "1";
            document.getElementById('page-count').textContent = "0";
          }
          
          // The direct PDF URL
          const pdfUrl = doc.href;
          
          // Create a proxy URL to avoid CORS issues
          // Using pdf.js directly with the original PDF URL
          pdfjsLib.getDocument(pdfUrl).promise
            .then(function(pdf) {
              pdfDoc = pdf;
              document.getElementById('page-count').textContent = pdf.numPages;
              
              // Initial render of the PDF
              renderPage(currentPage);
              
              // Show PDF viewer and hide loading spinner
              document.getElementById('pdf-viewer').style.display = 'flex';
              modalLoading.style.display = 'none';
            })
            .catch(function(error) {
              console.error('Error loading PDF:', error);
              modalLoading.style.display = 'none';
              alert('Could not load the PDF. You can try the download option instead.');
              // Fallback to download
              window.open(doc.href, '_blank');
            });
          
          // Update download button onclick
          downloadButton.onclick = () => {
            window.open(doc.href, '_blank');
          };
          
          // Disable scrolling of the background
          document.body.style.overflow = 'hidden';
        }
        
        // Render a specific page of the PDF
        function renderPage(pageNumber) {
          // Ensure pdfDoc is available
          if (!pdfDoc) return;
          
          pdfDoc.getPage(pageNumber).then(function(page) {
            const viewport = page.getViewport({ scale: scale });
            
            // Prepare canvas
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;
            
            // Render PDF page
            const renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };
            
            page.render(renderContext).promise.then(function() {
              document.getElementById('page-num').textContent = pageNumber;
              currentPage = pageNumber;
              
              // Enable/disable navigation buttons
              prevPageButton.disabled = currentPage <= 1;
              nextPageButton.disabled = currentPage >= pdfDoc.numPages;
            });
          });
        }
        
        // Go to previous page
        function goPreviousPage() {
          if (currentPage <= 1) return;
          currentPage--;
          renderPage(currentPage);
        }
        
        // Go to next page
        function goNextPage() {
          if (currentPage >= pdfDoc.numPages) return;
          currentPage++;
          renderPage(currentPage);
        }
        
        // Zoom functions
        function zoomIn() {
          scale += 0.25;
          renderPage(currentPage);
        }
        
        function zoomOut() {
          if (scale > 0.5) {
            scale -= 0.25;
            renderPage(currentPage);
          }
        }
        
        // Close the modal
        function closeModal() {
          modal.style.display = 'none';
          // Re-enable scrolling
          document.body.style.overflow = 'auto';
        }
        
        // Event listeners
        eventFilter.addEventListener('change', filterDocuments);
        searchInput.addEventListener('input', filterDocuments);
        modalClose.addEventListener('click', closeModal);
        modalCloseButton.addEventListener('click', closeModal);
        
        // PDF navigation event listeners
        prevPageButton.addEventListener('click', goPreviousPage);
        nextPageButton.addEventListener('click', goNextPage);
        zoomInButton.addEventListener('click', zoomIn);
        zoomOutButton.addEventListener('click', zoomOut);
        
        // PDF.js global variable
        window.pdfjsLib = window.pdfjsLib || {};
        
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
    const CACHE_NAME = 'fia-f1-documents-v2';
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
      '/assets/fonts/FuturaCyrillicMedium.ttf',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
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
  })
  .get("/health", () => {
    return {
      status: "ok",
      message: "FIA F1 Documents PWA is running smoothly.",
    };
  });
export { app as pwaApp };
