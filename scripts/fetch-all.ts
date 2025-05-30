/*
 * Copyright (C) 2024 Jonathan Canevese - All Rights Reserved
 * This is copyrighted software
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential by Jonathan Canevese
 */

import { regenerateCache } from "../src/index";

async function main() {
  try {
    console.log("Starting cache regeneration...");
    const data = await regenerateCache();
    console.log(
      `Cache regenerated successfully: ${data.length} documents saved.`
    );
    process.exit(0);
  } catch (error) {
    console.error("Error during cache regeneration:", error);
    process.exit(1);
  }
}

main();
