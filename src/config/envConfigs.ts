import { configDotenv } from "dotenv";
import { z } from "zod";

const env = process.env.NODE_ENV || 'development';
configDotenv({ path: `.env.${env}` })


export const envVarsSchema = z.object({
    DATABASE_URL: z.string(),
    PORT: z.string().transform((str) => parseInt(str, 10)),
    JWT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URL: z.string()
})

const envVars = envVarsSchema.parse(process.env)

export const envConfig = {
    databaseUrl: envVars.DATABASE_URL,
    port: envVars.PORT,
    jwtSecret: envVars.JWT_SECRET,
    google : {
        clientId : envVars.GOOGLE_CLIENT_ID,
        secret : envVars.GOOGLE_CLIENT_SECRET,
        redirectUrl : envVars.GOOGLE_REDIRECT_URL
    }
}

