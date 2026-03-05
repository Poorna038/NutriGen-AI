import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {

  // -------- CORS HEADERS --------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { ingredients } = req.body;

    if (!ingredients) {
      return res.status(400).json({
        error: "Ingredients are required",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional chef and nutrition expert. Generate clear recipes with nutrition information.",
        },
        {
          role: "user",
          content: `Create a recipe using these ingredients: ${ingredients}.

IMPORTANT:
Return the response as normal readable text.
DO NOT return JSON or code blocks.

Format exactly like this:

Recipe Name

Ingredients:
- ingredient
- ingredient

Nutrition Information:
Calories:
Protein:
Fat:
Carbohydrates:
Fiber:
Vitamins:

Instructions:
1. Step one
2. Step two
3. Step three
`,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const recipe = completion.choices[0].message.content;

    return res.status(200).json({
      recipe: recipe,
    });

  } catch (error) {

    console.error("AI generation error:", error);

    return res.status(500).json({
      error: "AI generation failed",
    });

  }
}