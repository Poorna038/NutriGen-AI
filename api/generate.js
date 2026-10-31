import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {

    // ==============================
    // CORS
    // ==============================

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    // ==============================
    // OPTIONS REQUEST
    // ==============================

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }


    // ==============================
    // ONLY POST ALLOWED
    // ==============================

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed",
        });
    }


    try {

        // ==============================
        // GET DATA FROM FRAMER
        // ==============================

        const {
            ingredients,
            preferences
        } = req.body || {};


        console.log(
            "Ingredients:",
            ingredients
        );

        console.log(
            "Preferences:",
            preferences
        );


        // ==============================
        // CHECK INGREDIENTS
        // ==============================

        if (
            !ingredients ||
            ingredients.trim() === ""
        ) {

            return res.status(400).json({
                error:
                    "Please enter ingredients.",
            });
        }


        // ==============================
        // GROQ REQUEST
        // ==============================

        const completion =
            await groq.chat.completions.create({

                model:
                    "llama-3.3-70b-versatile",

                messages: [

                    {
                        role: "system",

                        content:
                            "You are a professional chef and nutrition expert. Create healthy, practical and personalized recipes."
                    },

                    {
                        role: "user",

                        content: `
Create a healthy recipe using these ingredients:

${ingredients}

User Preferences:

${preferences || "No specific preferences"}

Return the recipe as readable plain text.

Use this format:

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
`
                    }

                ],

                temperature: 0.7,

                max_tokens: 800,
            });


        // ==============================
        // GET RECIPE
        // ==============================

        const recipe =
            completion
                .choices?.[0]
                ?.message?.content;


        console.log(
            "Generated recipe:",
            recipe
        );


        // ==============================
        // CHECK RECIPE
        // ==============================

        if (!recipe) {

            return res.status(500).json({
                error:
                    "Groq did not return a recipe.",
            });
        }


        // ==============================
        // SEND RECIPE TO FRAMER
        // ==============================

        return res.status(200).json({

            success: true,

            recipe: recipe,

        });

    } catch (error) {

        console.error(
            "Groq API Error:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                error?.message ||
                "AI generation failed.",

        });
    }
}