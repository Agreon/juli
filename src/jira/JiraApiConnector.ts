import * as readlineSync from "readline-sync";
import {
  differenceInSeconds,
  setMinutes,
  setHours,
  isAfter,
  isSameDay,
} from "date-fns";
import { IApiConnector, IWorkDay, IWorkEntry } from "../types";
import { JiraStore } from "./JiraStore";
import {
  JiraClient,
  IJiraLogInput,
  IJiraCredentials,
  IJiraWorklog,
} from "./JiraClient";
import { executeTasks } from "./util";
import { Logger } from "../util/Logger";

export class JiraApiConnector implements IApiConnector {
  private client: JiraClient;
  private store: JiraStore = new JiraStore();
  private credentials: IJiraCredentials;

  constructor(
    saveCredentials: boolean = false,
    private syncAll: boolean = false
  ) {
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

  public static updateHost(): string {
    console.log("Please enter the host of your Jira instance \n");
    const host = readlineSync.question("Jira-Host: ");
    new JiraStore().setHost(host);
    return host;
  }

  public static updateCredentials(saveCredentials: boolean): IJiraCredentials {
    console.log("Please enter you Jira credentials");
    console.log("");
    const username = readlineSync.question("Username: ");
    const password = readlineSync.question("Password: ", {
      hideEchoBack: true,
    });

    const credentials = {
      username,
      password,
    };

    if (saveCredentials) {
      Logger.info("Saving credentials");
      new JiraStore().setCredentials(credentials);
    }

    return credentials;
  }

  public async importLogs(days: IWorkDay[]) {
    Logger.withStep("Obtaining Cookie...", 1, 4);
    await this.client.obtainCookie();

    const preparedEntries = await this.prepareEntries(days);
    const oldEntries = this.store.getExistingEntries();

    await this.createWorklogs(preparedEntries);
    await this.clearOldEntries(oldEntries, preparedEntries);
  }

  private async prepareEntries(days: IWorkDay[]): Promise<IJiraLogInput[]> {
    Logger.withStep("Fetching relevant date range...", 2, 4);
    const startDate = this.syncAll
      ? null
      : await this.client.getStartDateOfCurrentApprovalPeriod();

    return days
      .filter(
        day =>
          this.syncAll ||
          isSameDay(day.date, startDate!) ||
          isAfter(day.date, startDate!)
      )
      .map(({ date, workEntries }) =>
        workEntries.map(entry => this.transformEntry(entry, date))
      )
      .reduce((arr, curr) => curr.concat(arr), []);
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
        key: entry.ticketId,
      },
      author: {
        name: this.credentials.username,
      },
      timeSpentSeconds: differenceInSeconds(entry.endTime, entry.startTime),
      dateStarted: dateWithMinutes,
    };
  };

  private async createWorklogs(inputs: IJiraLogInput[]) {
    Logger.withStep("Creating Worklogs...", 3, 4);

    const createdLogs = await executeTasks(
      inputs.map(log => () => this.client.createWorklog(log))
    );

    // Filter those that were not successful
    const logsWithIds = createdLogs.filter(log => !!log) as IJiraWorklog[];

    this.store.setExistingEntries(logsWithIds);
  }

  /**
   * Clears logs that were previously written and are part of the current batch
   * @param logs
   * @param onDays
   */
  private async clearOldEntries(
    logs: IJiraWorklog[] | null,
    onDays: IJiraLogInput[]
  ) {
    const relevantLogs = logs?.filter(entry =>
      onDays.some(day => isSameDay(entry.date, day.dateStarted))
    );

    Logger.withStep("Clearing old logs...", 4, 4);

    if (!relevantLogs || !relevantLogs.length) {
      Logger.info("No Logs to erase found");
      return;
    }

    await executeTasks(
      relevantLogs.map(log => () => this.client.deleteWorklog(log))
    );
  }
}
