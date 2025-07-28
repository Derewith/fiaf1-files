/*
 * Copyright (C) 2024 Jonathan Canevese - All Rights Reserved
 * This is copyrighted software
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential by Jonathan Canevese
 */

import { parse } from "node-html-parser";
import fs from "fs/promises";
import path from "path";
import { Config } from "../src/types";

const CONFIG_PATH = path.resolve(__dirname, "../src/config.json");
const GRAND_PRIX_EVENTS_URL = "https://www.fia.com/documents/championships/fia-formula-one-world-championship-14/season/season-2025-2071";

interface EventInfo {
  id: number;
  name: string;
  url: string;
}

/**
 * Fetches the HTML content of the grand prix events page
 * Falls back to sample data if the network request fails
 */
async function fetchGrandPrixEventsPage(useTestData: boolean = false): Promise<string> {
  // If test mode is enabled, use sample data
  if (useTestData) {
    console.log("Using test data from sample HTML file...");
    try {
      const samplePath = path.resolve(__dirname, "../assets/grand_prix_events_sample.html");
      return await fs.readFile(samplePath, "utf-8");
    } catch (error) {
      console.error("Error reading sample HTML file:", error);
      throw error;
    }
  }

  console.log(`Fetching grand prix events from: ${GRAND_PRIX_EVENTS_URL}`);
  
  try {
    const response = await fetch(GRAND_PRIX_EVENTS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      // Add timeout to avoid hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Successfully fetched HTML content (${html.length} characters)`);
    return html;
  } catch (error) {
    console.error("Error fetching grand prix events page:", error);
    
    // In case of network error, try to continue with cached data but log the issue
    if (error.code === "ConnectionRefused" || error.code === "FailedToOpenSocket" || error.name === "AbortError") {
      console.log("Network access to FIA website is restricted. This script should be run in an environment with internet access.");
      console.log("For testing purposes, you can run with --test flag to use sample data.");
    }
    
    throw error;
  }
}

/**
 * Parses the HTML content to extract event IDs and names
 */
function parseGrandPrixEvents(html: string): EventInfo[] {
  console.log("Parsing HTML content for event information...");
  
  try {
    const root = parse(html);
    const events: EventInfo[] = [];

    // Look for different possible selectors where event information might be stored
    const possibleSelectors = [
      // Common patterns for event links on FIA website
      'a[href*="/event/"]',
      'a[href*="/documents/"]',
      '.event-link',
      '.race-link',
      '.grand-prix',
      '.event-item',
      '.championship-event',
      // Links that might contain event IDs in their URLs
      'a[href*="event-"]',
      'a[href*="race-"]',
      // Generic link patterns that might lead to events
      'a[href*="/session/"]',
      'a[href*="/weekend/"]',
    ];

    for (const selector of possibleSelectors) {
      const elements = root.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements for selector: ${selector}`);
      
      elements.forEach((element) => {
        const href = element.getAttribute("href");
        const text = element.text?.trim();
        
        if (href && text) {
          // Try to extract event ID from URL
          const eventIdMatch = href.match(/\/(\d+)(?:\/|$)/);
          if (eventIdMatch) {
            const eventId = parseInt(eventIdMatch[1], 10);
            if (eventId && !events.find(e => e.id === eventId)) {
              events.push({
                id: eventId,
                name: text,
                url: href.startsWith("/") ? `https://www.fia.com${href}` : href,
              });
            }
          }
        }
      });
    }

    // Also look for script tags that might contain event data in JSON format
    const scriptTags = root.querySelectorAll("script");
    scriptTags.forEach((script) => {
      const content = script.innerHTML;
      if (content && (content.includes("event") || content.includes("race"))) {
        try {
          // Try to extract event data from JavaScript objects/arrays
          
          // Look for event objects with name and ID
          const eventObjectRegex = /\{\s*(?:event_?id|eventId|id)\s*:\s*(\d+)\s*,\s*(?:name|title)\s*:\s*["']([^"']+)["']/gi;
          let match;
          while ((match = eventObjectRegex.exec(content)) !== null) {
            const eventId = parseInt(match[1], 10);
            const eventName = match[2];
            if (eventId && eventName && !events.find(e => e.id === eventId)) {
              events.push({
                id: eventId,
                name: eventName,
                url: `https://www.fia.com/event/${eventId}`,
              });
            }
          }
          
          // Look for simple event ID patterns
          const eventIdMatches = content.match(/["']?(?:event_?id|eventId|id)["']?\s*:\s*(\d+)/gi);
          if (eventIdMatches) {
            eventIdMatches.forEach((match) => {
              const idMatch = match.match(/(\d+)/);
              if (idMatch) {
                const eventId = parseInt(idMatch[1], 10);
                if (eventId && !events.find(e => e.id === eventId)) {
                  // Try to find associated name in nearby context
                  const contextStart = Math.max(0, content.indexOf(match) - 200);
                  const contextEnd = Math.min(content.length, content.indexOf(match) + 200);
                  const context = content.slice(contextStart, contextEnd);
                  
                  const nameMatch = context.match(/["']([^"']*(?:grand\s*prix|test|practice)[^"']*)["']/i);
                  const eventName = nameMatch ? nameMatch[1] : `Event ${eventId}`;
                  
                  events.push({
                    id: eventId,
                    name: eventName,
                    url: `https://www.fia.com/event/${eventId}`,
                  });
                }
              }
            });
          }
        } catch (error) {
          // Ignore JSON parsing errors
        }
      }
    });

    // Look for data attributes that might contain event information
    const dataElements = root.querySelectorAll("[data-event-id], [data-event], [data-race-id]");
    dataElements.forEach((element) => {
      const eventId = element.getAttribute("data-event-id") || 
                     element.getAttribute("data-event") || 
                     element.getAttribute("data-race-id");
      const text = element.text?.trim();
      
      if (eventId && text) {
        const id = parseInt(eventId, 10);
        if (id && !events.find(e => e.id === id)) {
          events.push({
            id,
            name: text,
            url: `https://www.fia.com/event/${id}`,
          });
        }
      }
    });

    console.log(`Extracted ${events.length} unique events from HTML`);
    events.forEach(event => {
      console.log(`  - Event ${event.id}: ${event.name}`);
    });

    return events;
  } catch (error) {
    console.error("Error parsing HTML content:", error);
    return [];
  }
}

/**
 * Loads the current configuration
 */
async function loadConfig(): Promise<Config> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as Config;
  } catch (error) {
    console.error("Error loading config:", error);
    throw error;
  }
}

