import * as readlineSync from "readline-sync";
import { IApiConnector, IWorkDay, IWorkEntry } from "../types";
import {
  differenceInSeconds,
  setMinutes,
  setHours,
  isAfter,
  isSameDay
} from "date-fns";
import { JiraStore } from "./JiraStore";
import {
  JiraClient,
  IJiraLogInput,
  IJiraCredentials,
  IJiraWorklog
} from "./JiraClient";
import { getLastThursday } from "./util";

export class JiraApiConnector implements IApiConnector {
  private client: JiraClient;
  private store: JiraStore = new JiraStore();
  private credentials: IJiraCredentials;

  constructor(saveCredentials: boolean = false) {
    let host = this.store.getHost();
    if (!host) {
      host = JiraApiConnector.updateHost();
    }

    let credentials = this.store.getCredentials();
    if (!credentials) {
      credentials = JiraApiConnector.updateCredentials(saveCredentials);
    }

    this.credentials = credentials;
    this.client = new JiraClient(host, this.credentials);
  }

  // tslint:disable-next-line: member-ordering
  public static updateHost(): string {
    console.log("Please enter the host of your Jira instance \n");
    const host = readlineSync.question("Jira-Host: ");
    new JiraStore().setHost(host);
    return host;
  }

  // tslint:disable-next-line: member-ordering
  public static updateCredentials(saveCredentials: boolean): IJiraCredentials {
    console.log("Please enter you Jira credentials");
    console.log("");
    const username = readlineSync.question("Username: ");
    const password = readlineSync.question("Password: ", {
      hideEchoBack: true
    });

    const credentials = {
      username,
      password
    };

    if (saveCredentials) {
      console.log("Saving credentials");
      new JiraStore().setCredentials(credentials);
    }

    return credentials;
  }

  public async importLogs(days: IWorkDay[]) {
    console.log("Obtaining Cookie...");
    await this.client.obtainCookie();

    const preparedEntries = this.prepareEntries(days);

    const oldLogs = this.store.getExistingEntries();

    await this.createWorklogs(preparedEntries);
    await this.clearOldLogs(oldLogs, preparedEntries);
  }

  private prepareEntries(days: IWorkDay[]): IJiraLogInput[] {
    const thursday = getLastThursday();

    return days
      .filter(day => isAfter(day.date, thursday))
      .map(({ date, workEntries }) =>
        workEntries.map(entry => this.transformEntry(entry, date))
      )
      .reduce((arr, curr) => curr.concat(arr), []);
  }

  /**
   * Clears logs that were previously written and are part of the current batch
   * @param onDays
   */
  private async clearOldLogs(
    logs: IJiraWorklog[] | null,
    onDays: IJiraLogInput[]
  ) {
    const relevantLogs = logs?.filter(entry =>
      onDays.some(day => isSameDay(entry.date, day.dateStarted))
    );

    if (!relevantLogs || !relevantLogs.length) {
      console.log("No Logs to erase found");
      return;
    }

    console.log("Clearing old logs");
    await Promise.all(relevantLogs.map(log => this.client.deleteWorklog(log)));
  }

  private transformEntry = (entry: IWorkEntry, date: Date): IJiraLogInput => {
    const dateWithHours = setHours(date, entry.startTime.getHours());
    const dateWithMinutes = setMinutes(
      dateWithHours,
      entry.startTime.getMinutes()
    );

    return {
      comment: entry.description,
      issue: {
        key: entry.ticketId
      },
      author: {
        name: this.credentials.username
      },
      timeSpentSeconds: differenceInSeconds(entry.endTime, entry.startTime),
      dateStarted: dateWithMinutes
    };
  };

  private async createWorklogs(inputs: IJiraLogInput[]) {
    console.log("Creating Worklogs");

    const createdLogs = await Promise.all(
      inputs.map(log => this.client.createWorklog(log))
    );

    // Filter those that were not successful
    const logsWithIds = createdLogs.filter(log => !!log) as IJiraWorklog[];

    this.store.setExistingEntries(logsWithIds);
  }
}
