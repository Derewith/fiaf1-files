/*
 * Copyright (C) 2024 Jonathan Canevese - All Rights Reserved
 * This is copyrighted software
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential by Jonathan Canevese
 */

interface DocItem {
  eventId: number;
  href: string;
  originalHref?: string; // Original FIA URL before downloading
  title: string;
  published: string;
  eventName?: string;
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

export type { DocItem, Config, Cache };
