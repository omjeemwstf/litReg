import AWS from 'aws-sdk';
import { envConfig } from './envConfigs';
import { v4 as uuidv4 } from "uuid";


export enum SIgnINMethod {
  MICROSOFT = "microsoft",
  GOOGLE = 'google',
  PASSWORD = 'password'
}

export const AUTH_TOKEN = "token"

export const emailTemplateForUserVerification = (email: string, name: string, verificationLink: string) => `
  <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
    <h1 style="color: #333; font-size: 24px;">Verify Your Account</h1>
    
    <p>Hello ${name},</p>
    
    <p style="font-size: 16px; color: #333;">
      Thank you for registering with us using <strong>${email}</strong>.
    </p>
    
    <p style="font-size: 16px; color: #333;">
      Please click the button below to verify your email address and activate your account.
    </p>
    
    <a href="${verificationLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Verify Account
    </a>

    <p style="font-size: 14px; color: #555; margin-top: 20px;">
      If you didn't create this account, you can safely ignore this email.
    </p>

    <div style="margin-top: 30px;">
      <img src="https://ik.imagekit.io/omjeem/signLogo.png" alt="Logo" style="width: 100px; height: 150px;">
    </div>
  </div>
`;

export const generateRandomUUId = () => {
  return uuidv4()
}

const spacesEndpoint = new AWS.Endpoint(envConfig.uploader.endPoint);

export const s3Uploader = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: envConfig.uploader.accessKey,
  secretAccessKey: envConfig.uploader.secretKey,
  region: envConfig.uploader.region,
});

