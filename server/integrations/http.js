import axios from "axios";
import { HttpError } from "../utils/workspaceAccess.js";

const messageFrom = (error) => {
  const data = error.response?.data;
  return (
    data?.error?.message ||
    (typeof data?.error === "string" ? data.error : null) ||
    data?.message ||
    data?.errorMessages?.[0] ||
    (data?.errors && Object.values(data.errors)[0]) ||
    (typeof data === "string" ? data.slice(0, 200) : null) ||
    error.message
  );
};

/**
 * Call a provider API. Network and provider failures become HttpErrors with a
 * readable message so controllers can pass them straight to the client.
 */
export const call = async (config) => {
  try {
    const response = await axios({ timeout: 20000, ...config });
    return response.data;
  } catch (error) {
    if (error.response) {
      // A 401/403 from the provider is "reconnect", not a PlanCrest auth failure
      const status = error.response.status === 401 || error.response.status === 403 ? 424 : error.response.status >= 500 ? 502 : 400;
      throw new HttpError(status, `${messageFrom(error)}`);
    }
    throw new HttpError(502, `Couldn't reach the service: ${error.message}`);
  }
};

export const bearer = (token, extra = {}) => ({ Authorization: `Bearer ${token}`, ...extra });
