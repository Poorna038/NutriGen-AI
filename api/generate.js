const express = require("express")
const cors = require("cors")
const Groq = require("groq-sdk")

const app = express()

// =====================================================
// CORS
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
// HOME
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
        const {
            ingredients,
            preferences,
        } = req.body || {}

        console.log("=================================")
        console.log("NutriGen AI Request")
        console.log("=================================")
        console.log("User input:", ingredients)
        console.log("Preferences:", preferences)

        // =================================================
        // CHECK EMPTY INPUT
        // =================================================

        if (
            !ingredients ||
            typeof ingredients !== "string" ||
            !ingredients.trim()
        ) {
            return res.status(400).json({
                error: "EMPTY_INPUT",
            })
        }

        const userInput = ingredients.trim()

        // =================================================
        // GROQ REQUEST
        // =================================================

        const completion =
            await groq.chat.completions.create({
                model: "openai/gpt-oss-120b",

                messages: [
                    // =================================================
                    // SYSTEM PROMPT
                    // =================================================

                    {
                        role: "system",
                        content: `
You are NutriGen AI, an intelligent food and recipe assistant.

Your job is to understand food-related input and create useful recipes.

The user may provide:

1. One or more ingredients
2. Vegetables
3. Fruits
4. Meat
5. Seafood
6. A dish name
7. A recipe name
8. A cuisine
9. A meal request
10. A dietary food request

VALID FOOD INPUT EXAMPLES:

"chicken"

"chicken tomato onion"

"potato carrot beans"

"tomato, onion, garlic"

"chicken fried rice"

"paneer butter masala"

"vegetable biryani"

"pasta"

"pizza"

"Indian breakfast"

"high protein chicken dinner"

"something healthy with vegetables"

"spicy chicken recipe"

--------------------------------------------------

INGREDIENT INPUT
--------------------------------------------------

If the user gives ingredients, create a recipe using those ingredients.

Example:

User:
"chicken, tomato, onion, garlic"

Create a recipe using those ingredients.

You may add normal supporting ingredients such as:

- oil
- salt
- pepper
- herbs
- spices
- water
- common sauces

when necessary.

--------------------------------------------------

VEGETABLE INPUT
--------------------------------------------------

If the user gives vegetables, understand them as food ingredients.

Example:

"potato, carrot, beans"

Create a suitable vegetable recipe using them.

--------------------------------------------------

DISH NAME INPUT
--------------------------------------------------

If the user gives the name of a dish, understand that they want the COMPLETE recipe for that dish.

Example:

"chicken fried rice"

DO NOT treat "chicken fried rice" as one ingredient.

Instead, create a complete Chicken Fried Rice recipe with:

- all important ingredients
- quantities
- nutrition information
- cooking instructions

Another example:

"paneer butter masala"

Create the complete Paneer Butter Masala recipe.

--------------------------------------------------

FOOD REQUEST INPUT
--------------------------------------------------

If the user gives a food-related request, understand the request and create an appropriate recipe.

Example:

"high protein dinner"

Create a high-protein dinner recipe.

Example:

"healthy vegetarian lunch"

Create a healthy vegetarian lunch recipe.

Example:

"something spicy with chicken"

Create an appropriate spicy chicken recipe.

--------------------------------------------------

INVALID INPUT
--------------------------------------------------

If the user's input is NOT related to food, DO NOT create a recipe.

Examples:

"bus"

"car"

"bike"

"laptop"

"computer"

"phone"

"table"

"chair"

"house"

"building"

"hello"

"how are you"

"javascript"

"python"

"college"

"random text"

For non-food input, return EXACTLY:

INVALID_INPUT

Do not add anything else.

--------------------------------------------------

OUTPUT FORMAT
--------------------------------------------------

For valid food input, return ONLY the recipe.

Use exactly this structure:

Recipe Name

Ingredients:
- ingredient with quantity
- ingredient with quantity
- ingredient with quantity
- ingredient with quantity
- ingredient with quantity

Nutrition Information:
Calories:
Protein:
Fat:
Carbohydrates:
Fiber:
Vitamins:

Instructions:
1. Detailed cooking step.
2. Detailed cooking step.
3. Detailed cooking step.
4. Detailed cooking step.
5. Detailed cooking step.

Make the recipe practical and complete.

If the user provides a dish name, include all important ingredients required to make that dish.

If the user provides ingredients, use those ingredients as the main ingredients.

Do not ask unnecessary questions.

Always produce a useful recipe for valid food input.
`,
                    },

                    // =================================================
                    // USER MESSAGE
                    // =================================================

                    {
                        role: "user",
                        content: `
User's food input:

${userInput}

User preferences:

${
    preferences ||
    "No specific preferences"
}

Understand the user's input according to the rules above.
`,
                    },
                ],

                temperature: 0.4,

                max_tokens: 900,
            })

        // =================================================
        // GET AI RESPONSE
        // =================================================

        const recipe =
            completion?.choices?.[0]?.message?.content?.trim()

        console.log("AI response:", recipe)

        // =================================================
        // CHECK EMPTY AI RESPONSE
        // =================================================

        if (!recipe) {
            return res.status(500).json({
                error:
                    "Groq did not return a recipe",
            })
        }

        // =================================================
        // CHECK INVALID FOOD INPUT
        // =================================================

        if (
            recipe
                .trim()
                .toUpperCase()
                .startsWith("INVALID_INPUT")
        ) {
            return res.status(400).json({
                error: "INVALID_FOOD_INPUT",
            })
        }

        // =================================================
        // SEND RECIPE
        // =================================================

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

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `NutriGen AI server running on port ${PORT}`
        )
    }
)