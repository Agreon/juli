import { GlobalConfigManager } from "../util/GlobalConfigManager";
import { IJiraCredentials } from "./JiraClient";

interface IWorklogEntry {
  id: string;
  date: Date;
}

const APP_NAME = "juli";
const WORKLOGS_FILE = "worklogs.json";
const CREDENTIALS_FILE = "credentials.json";

/**
 * TODO: Handle unauthorized errors?
 */
export class JiraStore {
  public static getCredentials(): IJiraCredentials | null {
    try {
      return GlobalConfigManager.getSync(APP_NAME, CREDENTIALS_FILE);
    } catch (e) {
      return null;
    }
  }

  public static setCredentials(credentials: IJiraCredentials) {
    return GlobalConfigManager.setSync(APP_NAME, CREDENTIALS_FILE, credentials);
  }

  public static getExistingEntries(): IWorklogEntry[] | null {
    try {
      return GlobalConfigManager.getSync(APP_NAME, WORKLOGS_FILE);
    } catch (e) {
      return null;
    }
  }

  public static setExistingEntries(entries: IWorklogEntry[]) {
    return GlobalConfigManager.setSync(APP_NAME, WORKLOGS_FILE, entries);
  }
}