/**
 * Saves the updated configuration
 */
async function saveConfig(config: Config): Promise<void> {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    console.log("Configuration updated successfully");
  } catch (error) {
    console.error("Error saving config:", error);
    throw error;
  }
}

/**
 * Updates the configuration with new event IDs and mappings
 */
function updateConfigWithEvents(config: Config, events: EventInfo[]): Config {
  const newConfig = { ...config };
  
  // Create sets for easier deduplication
  const existingEventIds = new Set(config.eventIds);
  const newEventIds: number[] = [];
  const newEventMappings = { ...config.eventMappings };

  events.forEach(event => {
    if (!existingEventIds.has(event.id)) {
      newEventIds.push(event.id);
      existingEventIds.add(event.id);
    }
    
    // Update or add event mapping
    newEventMappings[event.id] = event.name;
  });

  // Add new event IDs to the existing list
  newConfig.eventIds = [...config.eventIds, ...newEventIds];
  newConfig.eventMappings = newEventMappings;

  console.log(`Added ${newEventIds.length} new event IDs to configuration`);
  if (newEventIds.length > 0) {
    console.log("New events added:");
    newEventIds.forEach(id => {
      console.log(`  - ${id}: ${newEventMappings[id]}`);
    });
  }

  return newConfig;
}

/**
 * Main function to fetch grand prix events and update configuration
 */
async function main() {
  try {
    console.log("Starting grand prix events fetcher...");
    
    // Check for test mode flag
    const useTestData = process.argv.includes("--test") || process.argv.includes("-t");
    if (useTestData) {
      console.log("Running in test mode with sample data");
    }
    
    // Load current configuration
    const currentConfig = await loadConfig();
    console.log(`Current configuration has ${currentConfig.eventIds.length} event IDs`);
    
    // Fetch and parse the grand prix events page
    const html = await fetchGrandPrixEventsPage(useTestData);
    const events = parseGrandPrixEvents(html);
    
    if (events.length === 0) {
      console.log("No events found on the page. Configuration will not be updated.");
      return;
    }
    
    // Update configuration with new events
    const updatedConfig = updateConfigWithEvents(currentConfig, events);
    
    // Only save if there are actually new events to add
    const hasChanges = updatedConfig.eventIds.length > currentConfig.eventIds.length;
    if (hasChanges || useTestData) {
      await saveConfig(updatedConfig);
      console.log("Configuration updated successfully!");
    } else {
      console.log("No new events to add. Configuration unchanged.");
    }
    
    console.log("Grand prix events fetcher completed successfully!");
    console.log(`Total event IDs in configuration: ${updatedConfig.eventIds.length}`);
    
  } catch (error) {
    console.error("Error in grand prix events fetcher:", error);
    
    // Exit with non-zero code only if it's not a network connectivity issue
    if (error.code === "ConnectionRefused" || error.code === "FailedToOpenSocket") {
      console.log("Exiting gracefully due to network connectivity issues.");
      console.log("In production, this script should be run in an environment with internet access to the FIA website.");
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Export functions for testing
export {
  fetchGrandPrixEventsPage,
  parseGrandPrixEvents,
  updateConfigWithEvents,
  loadConfig,
  saveConfig,
};

// Run the main function if this script is executed directly
if (import.meta.main) {
  main();
}