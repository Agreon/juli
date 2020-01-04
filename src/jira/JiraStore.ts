import * as fs from "fs-extra";
import * as path from "path";
import { IJiraCredentials } from "./JiraClient";
import { IStore, IWorklogEntry } from "../types";
import { CREATE_PATH } from "../const";

const WORKLOGS_FILE = path.join("jira", "worklogs.json");
const CREDENTIALS_FILE = path.join("jira", "credentials.json");

/**
 * TODO: Handle unauthorized errors?
 */
export class JiraStore implements IStore<IJiraCredentials> {
  public getCredentials(): IJiraCredentials | null {
    return fs.readJsonSync(CREATE_PATH(CREDENTIALS_FILE), {
      encoding: "UTF-8",
      throws: false
    });
  }

  public setCredentials(credentials: IJiraCredentials) {
    fs.outputJsonSync(CREATE_PATH(CREDENTIALS_FILE), credentials);
  }

  public getExistingEntries(): IWorklogEntry[] | null {
    return fs.readJsonSync(CREATE_PATH(WORKLOGS_FILE), {
      encoding: "UTF-8",
      throws: false
    });
  }

  public setExistingEntries(entries: IWorklogEntry[]) {
    fs.outputJsonSync(CREATE_PATH(WORKLOGS_FILE), entries);
  }
}
