import axios from "axios";

const JIRA_HOST = "https://jira.incloud.zone";
const WORKLOG_URL = `${JIRA_HOST}/rest/tempo-timesheets/3/worklogs/`;
const WORKLOGS_URL = (since: number) =>
  `${JIRA_HOST}/rest/api/2/worklog/updated?since=${since}`;
const ALL_WORKLOGS_URL = `${JIRA_HOST}/rest/api/2/worklog/list`;
const SESSION_URL = `${JIRA_HOST}/rest/auth/1/session`;

export interface IJiraCredentials {
  username: string;
  password: string;
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

  public async obtainCookie(credentials: IJiraCredentials): Promise<void> {
    try {
      const retVal = await axios.post(SESSION_URL, credentials);

      if (retVal.status !== 200) {
        throw new Error("Login failed");
      }
      this.cookie = `JSESSIONID=${retVal.data.session.value}`;
    } catch (e) {
      if (e.response.data?.errorMessages?.length) {
        console.log("Login failed:");
        e.response.data.errorMessages.map(m => console.error(m));
        process.exit(1);
      }

      if (e.response.headers["x-seraph-loginreason"]) {
        console.error("CAPTCHA Error");
        process.exit(1);
      }
      console.error("Login failed");
      process.exit(1);
    }
  }

  public async createWorklog(item: IJiraLogInput): Promise<void> {
    try {
      await axios.post(WORKLOG_URL, item, {
        headers: {
          "Content-Type": "application/json",
          Cookie: this.cookie
        }
      });
    } catch (e) {
      // TODO: 500
      if (e.response.status === 404) {
        console.log(`No Ticket for ${item.issue.key} found`);
      }
    }
  }
}
