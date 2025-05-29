import express from "express";
import cors from "cors";
import passport from "passport";
import { jwtStrategy } from "./config/token";
import logger from "./config/logger";
import { envConfig } from "./config/envConfigs";
import router from "./router";
import cookieParser from "cookie-parser";
import http from "http"; // Import http module

const app = express();

// CORS setup
app.use(cors({
    origin: ["http://localhost:5173", "https://lit-reg.vercel.app", "http://localhost:3000"],
    credentials: true,
    exposedHeaders: ['Set-Cookie']
}));

app.use(cookieParser());
app.use(express.json({ limit: '500mb' })); // Make sure JSON limit is high too
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Passport JWT strategy
passport.use('jwt', jwtStrategy);

// Routes
app.use("/", router);

// Create HTTP server and set 10-minute timeout
const server = http.createServer(app);
server.setTimeout(600000); // 10 minutes

server.listen(envConfig.port, () => {
    logger.info(`Server started on port ${envConfig.port} with 10-minute timeout`);
});
