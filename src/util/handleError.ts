import { Logger } from "./Logger";

export const handleError = (
  error: any,
  message?: string,
  level: "error" | "warning" = "error"
) => {
  if (level === "error") {
    Logger.error(message || error.message || "Unexpected Error");
  } else {
    Logger.warn(message || error.message || "Unexpected Error");
  }
};
