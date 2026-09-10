import { scrapeAndSave } from "../utils/scraper";

export async function onRequestGet(context) {
  await scrapeAndSave(context.env);
  return new Response(JSON.stringify({ status: "success" }), {
    headers: { "Content-Type": "application/json" }
  });
}