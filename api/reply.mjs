export default async (req /* , ctx */) => {
  let data = {};
  try {
    const formData = await req.formData();
    for (const [key, value] of formData) {
      data[key] = value;
    }
    data.envelope = JSON.parse(data.envelope);
  } catch (e) {
    console.log("Ignoring invalid request");
    return new Response("🏖️");
  }

  console.log(data);
  return new Response("ok");
};
