const SCHOOL_TIME_ZONE = process.env.SCHOOL_TIME_ZONE || "Indian/Antananarivo";

export interface SchoolClock {
  date: string; // YYYY-MM-DD
  hours: number;
  minutes: number;
}

/**
 * Current date and time expressed in the school time zone, so that lateness
 * does not depend on the time zone of the server (Render runs in UTC).
 */
export const getSchoolClock = (now: Date = new Date()): SchoolClock => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const read = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "0";

  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    hours: Number(read("hour")),
    minutes: Number(read("minute")),
  };
};
