import express from "express"
import cors from "cors"
import aiRoutes from "./routes/ai"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api", aiRoutes)

app.listen(5000, () => {
  console.log("Server running on port 5000")
})