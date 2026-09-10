import * as cheerio from 'cheerio';

const WIKI_API_URL =
  "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_ongoing_armed_conflicts&prop=text&formatversion=2&format=json";

const USER_AGENT = "ConflictTrackerBot/1.0 (https://crisis-tracker.pages.dev; contact@example.com)";

export async function scrapeAndSave(env) {
  const rawHtml = await fetchArticleHtml();
  const html = sanitizeParsoidArtifacts(rawHtml);
  const data = parseAllTables(html);

  if (data.length === 0) {
    console.error("No entries extracted. Check section headings or DOM structure.");
    return;
  }

  await env.DB.prepare("DELETE FROM all_conflicts").run();

  const stmts = data.map((item) =>
    env.DB
      .prepare(
        "INSERT INTO all_conflicts (category, name, location, cumulative_deaths) VALUES (?, ?, ?, ?)"
      )
      .bind(item.category, item.name, item.location, item.cumulative_deaths)
  );

  await env.DB.batch(stmts);
}

async function fetchArticleHtml() {
  const res = await fetch(WIKI_API_URL, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Wikipedia page: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const html = json?.parse?.text;

  if (!html) {
    throw new Error("Unexpected API response shape: missing parse.text");
  }

  return html;
}

function sanitizeParsoidArtifacts(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sdata-mw\s*=\s*"(?:[^"\\]|\\.)*"/g, "")
    .replace(/\sdata-mw\s*=\s*'(?:[^'\\]|\\.)*'/g, "")
    .replace(/\sdata-parsoid\s*=\s*"(?:[^"\\]|\\.)*"/g, "")
    .replace(/\sdata-parsoid\s*=\s*'(?:[^'\\]|\\.)*'/g, "");
}

function parseAllTables(html) {
  const $ = cheerio.load(html);
  const results = [];

  let currentSection = null;

  $("h2, h3, table.wikitable").each((_, element) => {
    const $element = $(element);

    // Heading
    if (element.tagName === "h2" || element.tagName === "h3") {
      const heading = $element
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      if (heading.includes("10,000")) {
        currentSection = "Major War";
      } else if (heading.includes("1,000")) {
        currentSection = "Minor War";
      } else if (heading.includes("999")) {
        currentSection = "Conflict";
      } else {
        // We've entered some other section.
        currentSection = null;
      }

      return;
    }

    // Table
    if (element.tagName === "table") {
      // Ignore every table that isn't under one of the
      // three recognized sections.
      if (!currentSection) return;

      $element.find("tr").each((_, row) => {
        const entry = parseRow($, row, currentSection);

        if (entry) {
          results.push(entry);
        }
      });
    }
  });

  return results;
}

function parseRow($, row, categoryLabel) {
  const cells = $(row).find("td, th");
  if (cells.length < 5) return null;

  const name = cleanCell($, cells[1]);
  const location = cleanLocation($, cells[3]);
  const cumulative_deaths = cleanCell($, cells[4]);

  if (!name || !location || !cumulative_deaths) return null;
  if (["conflict", "war", "main conflict"].includes(name.toLowerCase())) return null;

  return { category: categoryLabel, name, location, cumulative_deaths };
}

function cleanCell($, cell) {
  const $cell = $(cell).clone();

  $cell.find("style, script, sup, .reference, .mw-ref, [data-mw]").remove();

  const $main = $cell.find(".treelist > ul > li").first();

  if ($main.length) {
    $main.children("ul, ol, dl").remove();

    return $main
      .text()
      .replace(/\s+/g, " ")
      .trim();
  }

  return $cell
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLocation($, cell) {
  const $cell = $(cell).clone();

  $cell.find("style, script, sup, .reference, .mw-ref, [data-mw]").remove();

  const $tree = $cell.find(".treelist").first();

  if ($tree.length) {
    const locations = [];

    $tree.find("> ul > li").each((_, li) => {
      const $li = $(li).clone();

      // Remove nested location lists
      $li.find("ul, ol, dl").remove();

      const text = $li
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (text) locations.push(text);
    });

    return locations.join(", ");
  }

  return $cell
    .text()
    .replace(/\s+/g, " ")
    .trim();
}