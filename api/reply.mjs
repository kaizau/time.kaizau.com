import { Readable } from "stream";
import busboy from "busboy";
import ical from "node-ical";
import ics from "ics";

import { descriptionText, organizerEmail } from "./_shared/strings.mjs";
import { sendEmails } from "./_shared/sendgrid.mjs";
import { createEventData } from "./_shared/ical.mjs";

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
  const events = files.filter((file) => file.filename.endsWith(".ics"));
  if (!events.length) {
    return console.log("Ignoring request with no ICS attachments");
  }

  // Parse ICS attachments
  let icsData;
  try {
    for (const event of events) {
      const icsParsed = ical.sync.parseICS(event.content.toString());
      const icsEvent = Object.values(icsParsed)[0];
      if (
        icsEvent?.organizer?.val?.toLowerCase() === `mailto:${organizerEmail}`
      ) {
        icsData = icsEvent;
        break;
      }
    }
  } catch (error) {
    return console.error("Error processing ICS file:", error);
  }

  // Skip invalid ICS files
  if (icsData.method !== "REPLY" || !icsData.description) {
    return console.log("Ignoring invalid ICS");
  }

  // Extract data from ICS description URL
  let url;
  let qs;
  try {
    url = new URL(icsData.description.split(descriptionText).pop().trim());
    qs = Object.fromEntries(url.searchParams.entries());
  } catch (error) {
    return console.error("Error parsing description URL:", error);
  }

  // Prepare new ICS
  // Calendar reply formats aren't always compatible, so we create
  // a new update. Assumes that only a single attendee is included.
  let replyStatus;
  let replyEmail;
  try {
    replyStatus = icsData.attendee.params.PARTSTAT;
    replyEmail = icsData.attendee.val.split(":")[1];
  } catch (error) {
    return console.error("Unable to parse reply status");
  }
  console.log(replyEmail, replyStatus);

  // Construct new ICS
  const data = createEventData({ url, ...qs });
  const replying = data.attendees.find(
    (attendee) => attendee.email === replyEmail,
  );
  replying.partstat = replyStatus;
  console.log(data);

  const icsUpdate = ics.createEvent(data);
  if (icsUpdate.error) {
    return console.error("Unable to create updated ICS:", icsUpdate.error);
  }

  // Forward ICS to non-sender attendee
  // TODO Handle declines
  await sendEmails({
    emails: data.attendees.map((a) => a.email),
    subject: "Next call confirmed",
    body: "Congratulations, sir. That's most excellent news.",
    ics: icsUpdate.value,
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
