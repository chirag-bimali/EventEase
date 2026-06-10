import axios from "axios";

export function getApiErrorMessage(
  err: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { message?: string };
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  if (err instanceof Error && err.message && !err.message.startsWith("Request failed with status code")) {
    return err.message;
  }

  return fallback;
}
