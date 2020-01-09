import * as readlineSync from "readline-sync";
import {
  differenceInSeconds,
  setMinutes,
  setHours,
  isAfter,
  isSameDay
} from "date-fns";
import { IApiConnector, IWorkDay, IWorkEntry } from "../types";
import { JiraStore } from "./JiraStore";
import {
  JiraClient,
  IJiraLogInput,
  IJiraCredentials,
  IJiraWorklog,
  IJiraAlias
} from "./JiraClient";
import { getLastThursday, executeTasks } from "./util";
import { Logger } from "../util/Logger";
import { InvalidArgumentError } from "../errors/InvalidArgumentError";

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
  public static async updateAlias(alias: string): Promise<IJiraAlias> {
    const [rawName = "", rawIssueId = ""] = alias.split("=");
    const name = rawName.trim();
    const issueId = rawIssueId.trim();

    if (!name) {
      throw new InvalidArgumentError(
        `${alias} does not match <name>=<issueId>`
      );
    }

    const store = new JiraStore();
    const aliases: IJiraAlias = (await store.getIssueAliases()) || {};

    if (!issueId) {
      const { [name]: _, ...remainingAliases } = aliases;
      await store.setIssueAliases(remainingAliases);
      return remainingAliases;
    }

    const updatedAliases = { ...aliases, [name]: issueId };
    await store.setIssueAliases(updatedAliases);
    return updatedAliases;
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
      Logger.info("Saving credentials");
      new JiraStore().setCredentials(credentials);
    }

    return credentials;
  }

  public async importLogs(days: IWorkDay[]) {
    Logger.withStep("Obtaining Cookie...", 1, 3);
    await this.client.obtainCookie();

    const issueAliases = this.store.getIssueAliases();
    const preparedEntries = this.prepareEntries(days, issueAliases);
    console.log(JSON.stringify(preparedEntries, null, 2));
    const oldEntries = this.store.getExistingEntries();

    await this.createWorklogs(preparedEntries);
    await this.clearOldEntries(oldEntries, preparedEntries);
  }

  private prepareEntries(
    days: IWorkDay[],
    issueAliases?: IJiraAlias | null
  ): IJiraLogInput[] {
    const thursday = getLastThursday();

    return days
      .filter(
        day => isSameDay(day.date, thursday) || isAfter(day.date, thursday)
      )
      .map(({ date, workEntries }) =>
        workEntries.map(entry => this.transformEntry(entry, date, issueAliases))
      )
      .reduce((arr, curr) => curr.concat(arr), []);
  }

  private resolveAlias = (
    idOrName: string,
    aliases: IJiraAlias | null = null
  ) => {
    const alias = aliases?.[idOrName];
    return alias || idOrName;
  };

  private transformEntry = (
    entry: IWorkEntry,
    date: Date,
    issueAliases?: IJiraAlias | null
  ): IJiraLogInput => {
    const dateWithHours = setHours(date, entry.startTime.getHours());
    const dateWithMinutes = setMinutes(
      dateWithHours,
      entry.startTime.getMinutes()
    );

    return {
      comment: entry.description,
      issue: {
        key: this.resolveAlias(entry.ticketId, issueAliases)
      },
      author: {
        name: this.credentials.username
      },
      timeSpentSeconds: differenceInSeconds(entry.endTime, entry.startTime),
      dateStarted: dateWithMinutes
    };
  };

  private async createWorklogs(inputs: IJiraLogInput[]) {
    Logger.withStep("Creating Worklogs...", 2, 3);

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

    Logger.withStep("Clearing old logs...", 3, 3);

    if (!relevantLogs || !relevantLogs.length) {
      Logger.info("No Logs to erase found");
      return;
    }

    await executeTasks(
      relevantLogs.map(log => () => this.client.deleteWorklog(log))
    );
  }
}
