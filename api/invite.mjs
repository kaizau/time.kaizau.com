// Given event url params, this function:
// - Creates an iCal event with a self-editing link
// - Sends the event to attendees by email

import { createEvent, createFiles } from "./_shared/ical.mjs";
import { sendEmails } from "./_shared/sendgrid.mjs";

export const config = { path: "/relay/invite" };

export default async (req /* , ctx */) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json();
  if (!body.title || !body.ts || !body.interval || !body.guests) {
    return new Response("Missing required parameters", { status: 400 });
  }

  const icsData = createEvent(body);
  const emails = icsData.attendees.map((attendee) => attendee.email);
  const attachments = createFiles(icsData);

  try {
    await sendEmails({
      emails,
      attachments,
      subject: `⏩ New call time proposed: ${icsData.title}`,
      body: "Guilt-free rescheduling link enclosed.",
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return new Response("Error", { status: 500 });
  }

  // Respond with UID (without suffix)
  return new Response(JSON.stringify({ uid: icsData.uid.split("@")[0] }), {
    headers: { "Content-Type": "application/json" },
  });
};
