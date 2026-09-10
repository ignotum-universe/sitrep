import { scrapeAndSave } from "./utils/scraper";

export async function onScheduled(event, env, ctx) {
  ctx.waitUntil(scrapeAndSave(env));
}