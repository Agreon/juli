import * as fs from "fs-extra";
import * as path from "path";
import { IJiraCredentials, IJiraWorklog } from "./JiraClient";
import { IStore } from "../types";
import { CREATE_PATH } from "../const";

const HOST_FILE = path.join("jira", "host.json");
const CREDENTIALS_FILE = path.join("jira", "credentials.json");
const WORKLOGS_FILE = path.join("jira", "worklogs.json");

export class JiraStore implements IStore<IJiraCredentials, IJiraWorklog> {
  public getHost(): string | null {
    try {
      return fs.readFileSync(CREATE_PATH(HOST_FILE), "UTF-8");
    } catch (e) {
      return null;
    }
  }

  public setHost(host: string): void {
    fs.outputFileSync(CREATE_PATH(HOST_FILE), host);
  }

  public getCredentials(): IJiraCredentials | null {
    return fs.readJsonSync(CREATE_PATH(CREDENTIALS_FILE), {
      encoding: "UTF-8",
      throws: false
    });
  }

  public setCredentials(credentials: IJiraCredentials) {
    fs.outputJsonSync(CREATE_PATH(CREDENTIALS_FILE), credentials);
  }

  public getExistingEntries(): IJiraWorklog[] | null {
    return fs
      .readJsonSync(CREATE_PATH(WORKLOGS_FILE), {
        encoding: "UTF-8",
        throws: false
      })
      .map((entry: any) => ({
        id: entry.id,
        issueId: entry.issueId,
        date: new Date(entry.date)
      }));
  }

  public setExistingEntries(entries: IJiraWorklog[]) {
    fs.outputJsonSync(CREATE_PATH(WORKLOGS_FILE), entries);
  }
}
