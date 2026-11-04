/** Base URL of the PlanCrest API. Set VITE_API_URL in client/.env for deployments. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(
  /\/$/,
  ""
);
