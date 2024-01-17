export default async (req /* , ctx */) => {
  let data = {};
  try {
    const formData = await req.formData();
    for (const [key, value] of formData) {
      data[key] = value;
    }
    console.log(data);
  } catch (e) {
    return new Response("🏖️");
  }

  return new Response("ok");
};
