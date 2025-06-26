import { Elysia } from "elysia";

import { loadCache, loadConfig, regenerateCache } from "./utils";

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

app.get("/events", async () => {
  const config = await loadConfig();
  return config.eventMappings || {};
});

// Endpoint interno per rigenerare la cache (protetto con segreto env)
app.post("/admin/regen", async ({ headers }) => {
  if (headers["x-cache-token"] !== process.env.CACHE_TOKEN) {
    return { error: "Forbidden", status: 403 };
  }
  const data = await regenerateCache();
  return { status: 200, regenerated: data.length };
});

app.get("/", () => {
  return `<h1>FIA F1 Files API</h1>
          <p>Use /documents</code> to get cached documents.</p>
          <p>Use /events</code> to get event mappings.</p>
          `;
});

app.get("/health", () => {
    return {
      status: "ok",
      message: "FIA F1 Documents PWA is running smoothly.",
    };
  });

app.listen(process.env.PORT ?? 3000, () => {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
});

export { regenerateCache };
