import { pwaApp } from "./pwa";

const pwaPort = process.env.PORT ?? 3001;

pwaApp.listen(pwaPort, () => {
  console.log(
    `🦊 Elysia PWA is running at ${pwaApp.server?.hostname}:${pwaApp.server?.port}`
  );
});
