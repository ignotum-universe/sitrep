CREATE TABLE IF NOT EXISTS all_conflicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    cumulative_deaths TEXT NOT NULL,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
);