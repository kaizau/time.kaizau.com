export default async (req /* , ctx */) => {
  let data = {};
  let attachments = [];
  try {
    const formData = await req.formData();
    for (const [key, value] of formData) {
      if (value instanceof File) {
        const attachment = {
          filename: value.name,
          type: value.type,
          size: value.size,
          content: await value.arrayBuffer(),
        };
        attachments.push(attachment);
      } else {
        data[key] = value;
      }
    }
  } catch (e) {
    console.log("Ignoring invalid request", e);
    return new Response("🏖️");
  }

  console.log(data);
  console.log(attachments);

  return new Response("ok");
};
