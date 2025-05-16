import express from "express";
import cors from "cors"
import passport from "passport";
import { jwtStrategy } from "./config/token";
import logger from "./config/logger";
import { envConfig } from "./config/envConfigs";
import router from "./router";
import postgreDb from "./config/db";

const app = express();
// postgreDb;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: "*" }));
passport.use('jwt', jwtStrategy);

app.use("/", router);


app.listen(envConfig.port, () => {
    logger.info(`Server started on ${envConfig.port}`);
});
