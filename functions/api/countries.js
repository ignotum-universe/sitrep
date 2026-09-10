export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const assetUrl = `${url.origin}/countries.geojson`;
 
  const res = await fetch(assetUrl, context.request);
  if (!res.ok) {
    return new Response(JSON.stringify({ error: "countries.geojson not found" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
 
  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=86400, s-maxage=604800",
    },
  });
}