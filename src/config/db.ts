import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "../models/schema";
import logger from "./logger";
import { envConfig } from "./envConfigs";

export const client = new Client(envConfig.databaseUrl);

client
.connect()
.then(() => {
    logger.info(`Database connected successfully`);
})
.catch((err) => {
    logger.error(`Error connecting to database: ${err}`);
});

const postgreDb = drizzle(client, { schema: { ...schema } });

export default postgreDb;
