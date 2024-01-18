import sgMail from "@sendgrid/mail";
import { organizerName, organizerEmail } from "./strings.mjs";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export function sendEmails({ emails, ics, method, overrides }) {
  let message = {
    from: { name: organizerName, email: organizerEmail },
    to: emails,
    subject: "🗓️🧞‍♂️ A magical calendar invite!",
    text: "Behold! A magic calendar invite!",
    html: "<h1>Behold!</h1><p>A magic calendar invite!</p>",
    attachments: [
      {
        type: `text/calendar; method=${method}`,
        filename: "serendipity.ics",
        content: Buffer.from(ics).toString("base64"),
        disposition: "attachment",
      },
    ],
  };

  if (overrides) {
    message = { ...message, ...overrides };
  }

  return sgMail
    .send(message)
    .then(() => console.log(`Emails sent to ${emails.join(", ")}`))
    .catch((error) => console.error(error));
}
