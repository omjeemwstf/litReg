import express from "express";
import cors from "cors"
import passport from "passport";
import { jwtStrategy } from "./config/token";
import logger from "./config/logger";
import { envConfig } from "./config/envConfigs";
import router from "./router";
import cookieParser from "cookie-parser"

const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const corsOptions = {
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
    // exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

passport.use('jwt', jwtStrategy);

app.use("/", router);


app.listen(envConfig.port, () => {
    logger.info(`Server started on ${envConfig.port}`);
});
