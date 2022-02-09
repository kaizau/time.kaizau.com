import { add, set } from "date-fns";

export const DATETIME_FULL = "MMM d, y HH:mm";

export function nextHour() {
  return add(
    set(new Date(), {
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }),
    { hours: 1 }
  );
}
