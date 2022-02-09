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

export function serialize(dates, zones) {
  const dateString = dates.map((d) => parseInt(d.valueOf() / 1000)).join("!");
  const zoneString = zones.join("!").replace(/\//g, ".");

  const params = new URLSearchParams({
    z: zoneString,
    d: dateString,
  });

  return "?" + params.toString();
}

export function deserialize(qs) {
  const params = new URLSearchParams(qs);

  const dates = (params.get("d") || "")
    .split("!")
    .map((d) => parseInt(d) * 1000)
    .filter((d) => !!d);

  const zones = (params.get("z") || "")
    .replace(/\./g, "/")
    .split("!")
    .filter((d) => !!d);

  return { dates, zones };
}
