import { Readable } from "stream";
import busboy from "busboy";
import ical from "node-ical";

import { descriptionText, organizerEmail } from "./_shared/strings.mjs";
import { sendEmails } from "./_shared/sendgrid.mjs";
import { urlToEvent, createFiles, updateRsvp } from "./_shared/ical.mjs";

export const config = { path: "/relay/reply" };

export default async (req /* , ctx */) => {
  if (
    req.method === "POST" &&
    req.headers.get("content-type").includes("multipart/form-data")
  ) {
    await forwardReplyToAttendees(req);
  } else {
    console.log(
      "Ignoring invalid request:",
      req.method,
      req.headers.get("content-type"),
    );
  }
  return new Response("🎩");
};

async function forwardReplyToAttendees(req) {
  const [fields, files] = await parseForm(req);

  // Filter for SendGrid webhook
  if (!fields.from) {
    console.log("Ignoring non-email request:", fields);
    return;
  }

  // Filter for ICS attachments
  const icsFiles = files.filter((file) => file.filename.endsWith(".ics"));
  if (!icsFiles.length) {
    return console.log("Ignoring request with no ICS attachments");
  }

  // Parse ICS attachments
  let replyData;
  try {
    for (const icsFile of icsFiles) {
      const parsed = ical.sync.parseICS(icsFile.content.toString());
      const event = Object.values(parsed)[0];
      if (event?.organizer?.val?.toLowerCase() === `mailto:${organizerEmail}`) {
        replyData = event;
        break;
      }
    }
  } catch (error) {
    return console.error("Error processing ICS file:", error);
  }

  // Skip invalid ICS files
  if (replyData.method !== "REPLY" || !replyData.description) {
    return console.log("Ignoring invalid ICS");
  }

  // Extract data from ICS description URL
  let updateData;
  try {
    const url = replyData.description.split(descriptionText).pop().trim();
    updateData = urlToEvent(url);
  } catch (error) {
    return console.error("Error parsing description URL:", error);
  }

  // Valid reply email determined at this point
  console.log("Inbound reply:", fields.from);
  console.log("Reply ICS:", replyData);

  // Apply reply to attendee update
  let replyStatus;
  let replyEmail;
  try {
    replyStatus = replyData.attendee.params.PARTSTAT;
    replyEmail = replyData.attendee.val.split(":")[1];
  } catch (error) {
    return console.error("Unable to parse reply status");
  }
  updateRsvp(updateData, replyEmail, replyStatus);

  // Handle status based on attendees
  let subject;
  const allDeclined = updateData.attendees.every(
    (attendee) => attendee.partstat === "DECLINED",
  );
  const allAccepted = updateData.attendees.every(
    (attendee) => attendee.partstat === "ACCEPTED",
  );
  if (allDeclined) {
    updateData.method = "CANCEL";
    updateData.status = "CANCELLED";
    subject = "🛑 Call cancelled";
  } else if (allAccepted) {
    updateData.status = "CONFIRMED";
    subject = "✅ Call confirmed";
  } else {
    subject = "⏩ Call updated";
  }

  console.log("Update ICS:", updateData);
  console.log("Method & Status:", updateData.method, updateData.status);

  // Forward ICS to non-sender attendee
  const emails = updateData.attendees.map((attendee) => attendee.email);
  const attachments = createFiles(updateData);
  const descriptionBase = updateData.description.split(descriptionText)[1];
  const body = updateData.attendees.map((_, index) => {
    return `Reschedule at any time: ${descriptionBase}&self=${index}`;
  });
  await sendEmails({
    emails,
    attachments,
    subject,
    body,
    method: updateData.method,
  });
}

async function parseForm(req) {
  const fields = {};
  const files = [];
  const headers = Object.fromEntries(req.headers.entries());
  const bb = busboy({ headers });

  bb.on("field", (key, val) => {
    fields[key] = val;
  });

  bb.on("file", (name, file, info) => {
    let content = Buffer.from("");
    file
      .on("data", (data) => {
        content = Buffer.concat([content, data]);
      })
      .on("end", () => {
        files.push({ ...info, content });
      });
  });

  const finished = new Promise((resolve, reject) => {
    bb.on("finish", () => resolve([fields, files]));
    bb.on("error", (error) => reject(error));
  });

  const stream = await convertToNodeStream(req.body);
  stream.pipe(bb);
  return await finished;
}

async function convertToNodeStream(webStream) {
  const nodeStream = new Readable({
    read() {},
  });
  for await (const chunk of webStream) {
    nodeStream.push(Buffer.from(chunk));
  }
  nodeStream.push(null);
  return nodeStream;
}
