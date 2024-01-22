import { v4 as uuidv4 } from "uuid";
import rrule from "rrule";
const { RRule } = rrule; // Workaround rrule CJS export
import {
  servicePath,
  organizerName,
  organizerEmail,
  descriptionText,
} from "./strings.mjs";

const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const statuses = {
  0: "NEEDS-ACTION",
  1: "DECLINED",
  2: "TENTATIVE",
  3: "ACCEPTED",
};

export function createEventData({
  url,
  uid,
  title,
  ts,
  interval,
  guests,
  rsvp,
}) {
  const data = {};
  const baseUid = uid || uuidv4();

  // Base iCal values
  data.productId = "com.kaizau.time";
  data.uid = `${baseUid}@${data.productId}`;
  data.sequence = Math.round(Date.now() / 1000); // increment every second
  data.method = "REQUEST";
  data.title = title;
  data.organizer = { name: organizerName, email: organizerEmail };

  // Attendees and RSVP
  const rsvpState = rsvp.map((reply) => statuses[reply]);
  data.attendees = guests.map((attendee, index) => {
    const partstat = rsvpState[index] || "NEEDS-ACTION";
    return {
      name: attendee,
      email: attendee,
      cutype: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      partstat,
      rsvp: true,
    };
  });

  // Start, duration, repeat
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

  // Cache essential state into description. This not only populates the reschedule
  // form, but also provides reply.mjs with attendee emails.
  const next = {
    uid: baseUid,
    title,
    ts,
    interval,
    guests,
  };
  data.description = `${descriptionText}${url.origin}/${servicePath}?${new URLSearchParams(next).toString()}`;

  return data;
}
