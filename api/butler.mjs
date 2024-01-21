// Given event url params, this function:
// - Creates an iCal event with a self-editing link
// - Sends the event to attendees by email

import ics from "ics";
import { createEventData } from "./_shared/ical.mjs";
import { sendEmails } from "./_shared/sendgrid.mjs";

export default async (req /* , ctx */) => {
  const url = new URL(req.url);
  const qs = Object.fromEntries(url.searchParams.entries());

  if (!qs.title || !qs.ts || !qs.interval || !qs.attendees) {
    return Response("Missing required parameters", { status: 400 });
  }

  const data = createEventData({ url, ...qs });

  const event = ics.createEvent(data);
  if (event.error) {
    console.error(event.error);
    return new Response("Error creating iCal data", { status: 500 });
  }

  await sendEmails({
    emails: data.attendees.map((attendee) => attendee.email),
    subject: "New call time proposed",
    body: "Sir, your serendipity is served.",
    ics: event.value,
  });

  // Respond with UID (without suffix)
  return new Response(JSON.stringify({ uid: data.uid.split("@")[0] }), {
    headers: { "Content-Type": "application/json" },
  });
};
