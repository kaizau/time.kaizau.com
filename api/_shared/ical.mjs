import { v4 as uuidv4 } from "uuid";
import rrule from "rrule";
import ics from "ics";
import {
  servicePath,
  organizerName,
  organizerEmail,
  descriptionText,
} from "./strings.mjs";

const { RRule } = rrule; // Workaround rrule CJS export
const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const statuses = {
  0: "NEEDS-ACTION",
  1: "DECLINED",
  2: "TENTATIVE",
  3: "ACCEPTED",
};

export function urlToEvent(urlStr) {
  const url = new URL(urlStr);
  const data = Object.fromEntries(url.searchParams.entries());
  data.interval = parseInt(data.interval, 10);
  data.guests = data.guests.split(",").map((email) => email.trim());
  data.rsvp = data.rsvp.split(",").map((status) => status.trim());
  return createEvent({ url, ...data });
}

export function createEvent({ url, uid, title, ts, interval, guests, rsvp }) {
  const data = {};
  const baseUid = uid || uuidv4();

  // Base iCal values
  data.productId = "com.kaizau.time";
  data.uid = `${baseUid}@${data.productId}`;
  data.sequence = Math.round(Date.now() / 1000); // increment every second
  data.method = "REQUEST";
  data.status = "TENTATIVE";
  data.title = title;
  data.organizer = { name: organizerName, email: organizerEmail };

  // Attendees and RSVP
  const rsvpState = rsvp.map((reply) => statuses[reply]);
  data.attendees = guests.map((attendee, index) => {
    return {
      name: attendee,
      email: attendee,
      cutype: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      partstat: rsvpState[index],
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
    rsvp,
  };
  data.description = `${descriptionText}${url.origin}/${servicePath}?${new URLSearchParams(next).toString()}`;

  return data;
}

// Create customized ICS for each attendee (self reference in description link)
export function createFiles(data) {
  return data.attendees.map((_, index) => {
    const { value, error } = ics.createEvent({
      ...data,
      description: `${data.description}&self=${index}`,
    });
    if (error) throw new Error(error);
    return value;
  });
}

export function updateRsvp(data, email, status) {
  const index = data.attendees.findIndex(
    (attendee) => attendee.email === email,
  );
  const replying = data.attendees[index];
  replying.partstat = status;

  // Update description RSVP status
  const rsvp = data.attendees.map((attendee) =>
    Object.keys(statuses).find((key) => statuses[key] === attendee.partstat),
  );
  const rsvpStr = rsvp.join(",");
  const [description, urlStr] = data.description.split(descriptionText);
  const url = new URL(urlStr.trim());
  url.searchParams.delete("rspv");
  url.searchParams.set("rspv", rsvpStr);
  console.log(rsvpStr);
  data.description = `${description}${descriptionText}${url.toString()}`;
}
