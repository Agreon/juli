import axios from "axios";
import { AuthenticationError } from "../errors";
import { handleError } from "../util/handleError";
import { parseDate } from "./util";

const SESSION_URL = (host: string) => `${host}/rest/auth/1/session`;
const WORKLOG_URL = (host: string) =>
  `${host}/rest/tempo-timesheets/3/worklogs/`;
const DELETE_WORKLOG_URL = (
  host: string,
  issueId: string,
  worklogId: string
) => `
${host}/rest/api/2/issue/${issueId}/worklog/${worklogId}`;

const APPROVAL_STATUS_URL = (host: string, username: string) => `
${host}/rest/tempo-timesheets/4/timesheet-approval/approval-statuses?numberOfPeriods=1&userKey=${username}`;

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
    const axiosInstance = axios.create({
      validateStatus: status => status === 200,
      timeout: 10000,
    });

    try {
      const retVal = await axiosInstance.post(
        SESSION_URL(this.host),
        this.credentials
      );
      this.cookie = `JSESSIONID=${retVal.data.session.value}`;
    } catch (e) {
      throw AuthenticationError.fromAxiosError(e);
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
        date: res.data.dateStarted,
      };
    } catch (e) {
      handleError(
        e,
        e.response.status === 400
          ? `No Ticket for '${item.issue.key}' found`
          : undefined,
        "warning"
      );
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
      handleError(
        e,
        `Could not delete worklog ${log.id} for issue ${log.issueId}`,
        "warning"
      );
    }
  }

  public async getStartDateOfCurrentApprovalPeriod(): Promise<Date> {
    try {
      const { data } = await axios.get(
        APPROVAL_STATUS_URL(this.host, this.credentials.username),
        this.getRequestOptions()
      );
      const date = parseDate(data[0].period.dateFrom, ["yyyy-MM-dd"]);

      if (!date) {
        throw new Error("Date had invalid format");
      }
      return date;
    } catch (e) {
      handleError(e, "Could not get start date of approval period", "error");
      process.exit(1);
    }
  }

  private getRequestOptions() {
    return {
      headers: {
        "Content-Type": "application/json",
        Cookie: this.cookie,
      },
    };
  }
}
