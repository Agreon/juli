import { getISODay, subDays, parse, isValid } from "date-fns";

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
