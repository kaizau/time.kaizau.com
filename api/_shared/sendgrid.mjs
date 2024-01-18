import sgMail from "@sendgrid/mail";
import { organizerName, organizerEmail } from "./strings.mjs";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export function sendEmails({ emails, subject, body, ics, method }) {
  let message = {
    from: { name: organizerName, email: organizerEmail },
    to: emails,
    subject: `🎩 ${subject}`,
    text: body,
    html: `<p>${body}</p>`,
    attachments: [
      {
        type: `text/calendar; method=${method}`,
        filename: "serendipity.ics",
        content: Buffer.from(ics).toString("base64"),
        disposition: "attachment",
      },
    ],
  };

  return sgMail
    .send(message)
    .then(() => console.log(`Emails sent to ${emails.join(", ")}`))
    .catch((error) => console.error(error));
}
