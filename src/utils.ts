/*
 * Copyright (C) 2024 Jonathan Canevese - All Rights Reserved
 * This is copyrighted software
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential by Jonathan Canevese
 */
import path from "path";
import fs from "fs/promises";
import { Config, DocItem, Cache } from "./types";
import { parse } from "node-html-parser";

const CONFIG_PATH = path.resolve(__dirname, "./config.json");
const CACHE_PATH = path.resolve(__dirname, "./cache.json");

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
    const { baseUrl, eventIds, eventMappings = {} } = await loadConfig();
    console.log(`Starting cache regeneration for ${eventIds.length} events...`);

    // Process events sequentially to avoid overloading the server
    const data: DocItem[] = [];
    for (const id of eventIds) {
      try {
        const items = await fetchDocsFor(id, baseUrl);
        console.log(`Retrieved ${items.length} documents for event ${id}`);

        // Process and add items to the final data array
        const processedItems = items.map((item) => ({
          ...item,
          href: item.href.startsWith("/")
            ? `${baseUrl}${item.href}`
            : `${baseUrl}/${item.href}`,
          eventName: eventMappings[item.eventId] || "Unknown Event",
        }));

        data.push(...processedItems);

        // Save incremental progress after each event
        if (data.length > 0) {
          await saveCache(data);
          console.log(`Intermediate cache saved with ${data.length} documents`);
        }

        // Add a small delay between requests to reduce server load
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

export { loadConfig, loadCache, regenerateCache };
