import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    // Handle preflight request
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed",
        });
    }

    try {
        // Get data from Framer
        const { ingredients, preferences } = req.body || {};

        console.log("Ingredients received:", ingredients);
        console.log("Preferences received:", preferences);

        // Check ingredients
        if (!ingredients || ingredients.trim() === "") {
            return res.status(400).json({
                error: "Please provide ingredients",
            });
        }

        // Generate recipe using Groq
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",

            messages: [
                {
                    role: "system",
                    content:
                        "You are a professional chef and nutrition expert. Create healthy, practical and personalized recipes based on the ingredients and user preferences provided.",
                },

                {
                    role: "user",
                    content: `
Create a healthy and personalized recipe using the following ingredients:

${ingredients}

User Preferences:
${preferences || "No specific preferences"}

Return the answer as readable plain text.

Use exactly this format:

Recipe Name

Ingredients:
- ingredient 1
- ingredient 2
- ingredient 3

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
4. Step four

Make the recipe practical and easy to prepare.
`,
                },
            ],

            temperature: 0.7,
            max_tokens: 800,
        });

        // Get generated recipe
        const recipe =
            completion.choices?.[0]?.message?.content;

        console.log("Generated recipe:", recipe);

        // Check recipe
        if (!recipe) {
            return res.status(500).json({
                error: "Groq did not return a recipe",
            });
        }

        // Send recipe back to Framer
        return res.status(200).json({
            success: true,
            recipe: recipe,
        });

    } catch (error) {
        console.error("Groq API error:", error);

        return res.status(500).json({
            success: false,
            error:
                error?.message ||
                "AI generation failed",
        });
    }
}