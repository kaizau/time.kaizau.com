// Given event url params, this function:
// - Creates an iCal event with a self-editing link
// - Sends the event to attendees by email

// TODO
// Maybe increment sequence based on time? Would otherwise need to track this in URL,
// but calendar replies may also bump the number.

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

  // Respond with JSON containing uid and sequence
  return new Response(
    JSON.stringify({ uid: data.uid, sequence: data.sequence }),
    { headers: { "Content-Type": "application/json" } },
  );
};

function createEventData(url, qs) {
  const data = {};
  data.uid = qs.uid || uuidv4();
  data.sequence = qs.sequence ? parseInt(qs.sequence, 10) + 1 : 1;
  data.method = "REQUEST";

  // Cache essential state into description
  const next = {
    uid: data.uid,
    sequence: data.sequence,
    title: qs.title,
    ts: qs.ts,
    interval: qs.interval,
    email: qs.email,
  };
  data.description = `Reschedule: ${url.origin}/${servicePath}?${new URLSearchParams(next).toString()}`;

  // Format iCal values
  data.productId = "com.kaizau.time";
  data.organizer = { name: organizerName, email: organizerEmail };
  data.attendees = [
    {
      name: hostName,
      email: hostEmail,
      rsvp: true,
    },
    {
      name: qs.email,
      email: qs.email,
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
