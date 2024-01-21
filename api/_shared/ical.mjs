import { v4 as uuidv4 } from "uuid";
import rrule from "rrule";
const { RRule } = rrule; // Workaround rrule CJS export
import {
  servicePath,
  organizerName,
  organizerEmail,
  hostName,
  hostEmail,
  descriptionText,
} from "./strings.mjs";

const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function createEventData({ url, uid, title, ts, interval, email }) {
  const data = {};
  uid = uid || uuidv4();

  // Cache essential state into description. This not only populates the reschedule
  // form, but also provides reply.mjs with both attendee emails.
  const next = {
    uid,
    title,
    ts,
    interval,
    email,
    host: hostEmail, // required by reply.mjs
  };
  data.description = `${descriptionText}${url.origin}/${servicePath}?${new URLSearchParams(next).toString()}`;

  // Format iCal values
  data.productId = "com.kaizau.time";
  data.uid = `${uid}@${data.productId}`;
  data.sequence = Math.round(Date.now() / 1000); // increment every second
  data.method = "REQUEST";
  data.title = title;
  data.organizer = { name: organizerName, email: organizerEmail };
  data.attendees = [
    {
      name: hostName,
      email: hostEmail,
      cutype: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      partstat: "NEEDS-ACTION",
      rsvp: true,
    },
    {
      name: email,
      email,
      cutype: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      partstat: "NEEDS-ACTION",
      rsvp: true,
    },
  ];

  // Parse start, duration, repeat
  data.startInputType = "utc";
  const date = new Date(parseInt(ts, 10));
  data.start = date
    .toISOString()
    .split(".")[0]
    .split(/[^\d]+/)
    .map((str) => parseInt(str, 10));
  data.duration = { hours: 1 };
  const rule = new RRule({
    freq: RRule.WEEKLY,
    interval: parseInt(interval, 10),
    byweekday: RRule[dayOfWeek[date.getDay()]],
  });
  data.recurrenceRule = rule.toString().slice(6); // Remove "RRULE:"

  return data;
}
