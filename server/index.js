import express from "express";           // web server framework
import dotenv from "dotenv";             // read .env file
import cors from "cors";                 // allow frontend to connect
import connectDB from "./src/config/db.js";          // connect to mongodb
import authRoutes from "./src/routes/authRoutes.js";         // auth routes
import emergencyRoutes from "./src/routes/emergencyRoutes.js"; // emergency routes
import fundRoutes from "./src/routes/fundRoutes.js";         // fund routes
import adminRoutes from "./src/routes/adminRoutes.js";       // admin routes

dotenv.config();       // activate .env
connectDB();           // connect to database

const app = express(); // create express app
app.use(cors());        // enable cors
app.use(express.json()); // read json from requests

// register all routes
app.use("/api/auth", authRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/fund", fundRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SERVER STARTED on port ${PORT} 🚀`)); // start server