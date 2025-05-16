import { envConfig } from "./src/config/envConfigs"

export default ({
    dialect: "postgresql",
    schema: "./src/models/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: envConfig.databaseUrl
    },
});