import * as readlineSync from "readline-sync";
import { IApiConnector, IWorkDay, IWorkEntry } from "../types";
import { differenceInSeconds, setMinutes, setHours } from "date-fns";
import { JiraStore } from "./JiraStore";
import { JiraClient, IJiraLogInput, IJiraCredentials } from "./JiraClient";

export class JiraApiConnector implements IApiConnector {
  private client: JiraClient = new JiraClient();
  private credentials: IJiraCredentials;

  constructor(saveCredentials: boolean = false) {
    this.credentials = JiraStore.getCredentials();
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
      JiraStore.setCredentials(credentials);
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

  /**
   * TODO: Maybe not possible like this
   * => Save created ids in GlobalConfig and then fetch by them
   * @param days
   */
  /*private async clearEntries(days: IWorkDay[]) {
    const existingEntries = GlobalConfigManager.getSync("juli", "entries.json");

    if (!existingEntries) {
      return;
    }

    try {
      const logs = await axios.get(
        WORKLOGS_URL(
          parseInt(
            parse("01.01.20", "dd.MM.yy", new Date())
              .getTime()
              .toFixed(0)
          )
        ),
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: this.cookie
          }
        }
      );
      const logsOfWeek = await axios.post(ALL_WORKLOGS_URL, {
        ids: logs.data.values.map(v => v.worklogId)
      });
      console.log(logsOfWeek);
    } catch (e) {
      console.log(e);
      if (e.response.headers["x-seraph-loginreason"]) {
        throw new Error("CAPTCHA ERROR");
      }
      throw new Error("Could not get worklogs");
    }
  }*/

  private async createWorklogs(inputs: IJiraLogInput[]): Promise<void> {
    await Promise.all(inputs.map(log => this.client.createWorklog(log)));
  }
}
