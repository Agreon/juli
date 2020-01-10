import { IWorkDay, IWorkEntry } from "./types";
import { parseDate } from "./jira/util";
import { FormatError } from "./errors";
import { format } from "date-fns";

export class Parser {
  public static parse(text: string): IWorkDay[] {
    const days = text
      .split("#")
      .map(d => d.trim())
      .filter(v => !!v);

    return days.map(day => {
      const first = day.split("\n")[0].trim();
      const date = parseDate(first, ["d.M.", "d.M.yy"]);

      if (!date) {
        throw new FormatError(`Could not parse date '${first}'`);
      }

      return {
        date,
        workEntries: this.parseDay(day)
      };
    });
  }

  private static parseDay(text: string): IWorkEntry[] {
    const entries: IWorkEntry[] = [];
    const lines = text
      .split("\n")
      .slice(1)
      .map(l => l.trim())
      // Filter comments and empty lines
      .filter(l => l.length > 1 && l[0] !== "/" && l[1] !== "/")
      .filter(l => !!l);

    let startTime: Date | null = null;
    let endTime: Date | null = null;
    let ticketId: string | null = null;
    let description: string | null = null;

    for (let i = 0; i < lines.length; i += 1) {
      if (!startTime) {
        startTime = this.parseTime(lines[i]);
        continue;
      }

      if (!description || !ticketId) {
        const parts = lines[i].split(":");
        // Add existing comment if just adding something to a worklog
        if (parts.length === 1) {
          ticketId = parts[0].replace("+", "").trim();
          const existingEntry = entries.find(e => e.ticketId === ticketId);
          if (!existingEntry) {
            throw new FormatError(
              `Missing Description for Issue '${ticketId}' on ${format(
                startTime,
                "d.M."
              )}`
            );
          } else {
            description = existingEntry.description;
          }
        } else {
          ticketId = parts[0].replace("+", "").trim();
          description = parts
            .slice(1)
            .join(":")
            .trim();
        }

        continue;
      }
      endTime = this.parseTime(lines[i]);

      entries.push({
        startTime,
        endTime,
        ticketId,
        description
      });

      // end time is start time of next
      startTime = endTime;

      // Take breaks into account
      if (
        i < lines.length - 1 &&
        lines[i + 1].replace("+", "").trim().length < 6
      ) {
        startTime = null;
      }

      endTime = ticketId = description = null;
    }

    return entries;
  }

  private static parseTime(text: string): Date {
    const trimmed = text.replace("+", "").trim();
    const time = parseDate(trimmed, ["H", "H:m"]);

    if (!time) {
      throw new FormatError(`Time '${trimmed}' is not in right format`);
    }

    return time;
  }
}
