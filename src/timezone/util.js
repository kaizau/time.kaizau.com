import { add, set } from "date-fns";

export const DATETIME_FULL = "E, MMM d, HH:mm";

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

export function serialize({ dates, zones, title }) {
  const dateString = dates
    .map((d) => parseInt(d.valueOf() / 1000, 10))
    .join("!");
  const zoneString = zones.join("!").replace(/\//g, ".");

  const params = {
    z: zoneString,
    d: dateString,
  };

  if (title) {
    params.t = title;
  }

  return `?${new URLSearchParams(params).toString()}`;
}

export function deserialize(qs) {
  const params = new URLSearchParams(qs);

  const dates = (params.get("d") || "")
    .split("!")
    .map((d) => parseInt(d, 10) * 1000)
    .filter((d) => !!d)
    .map((d) => new Date(d));

  const zones = (params.get("z") || "")
    .replace(/\./g, "/")
    .split("!")
    .filter((d) => !!d);

  const title = params.get("t") || "";

  return { dates, zones, title };
}
