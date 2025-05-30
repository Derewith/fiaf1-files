import { Elysia } from "elysia";

import { parse } from "node-html-parser";
import fs from "fs/promises";
import path from "path";

interface DocItem {
  eventId: number;
  href: string;
  title: string;
  published: string;
}

interface Config {
  baseUrl: string;
  eventIds: number[];
  eventMappings?: Record<number, string>;
}

interface Cache {
  timestamp: string;
  data: DocItem[];
}

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
  const resp = await fetch(`${baseUrl}/decision-document-list/ajax/${eventId}`);
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
}

async function regenerateCache() {
  const { baseUrl, eventIds, eventMappings } = await loadConfig();
  const results = await Promise.all(
    eventIds.map((id) => fetchDocsFor(id, baseUrl).catch(() => []))
  );
  const data = results.flat().map((item) => ({
    ...item,
    href: `${baseUrl}${item.href}`,
    eventName: eventMappings![item.eventId] || "Unknown Event",
  }));
  await saveCache(data);
  return data;
}

const app = new Elysia();

app.get("/documents", async () => {
  // Carica cache
  const cache = await loadCache();
  if (cache) {
    return {
      timestamp: cache.timestamp,
      data: cache.data,
    };
  }
  // Se non c'è cache, rigenera al volo
  const data = await regenerateCache();
  return {
    timestamp: new Date().toISOString(),
    data,
  };
});

// Endpoint interno per rigenerare la cache (protetto con segreto env)
app.post("/admin/regen", async ({ headers }) => {
  if (headers["x-cache-token"] !== process.env.CACHE_TOKEN) {
    return { error: "Forbidden", status: 403 };
  }
  const data = await regenerateCache();
  return { status: 200, regenerated: data.length };
});

app.listen(3000, () => {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
});

export { regenerateCache };
