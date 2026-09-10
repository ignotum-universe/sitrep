export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare(
    "SELECT category, name, location, cumulative_deaths FROM all_conflicts"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}