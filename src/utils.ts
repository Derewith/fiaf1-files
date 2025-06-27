/*
 * Copyright (C) 2024 Jonathan Canevese - All Rights Reserved
 * This is copyrighted software
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential by Jonathan Canevese
 */
import path from "path";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Config, DocItem, Cache } from "./types";
import { parse } from "node-html-parser";
import crypto from "crypto";

const CONFIG_PATH = path.resolve(__dirname, "./config.json");
const CACHE_PATH = path.resolve(__dirname, "./cache.json");
const DOCUMENTS_DIR = path.resolve(__dirname, "../public/documents");

// Ensure documents directory exists
async function ensureDocumentsDir() {
  try {
    await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating documents directory:", error);
  }
}

// Generate a safe filename from a URL
function getSafeFilenameFromUrl(url: string): string {
  // Extract filename from URL or create a hash if no filename is found
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  let filename = path.basename(pathname);

  // If no proper filename or it doesn't end with .pdf, create a hash-based filename
  if (!filename || !filename.toLowerCase().endsWith(".pdf")) {
    const hash = crypto.createHash("md5").update(url).digest("hex");
    filename = `document-${hash}.pdf`;
  }

  // Make filename safe for filesystem
  return filename.replace(/[^a-z0-9.-]/gi, "_");
}

// Download a single PDF and return the local path
async function downloadPdf(url: string): Promise<string | null> {
  const safeFilename = getSafeFilenameFromUrl(url);
  const outputPath = path.join(DOCUMENTS_DIR, safeFilename);

  // Check if file already exists (to avoid redownloading)
  try {
    await fs.access(outputPath);
    console.log(`File already exists: ${safeFilename}`);
    return `/documents/${safeFilename}`;
  } catch (error) {
    // File doesn't exist, proceed with download
  }

  console.log(`Downloading PDF: ${url} -> ${safeFilename}`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Check if the response is actually a PDF
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("pdf")) {
      console.warn(
        `Warning: Content may not be a PDF. Content-Type: ${contentType}`
      );
    }

    // Write the file
    const fileStream = createWriteStream(outputPath);
    await pipeline(response.body!, fileStream);

    return `/documents/${safeFilename}`;
  } catch (error) {
    console.error(`Error downloading PDF ${url}:`, error);
    return null;
  }
}

const CACHE_EXPIRATION_MS = 1000 * 60 * 60; // 1 hour

async function loadConfig(): Promise<Config> {
  const raw = await fs.readFile(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as Config;
}

async function loadCache(): Promise<Cache | null> {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveCache(data: DocItem[]): Promise<void> {
  const payload = {
    timestamp: new Date().toISOString(),
    data,
  };
  await fs.writeFile(CACHE_PATH, JSON.stringify(payload, null, 2), "utf-8");
}

async function fetchDocsFor(
  eventId: number,
  baseUrl: string
): Promise<DocItem[]> {
  console.log(`Fetching documents for event ${eventId}...`);
  try {
    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const resp = await fetch(
      `${baseUrl}/decision-document-list/ajax/${eventId}`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const payload = (await resp.json()) as any[];

    const cmd = payload.find(
      (entry) =>
        entry.command === "insert" && /document-type-wrapper/.test(entry.data)
    );
    if (!cmd || typeof cmd.data !== "string") return [];

    const root = parse(cmd.data);
    return root
      .querySelectorAll("li.document-row")
      .map((li) => {
        const a = li.querySelector("a");
        if (!a) return null;

        const href = a.getAttribute("href");
        const titleEl = a.querySelector(".title");
        const publishedEl = a.querySelector(".published .date-display-single");
        if (!href || !titleEl || !publishedEl) return null;

        return {
          eventId,
          href,
          title: titleEl.text.trim(),
          published: publishedEl.text.trim(),
        };
      })
      .filter((item): item is DocItem => item !== null);
  } catch (error) {
    // if (error.name === "AbortError") {
    //   console.error(`Timeout while fetching documents for event ${eventId}`);
    // } else {
    console.error(`Error fetching documents for event ${eventId}:`, error);
    // }
    return [];
  }
}

async function regenerateCache() {
  try {
    // Make sure documents directory exists
    await ensureDocumentsDir();
    
    const { baseUrl, eventIds, eventMappings = {} } = await loadConfig();
    console.log(`Starting cache regeneration for ${eventIds.length} events...`);

    // Process events sequentially to avoid overloading the server
    const data: DocItem[] = [];
    for (const id of eventIds) {
      try {
        const items = await fetchDocsFor(id, baseUrl);
        console.log(`Retrieved ${items.length} documents for event ${id}`);

        // Process and add items to the final data array
        const processedItems = [];
        
        for (const item of items) {
          // Create the original URL for the document
          const originalUrl = item.href.startsWith("/")
            ? `${baseUrl}${item.href}`
            : `${baseUrl}/${item.href}`;
            
          console.log(`Processing document: ${originalUrl}`);
          
          // Download the PDF and get the local path
          const localPath = await downloadPdf(originalUrl);
          
          // Add to processed items with both original URL and local path
          processedItems.push({
            ...item,
            originalHref: originalUrl, // Keep the original URL for reference
            href: localPath || originalUrl, // Use local path if download was successful, otherwise use original URL
            eventName: eventMappings[item.eventId] || "Unknown Event",
          });
          
          // Add a small delay between downloads to reduce load
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        data.push(...processedItems);

        // Save incremental progress after each event
        if (data.length > 0) {
          await saveCache(data);
          console.log(`Intermediate cache saved with ${data.length} documents`);
        }

        // Add a small delay between events to reduce server load
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to process event ${id}:`, error);
      }
    }

    if (data.length === 0) {
      console.warn("No documents found during cache regeneration");
    } else {
      console.log(`Successfully fetched ${data.length} documents total`);
    }

    await saveCache(data);
    console.log(`Cache saved at ${new Date().toISOString()}`);
    return data;
  } catch (error) {
    console.error("Error regenerating cache:", error);
    // Try to load existing cache as fallback
    const existingCache = await loadCache();
    return existingCache?.data || [];
  }
}

export { loadConfig, loadCache, regenerateCache, downloadPdf, ensureDocumentsDir };
