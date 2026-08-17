import { app } from "./app.js";
import { initDb } from "./models/index.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initDb();
    console.log("Database synchronized successfully.");
    app.listen(PORT, () => {
      console.log(`Staff Side Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
