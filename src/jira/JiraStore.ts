import { IJiraCredentials } from "./JiraClient";
import { readFileSync, writeFileSync } from "fs";
import { IStore, IWorklogEntry } from "../types";
import { CREATE_PATH, CREDENTIALS_FILE, WORKLOGS_FILE } from "../const";

/**
 * TODO: Handle unauthorized errors?
 */
export class JiraStore implements IStore<IJiraCredentials> {
  public getCredentials(): IJiraCredentials | null {
    try {
      const file = readFileSync(CREATE_PATH(CREDENTIALS_FILE), "UTF-8");
      return JSON.parse(file);
    } catch (e) {
      return null;
    }
  }

  public setCredentials(credentials: IJiraCredentials) {
    writeFileSync(CREATE_PATH(CREDENTIALS_FILE), JSON.stringify(credentials));
  }

  public getExistingEntries(): IWorklogEntry[] | null {
    try {
      const file = readFileSync(CREATE_PATH(WORKLOGS_FILE), "UTF-8");
      return JSON.parse(file);
    } catch (e) {
      return null;
    }
  }

  public setExistingEntries(entries: IWorklogEntry[]) {
    writeFileSync(CREATE_PATH(WORKLOGS_FILE), JSON.stringify(entries));
  }
}
