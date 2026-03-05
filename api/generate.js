import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { ingredients, preferences } = req.body;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional chef and nutrition expert generating personalized recipes."
        },
        {
          role: "user",
          content: `
Create a recipe using these ingredients:
${ingredients}

User Preferences:
${preferences}

Return readable text (not JSON).

Format:

Recipe Name

Ingredients:
- item

Nutrition Information:
Calories:
Protein:
Fat:
Carbohydrates:
Fiber:
Vitamins:

Instructions:
1.
2.
3.
`
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const recipe = completion.choices[0].message.content;

    res.status(200).json({
      recipe
    });

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "AI generation failed"
    });

  }
}