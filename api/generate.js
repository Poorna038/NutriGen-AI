import Groq from "groq-sdk";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { ingredients } = req.body;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "user",
          content: `Generate a healthy recipe using ${ingredients}`
        }
      ]
    });

    res.status(200).json({
      recipe: completion.choices[0].message.content
    });

  } catch (error) {
    res.status(500).json({
      error: "AI generation failed"
    });
  }
}