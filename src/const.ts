import * as path from "path";

export const APP_NAME = "juli";
export const WORKLOGS_FILE = "worklogs.json";
export const CREDENTIALS_FILE = "credentials.json";

export const CREATE_PATH = (fileName: string) => {
  // Win
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, APP_NAME, fileName);
  }
  // Unix
  else if (process.env.HOME) {
    return path.join(process.env.HOME, `.${APP_NAME}`, fileName);
  } else {
    console.warn("You don't have a supported OS");
    return path.join(__filename, "../config", APP_NAME, fileName);
  }
};
