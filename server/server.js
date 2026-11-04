import mongoose from "mongoose";
import app from "./app.js";
import { seedProjectTemplates } from "./utils/seedTemplates.js";

const port = process.env.PORT || 8000;

try {
  await mongoose.connect(process.env.DATABASE, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });
  console.log("Database connected");
  await seedProjectTemplates();
} catch (err) {
  console.error("Database connection error:", err.message);
  console.error("Check the DATABASE connection string in server/.env");
  process.exit(1);
}

const server = app.listen(port, () => console.log(`Server is running on port ${port}`));

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => mongoose.connection.close().then(() => process.exit(0)));
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
