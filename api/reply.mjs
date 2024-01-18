import { Readable } from "stream";
import busboy from "busboy";
import ical from "node-ical";

import { organizerEmail } from "./_shared/strings.mjs";
import { sendEmails } from "./_shared/sendgrid.mjs";
import { ics } from "calendar-link";

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

  if (!fields.from) {
    console.log("Ignoring non-Sendgrid request");
    return;
  }

  let icsData;
  let icsString;
  const events = files.filter((file) => file.filename.endsWith(".ics"));
  if (events.length) {
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
      console.error("Error processing ICS file:", error);
      return;
    }
  }

  if (icsData.attendee) {
    console.log(icsData);

    const attendees = Array.isArray(icsData.attendee)
      ? icsData.attendee
      : [icsData.attendee];
    const senderEmail = fields.from.match(/<(.+)>/);
    const sender = senderEmail ? senderEmail[1] : fields.from;
    const forwardTo = attendees
      .map((attendee) => attendee.val.replace(/mailto:/i, ""))
      .filter((attendee) => attendee !== sender);

    console.log(attendees, sender, forwardTo);

    await sendEmails({
      emails: forwardTo,
      subject: "Next call confirmed",
      body: "Congratulations, sir. That's most excellent news.",
      ics: icsString,
      method: icsData.method,
    });
  } else {
    console.log("Unable to extract event data for forwarding");
    return;
  }
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
