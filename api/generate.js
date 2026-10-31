const Groq = require("groq-sdk")

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    // Handle browser preflight
    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    // Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed",
        })
    }

    try {
        const { ingredients, preferences } = req.body || {}

        if (!ingredients || !ingredients.trim()) {
            return res.status(400).json({
                error: "Ingredients are required",
            })
        }

        console.log("Ingredients:", ingredients)
        console.log("Preferences:", preferences)

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",

            messages: [
                {
                    role: "system",
                    content:
                        "You are a professional chef and nutrition expert who creates personalized recipes.",
                },
                {
                    role: "user",
                    content: `
Create a healthy and delicious recipe using these ingredients:

${ingredients}

User preferences:

${preferences || "No specific preferences"}

Return the answer as readable text.

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
`,
                },
            ],

            temperature: 0.7,
            max_tokens: 600,
        })

        const recipe = completion?.choices?.[0]?.message?.content

        if (!recipe) {
            throw new Error("Groq did not return a recipe")
        }

        console.log("Recipe generated successfully")

        return res.status(200).json({
            recipe: recipe,
        })
    } catch (error) {
        console.error("Groq API Error:", error)

        return res.status(500).json({
            error: error?.message || "AI generation failed",
        })
    }
}const express = require("express")
const cors = require("cors")
const Groq = require("groq-sdk")

const app = express()

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
)

app.use(express.json())

// =====================================================
// GROQ
// =====================================================

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "NutriGen AI backend is running",
    })
})

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
    })
})

// =====================================================
// GENERATE RECIPE
// =====================================================

app.post("/api/generate", async (req, res) => {
    try {
        const { ingredients, preferences } =
            req.body || {}

        console.log(
            "Ingredients:",
            ingredients
        )

        console.log(
            "Preferences:",
            preferences
        )

        // Check ingredients
        if (
            !ingredients ||
            !ingredients.trim()
        ) {
            return res.status(400).json({
                error:
                    "Ingredients are required",
            })
        }

        // Call Groq
        const completion =
            await groq.chat.completions.create({
                model:
                    "llama-3.3-70b-versatile",

                messages: [
                    {
                        role: "system",
                        content:
                            "You are a professional chef and nutrition expert who creates personalized healthy recipes.",
                    },
                    {
                        role: "user",
                        content: `
Create a healthy and delicious recipe using these ingredients:

${ingredients}

User preferences:

${
    preferences ||
    "No specific preferences"
}

Return readable text.

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
`,
                    },
                ],

                temperature: 0.7,
                max_tokens: 600,
            })

        // Get recipe
        const recipe =
            completion?.choices?.[0]?.message
                ?.content

        console.log(
            "Recipe generated:",
            recipe
        )

        if (!recipe) {
            return res.status(500).json({
                error:
                    "Groq did not return a recipe",
            })
        }

        // Send recipe to Framer
        return res.status(200).json({
            recipe: recipe,
        })
    } catch (error) {
        console.error(
            "Groq API Error:",
            error
        )

        return res.status(500).json({
            error:
                error?.message ||
                "AI generation failed",
        })
    }
})

// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT || 10000

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `NutriGen AI server running on port ${PORT}`
    )
})