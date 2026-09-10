import { onRequestGet as __api_conflicts_js_onRequestGet } from "C:\\Users\\kaiji\\OneDrive\\Documents\\VSCode projects\\crisis-tracker\\functions\\api\\conflicts.js"
import { onRequestGet as __api_scrape_now_js_onRequestGet } from "C:\\Users\\kaiji\\OneDrive\\Documents\\VSCode projects\\crisis-tracker\\functions\\api\\scrape-now.js"

export const routes = [
    {
      routePath: "/api/conflicts",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_conflicts_js_onRequestGet],
    },
  {
      routePath: "/api/scrape-now",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_scrape_now_js_onRequestGet],
    },
  ]