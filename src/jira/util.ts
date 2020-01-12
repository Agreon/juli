import { getISODay, subDays, parse, isValid } from "date-fns";
import { SingleBar, Presets } from "cli-progress";

export const getLastThursday = () => {
  const now = new Date();
  const today = getISODay(now);

  if (today > 3) {
    return subDays(now, today - 4);
  }

  return subDays(now, 7 - (4 - today));
};

export const parseDate = (text: string, formats: string[]) => {
  const fallBack = new Date();

  for (const format of formats) {
    const date = parse(text, format, fallBack);
    if (isValid(date) && date !== fallBack) {
      return date;
    }
  }
  return null;
};

export async function executeTasks<TRET_VAL>(
  tasks: (() => Promise<TRET_VAL>)[]
) {
  const progressBar = new SingleBar(
    {
      format: "[{bar}] {percentage}% || {value}/{total}",
      hideCursor: true
    },
    Presets.legacy
  );

  progressBar.start(tasks.length, 0);

  const retVal = await Promise.all(
    tasks.map(async task => {
      const val = await task();
      progressBar.increment(1);
      return val;
    })
  );

  progressBar.stop();

  return retVal;
}
