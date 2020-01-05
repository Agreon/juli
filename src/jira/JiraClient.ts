import axios from "axios";

const SESSION_URL = (host: string) => `${host}/rest/auth/1/session`;
const WORKLOG_URL = (host: string) =>
  `${host}/rest/tempo-timesheets/3/worklogs/`;
const DELETE_WORKLOG_URL = (
  host: string,
  issueId: string,
  worklogId: string
) => `
${host}/rest/api/2/issue/${issueId}/worklog/${worklogId}`;

export interface IJiraCredentials {
  username: string;
  password: string;
}

export interface IJiraWorklog {
  id: string;
  issueId: string;
  date: Date;
}

export interface IJiraLogInput {
  comment: string;
  dateStarted: Date;
  timeSpentSeconds: number;
  author: {
    name: string;
  };
  issue: {
    key: string;
  };
}

export class JiraClient {
  private cookie: string = "";

  constructor(private host: string, private credentials: IJiraCredentials) {}

  public async obtainCookie() {
    try {
      const retVal = await axios.post(SESSION_URL(this.host), this.credentials);

      if (retVal.status !== 200) {
        throw new Error("Login failed");
      }
      this.cookie = `JSESSIONID=${retVal.data.session.value}`;
    } catch (e) {
      if (e.response.data?.errorMessages?.length) {
        console.log("Login failed:");
        e.response.data.errorMessages.map((m: string) => console.error(m));
        process.exit(1);
      }

      if (e.response.headers["x-seraph-loginreason"]) {
        console.error(
          "CAPTCHA Error. Please complete the Captcha in your Browser"
        );
        process.exit(1);
      }

      console.error("Login failed");
      process.exit(1);
    }
  }

  public async createWorklog(
    item: IJiraLogInput
  ): Promise<IJiraWorklog | null> {
    try {
      const res = await axios.post(
        WORKLOG_URL(this.host),
        item,
        this.getRequestOptions()
      );
      return {
        id: res.data.id,
        issueId: res.data.issue.key,
        date: res.data.dateStarted
      };
    } catch (e) {
      if (e.response.status === 404) {
        console.log(`No Ticket for ${item.issue.key} found`);
      } else {
        console.error("An unexpected Error occurred: \n");
        console.log(e.response.data);
      }
    }
    return null;
  }

  public async deleteWorklog(log: IJiraWorklog): Promise<void> {
    try {
      await axios.delete(
        DELETE_WORKLOG_URL(this.host, log.issueId, log.id),
        this.getRequestOptions()
      );
    } catch (e) {
      console.error(
        `Could not delete worklog ${log.id} for issue ${log.issueId}: \n`
      );
      console.log(e.response.data);
    }
  }

  private getRequestOptions() {
    return {
      headers: {
        "Content-Type": "application/json",
        Cookie: this.cookie
      }
    };
  }
}
