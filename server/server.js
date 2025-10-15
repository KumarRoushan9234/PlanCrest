import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import mongoose from "mongoose";
import csrf from "csurf";
import cookieParser from "cookie-parser";

// Load environment variables
dotenv.config();

const csrfProtection = csrf({ cookie: true });

// Create express app
const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {})
  .then(() => console.log("**DB CONNECTED**"))
  .catch((err) => console.error("DB CONNECTION ERR =>", err));

// Apply middlewares

// app.use(
//   cors({
//     origin: ["https://www.devstream.org", "https://devstreammain.vercel.app"],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: true, // Reflect the request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Dynamically import and set up routes
const routeFiles = readdirSync("./routes");
for (const routeFile of routeFiles) {
  const route = await import(`./routes/${routeFile}`);
  app.use("/api", route.default);
}

app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Port
const port = process.env.PORT || 8000;

// Start server
app.listen(port, () => console.log(`Server is running on port ${port}`));
