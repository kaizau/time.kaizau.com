import { Readable } from "stream";
import busboy from "busboy";
import ical from "node-ical";

import { descriptionText, organizerEmail } from "./_shared/strings.mjs";
import { sendEmails } from "./_shared/sendgrid.mjs";

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

  // TODO get sender the ICS Reply instead?
  if (!fields.from) {
    console.log("Ignoring non-email request:", fields);
    return;
  }

  // Filter for ICS attachments
  const events = files.filter((file) => file.filename.endsWith(".ics"));
  if (!events.length) {
    return console.log("Ignoring request with no ICS attachments");
  }

  // Parse ICS attachments
  let icsData;
  let icsString;
  try {
    for (const event of events) {
      const icsParsed = ical.sync.parseICS(event.content.toString());
      const icsEvent = Object.values(icsParsed)[0];
      if (
        icsEvent?.organizer?.val?.toLowerCase() === `mailto:${organizerEmail}`
      ) {
        icsData = icsEvent;
        icsString = event.content.toString();
        break;
      }
    }
  } catch (error) {
    return console.error("Error processing ICS file:", error);
  }

  if (icsData.method !== "REPLY" || !icsData.description) {
    return console.log("Ignoring invalid ICS");
  }

  // Extract attendees from description URL
  const attendees = [];
  try {
    const url = new URL(
      icsData.description.split(descriptionText).pop().trim(),
    );
    attendees.push(url.searchParams.get("host"));
    attendees.push(url.searchParams.get("email"));
  } catch (error) {
    return console.error("Error parsing attendees from description:", error);
  }

  // Determine which attendee to forward ICS to
  const senderEmail = fields.from.match(/<(.+)>/);
  const sender = senderEmail ? senderEmail[1] : fields.from;
  const forwardTo = attendees.filter((attendee) => attendee !== sender);
  if (!forwardTo.length) {
    return console.error("Unable to determine forwarding address");
  }

  // TODO Create updated ICS to forward because Fastmail ICS format
  // doesn't seem to show up on Google?
  // Parse partstat from update, update the correct attendee, then send

  // Forward ICS to non-sender attendee
  await sendEmails({
    emails: forwardTo,
    subject: "Next call confirmed",
    body: "Congratulations, sir. That's most excellent news.",
    ics: icsString,
    method: icsData.method,
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
