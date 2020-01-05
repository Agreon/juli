import { IWorkDay, IWorkEntry } from "./types";
import { parseDate } from "./jira/util";

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
        console.error(`Could not parse date ${first}`);
        process.exit(1);
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
      .map(t => t.trim());

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
        // Add existing description if just adding something to a worklog
        if (parts.length === 1) {
          ticketId = parts[0].replace("+", "").trim();
          const existingEntry = entries.find(e => e.ticketId === ticketId);
          if (!existingEntry) {
            console.error(
              `Missing Description for ${ticketId} on day ${startTime}`
            );
            process.exit(1);
          }
          description = existingEntry.description;
        } else {
          ticketId = parts[0].replace("+", "").trim();
          description = parts[1].trim();
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
      console.error(`Time ${trimmed} not in right format`);
      process.exit(1);
    }

    return time;
  }
}
