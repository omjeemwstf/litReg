import { configDotenv } from "dotenv";
import { z } from "zod";

const env = process.env.NODE_ENV || 'development'; 4
configDotenv()
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
    FRONTEND_URL: z.string(),
    AI_BACKEND_URL: z.string(),
    UPLOADER_ACCESS_KEY: z.string(),
    UPLOADER_SECRET_KEY: z.string(),
    UPLOADER_REGION: z.string(),
    UPLOADER_BUCKET: z.string(),
    UPLOADER_ENDPOINT: z.string(),
    AZURE_ENDPOINT_PROTOCOL: z.string(),
    AZURE_ACCOUNT_NAME: z.string(),
    AZURE_ACCOUNT_KEY: z.string(),
    AZURE_ENDPOINT_SUFFIX: z.string()
})

const envVars = envVarsSchema.parse(process.env)

export const envConfig = {
    databaseUrl: envVars.DATABASE_URL,
    port: envVars.PORT,
    aiBackendUrl: envVars.AI_BACKEND_URL,
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
    uploader: {
        accessKey: envVars.UPLOADER_ACCESS_KEY,
        secretKey: envVars.UPLOADER_SECRET_KEY,
        region: envVars.UPLOADER_REGION,
        bucket: envVars.UPLOADER_BUCKET,
        endPoint: envVars.UPLOADER_ENDPOINT
    },
    azure : {
        endPoint: envVars.AZURE_ENDPOINT_PROTOCOL,
        accountName : envVars.AZURE_ACCOUNT_NAME,
        key : envVars.AZURE_ACCOUNT_KEY,
        suffix : envVars.AZURE_ENDPOINT_SUFFIX
    }
}

// console.log(envConfig)

