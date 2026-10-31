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
        // VALIDATE INPUT
        // =================================================

        if (
            !ingredients ||
            typeof ingredients !== "string" ||
            !ingredients.trim()
        ) {
            return res.status(400).json({
                error:
                    "Please enter a food item, ingredient, dish, or recipe request.",
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
                    // SYSTEM
                    // =================================================

                    {
                        role: "system",
                        content: `
You are NutriGen AI, an intelligent food and recipe assistant.

Your job is to understand ANY reasonable food-related input from the user.

The user may provide:

1. One or more ingredients
2. Vegetables
3. Fruits
4. Meat or seafood
5. A dish name
6. A complete recipe name
7. A cuisine
8. A food-related request
9. A meal request
10. A dietary or nutrition-related food request

Examples of valid input:

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

IMPORTANT RULE:

You must determine whether the user's input is related to FOOD.

If the input is related to food, generate an appropriate recipe.

If the user gives a DISH NAME, do NOT treat the dish name as an ingredient.

For example:

User:
"Chicken Fried Rice"

You should understand that the user wants a complete Chicken Fried Rice recipe.

You must automatically provide the necessary ingredients, quantities, nutrition information, and cooking steps.

If the user gives INGREDIENTS, use those ingredients to create an appropriate recipe.

For example:

User:
"chicken, tomato, onion, garlic"

Create a recipe using those ingredients.

You may add normal supporting ingredients such as:
- cooking oil
- salt
- pepper
- herbs
- spices
- water
- common sauces

when they are necessary for the recipe.

If the user gives VEGETABLES, understand them as food ingredients.

For example:

"potato, carrot, beans"

should produce a vegetable-based recipe.

If the user gives a FOOD REQUEST, understand the request and create an appropriate recipe.

For example:

"high protein dinner"

should produce a high-protein dinner.

"healthy vegetarian lunch"

should produce a healthy vegetarian lunch.

"something spicy with chicken"

should produce a spicy chicken recipe.

--------------------------------------------------

VERY IMPORTANT INVALID INPUT RULE:

If the user's input is NOT related to food, DO NOT create a recipe.

Examples of invalid input:

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
"random text"
"javascript"
"python"
"college"

For invalid input, return EXACTLY:

INVALID_INPUT

Do not add anything else.

If the input contains both food and unrelated words, determine whether the main request is actually food-related.

If it clearly asks for a food recipe, process it.

If it is clearly unrelated to food, return:

INVALID_INPUT

--------------------------------------------------

OUTPUT FORMAT FOR VALID FOOD INPUT:

Return ONLY the recipe using this exact structure:

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

If the user provides a dish name, include ALL important ingredients required to make that dish.

If the user provides ingredients, use those ingredients as the main ingredients.

Do not say that you cannot cook.

Do not ask unnecessary questions.

Always produce a useful recipe for valid food input.
`,
                    },

                    // =================================================
                    // USER
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
        // CHECK EMPTY RESPONSE
        // =================================================

        if (!recipe) {
            return res.status(500).json({
                error:
                    "Groq did not return a recipe",
            })
        }

        // =================================================
        // CHECK INVALID INPUT
        // =================================================

        if (
            recipe
                .trim()
                .toUpperCase()
                .startsWith("INVALID_INPUT")
        ) {
            return res.status(400).json({
                error:
                    "Please enter a food item, ingredient, vegetable, dish, or recipe request.",
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