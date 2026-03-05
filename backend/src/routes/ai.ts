import { Router } from "express"
import Groq from "groq-sdk"

const router = Router()

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

router.post("/generate", async (req, res) => {

  try {

    const { ingredients } = req.body

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `
Generate a recipe using these ingredients: ${ingredients}.

Return ONLY JSON in this format:

{
 "name": "Recipe name",
 "ingredients": ["ingredient1","ingredient2"],
 "steps": ["step1","step2","step3"],
 "calories": "approx calories",
 "protein": "protein grams",
 "carbs": "carbs grams",
 "fat": "fat grams",
 "cook_time": "minutes"
}
`
        }
      ]
    })

    const recipe = completion.choices[0].message.content

    res.json({
      recipe
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "AI generation failed"
    })

  }

})

export default router