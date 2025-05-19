import { configDotenv } from "dotenv";
import { z } from "zod";

const env = process.env.NODE_ENV || 'development';
// configDotenv({ path: `.env.${env}` })


export const envVarsSchema = z.object({
    DATABASE_URL: z.string(),
    PORT: z.string().transform((str) => parseInt(str, 10)),
    JWT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URL: z.string(),
    MICROSOFT_CLIENT_ID: z.string(),
    MICROSOFT_CLIENT_SECRET: z.string(),
    MICROSOFT_TENANT_ID: z.string(),
    MICROSOFT_REDIRECT_URI: z.string(),
    JWT_EXPIRES: z.string().transform((str) => parseInt(str, 10)),
    AWS_REGION: z.string(),
    AWS_ACCESS_KEY: z.string(),
    AWS_SECRET_KEY: z.string(),
    AWS_FROM_EMAIL_ADDRESS: z.string(),
    BACKEND_URL: z.string(),
    FRONTEND_URL: z.string()
})

const envVars = envVarsSchema.parse(process.env)

export const envConfig = {
    databaseUrl: envVars.DATABASE_URL,
    port: envVars.PORT,
    jwt: {
        secret: envVars.JWT_SECRET,
        expires: envVars.JWT_EXPIRES
    },
    backendUrl: envVars.BACKEND_URL,
    fontendUrl: envVars.FRONTEND_URL,
    google: {
        clientId: envVars.GOOGLE_CLIENT_ID,
        secret: envVars.GOOGLE_CLIENT_SECRET,
        redirectUrl: envVars.GOOGLE_REDIRECT_URL
    },
    microsoft: {
        clientId: envVars.MICROSOFT_CLIENT_ID,
        secret: envVars.MICROSOFT_CLIENT_SECRET,
        tenant: envVars.MICROSOFT_TENANT_ID,
        redirect: envVars.MICROSOFT_REDIRECT_URI
    },
    aws: {
        region: envVars.AWS_REGION,
        accessKey: envVars.AWS_ACCESS_KEY,
        secreyKey: envVars.AWS_SECRET_KEY,
        fromEmailAddress: envVars.AWS_FROM_EMAIL_ADDRESS
    },
}

// console.log(envConfig)

