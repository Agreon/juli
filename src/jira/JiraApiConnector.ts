import * as readlineSync from "readline-sync";
import { IApiConnector, IWorkDay, IWorkEntry } from "../types";
import { differenceInSeconds, setMinutes, setHours } from "date-fns";
import { JiraStore } from "./JiraStore";
import { JiraClient, IJiraLogInput, IJiraCredentials } from "./JiraClient";

export class JiraApiConnector implements IApiConnector {
  private client: JiraClient = new JiraClient();
  private store: JiraStore = new JiraStore();
  private credentials: IJiraCredentials;

  constructor(saveCredentials: boolean = false) {
    this.credentials = this.store.getCredentials();
    if (!this.credentials) {
      this.credentials = JiraApiConnector.updateCredentials(saveCredentials);
    }
  }

  public static updateCredentials(saveCredentials: boolean): IJiraCredentials {
    console.log("Please enter you JIRA credentials");
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
    await this.client.obtainCookie(this.credentials);
    //await this.clearEntries(days);
    const preparedEntries = this.prepareEntries(days);
    await this.createWorklogs(preparedEntries);
  }

  private prepareEntries(days: IWorkDay[]): IJiraLogInput[] {
    return days
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
        key: entry.ticketId
      },
      author: {
        name: this.credentials.username
      },
      timeSpentSeconds: differenceInSeconds(entry.endTime, entry.startTime),
      dateStarted: dateWithMinutes
    };
  };

  private async createWorklogs(inputs: IJiraLogInput[]): Promise<void> {
    await Promise.all(inputs.map(log => this.client.createWorklog(log)));
  }
}
