import { parse, isValid } from "date-fns";
import { IWorkDay, IWorkEntry } from "./types";

const fallBack = new Date();

export class Parser {
  public static parse(text: string): IWorkDay[] {
    const days = text
      .split("#")
      .map(d => d.trim())
      .filter(v => !!v);

    return days.map(day => {
      const first = day.split("\n")[0].trim();
      const date = parse(first, "dd.MM.yy", fallBack);

      if (date == fallBack) {
        throw new Error("Could not parse date");
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
      if (!description) {
        const parts = lines[i].split(":");
        // Add existing description if just adding something to a worklog
        if (parts.length === 1) {
          ticketId = parts[0].replace("+", "").trim();
          const existingEntry = entries.find(e => e.ticketId === ticketId);
          if (!existingEntry) {
            throw new Error(
              `Missing Description for ${ticketId} in Line ${i + 1}`
            );
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
    const date = text.replace("+", "").trim();
    let time = null;

    if (date.length === 1) {
      time = parse(date, "H", fallBack);
    } else if (date.length === 2) {
      time = parse(date, "HH", fallBack);
    } else if (date.length === 4) {
      time = parse(date, "H:mm", fallBack);
    } else if (date.length === 5) {
      time = parse(date, "HH:mm", fallBack);
    } else {
      throw new Error(`Time ${date} not in right format`);
    }

    if (!isValid(time) || time == fallBack) {
      throw new Error(`Time ${date} not in right format`);
    }

    return time;
  }
}
