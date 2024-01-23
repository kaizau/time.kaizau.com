import sgMail from "@sendgrid/mail";
import { organizerName, organizerEmail } from "./strings.mjs";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export function sendEmails({ emails, attachments, subject, body, method }) {
  const icsMethod = method || "REQUEST";

  const messages = emails.map((email, index) => {
    const emailBody = Array.isArray(body) ? body[index] : body;
    const attachment = Array.isArray(attachments)
      ? attachments[index]
      : attachment;
    return {
      from: { name: organizerName, email: organizerEmail },
      to: email,
      subject: `⏩ ${subject}`,
      text: emailBody,
      html: `<p>${emailBody}</p>`,
      attachments: [
        {
          type: `text/calendar; method=${icsMethod}`,
          filename: "serendipity.ics",
          content: Buffer.from(attachment).toString("base64"),
          disposition: "attachment",
        },
      ],
    };
  });

  return sgMail
    .send(messages)
    .then(() => console.log(`Emails sent to ${emails.join(", ")}`));
}
