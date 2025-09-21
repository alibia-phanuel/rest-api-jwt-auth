// src/index.ts
import express from "express";
import homeRoutes from "./routes/home.route";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import roleRoutes from "./routes/role.routes";
const app = express();
app.use(express.json());
app.use("/", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", roleRoutes); // ⚡ routes /admin et /moderator
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
