import sgMail from "@sendgrid/mail";
import { organizerName, organizerEmail } from "./strings.mjs";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export function sendEmails({ emails, attachments, subject, body, method }) {
  const icsMethod = method || "REQUEST";
  const messages = emails.map((email, index) => {
    return {
      from: { name: organizerName, email: organizerEmail },
      to: email,
      subject: `🎩 ${subject}`,
      text: body,
      html: `<p>${body}</p>`,
      attachments: [
        {
          type: `text/calendar; method=${icsMethod}`,
          filename: "serendipity.ics",
          content: Buffer.from(attachments[index]).toString("base64"),
          disposition: "attachment",
        },
      ],
    };
  });

  return sgMail
    .send(messages)
    .then(() => console.log(`Emails sent to ${emails.join(", ")}`));
}
