// Given event url params, this function:
// - Creates an iCal event with a self-editing link
// - Sends the event to attendees by email

import { v4 as uuidv4 } from "uuid";
import rrule from "rrule";
import ics from "ics";
const { RRule } = rrule; // Workaround rrule CJS export

import { sendEmails } from "./_shared/sendgrid.mjs";
import {
  servicePath,
  organizerName,
  organizerEmail,
  hostName,
  hostEmail,
  descriptionText,
} from "./_shared/strings.mjs";

const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export default async (req /* , ctx */) => {
  const url = new URL(req.url);
  const qs = Object.fromEntries(url.searchParams.entries());

  if (!qs.title || !qs.ts || !qs.interval || !qs.email) {
    return Response("Missing required parameters", { status: 400 });
  }

  const data = createEventData(url, qs);

  const event = ics.createEvent(data);
  if (event.error) {
    console.error(event.error);
    return new Response("Error creating iCal data", { status: 500 });
  }

  await sendEmails({
    emails: [hostEmail, qs.email],
    subject: "New call time proposed",
    body: "Sir, your serendipity is served.",
    ics: event.value,
    method: data.method,
  });

  // Respond with UID (without suffix)
  return new Response(JSON.stringify({ uid: data.uid.split("@")[0] }), {
    headers: { "Content-Type": "application/json" },
  });
};

function createEventData(url, qs) {
  const data = {};
  const uid = qs.uid || uuidv4();

  // Cache essential state into description. This not only populates the reschedule
  // form, but also provides reply.mjs with both attendee emails.
  const next = {
    uid,
    title: qs.title,
    ts: qs.ts,
    interval: qs.interval,
    email: qs.email,
    host: hostEmail, // required by reply.mjs
  };
  data.description = `${descriptionText}${url.origin}/${servicePath}?${new URLSearchParams(next).toString()}`;

  // Format iCal values
  data.productId = "com.kaizau.time";
  data.uid = `${uid}@${data.productId}`;
  data.sequence = Date.now(); // Always incrementing
  data.method = "REQUEST";
  data.organizer = { name: organizerName, email: organizerEmail };
  data.attendees = [
    {
      name: hostName,
      email: hostEmail,
      cutype: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      rsvp: true,
    },
    {
      name: qs.email,
      email: qs.email,
      cutype: "INDIVIDUAL",
      role: "REQ-PARTICIPANT",
      rsvp: true,
    },
  ];
  data.title = qs.title;

  // Parse start, duration, repeat
  data.startInputType = "utc";
  const date = new Date(parseInt(qs.ts, 10));
  data.start = date
    .toISOString()
    .split(".")[0]
    .split(/[^\d]+/)
    .map((str) => parseInt(str, 10));
  data.duration = { hours: 1 };
  const rule = new RRule({
    freq: RRule.WEEKLY,
    interval: parseInt(qs.interval, 10),
    byweekday: RRule[dayOfWeek[date.getDay()]],
  });
  data.recurrenceRule = rule.toString().slice(6); // Remove "RRULE:"

  return data;
}
