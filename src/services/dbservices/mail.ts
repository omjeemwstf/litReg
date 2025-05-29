import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { envConfig } from "../../config/envConfigs";

const sesClient = new SESv2Client({
    region: envConfig.aws.region,
    credentials: {
        accessKeyId: envConfig.aws.accessKey,
        secretAccessKey: envConfig.aws.secreyKey,
    },
});


export class mail {

    static async sendEmailWithSEC(toEmails: string[], emailTemplate: string, subject: string) {
        try {
            const params = {
                FromEmailAddress: envConfig.aws.fromEmailAddress,
                Destination: {
                    ToAddresses: toEmails,
                },
                Content: {
                    Simple: {
                        Subject: {
                            Data: subject,
                        },
                        Body: {
                            Html: {
                                Data: emailTemplate,
                            },
                        },
                    },
                },
            };

            const command = new SendEmailCommand(params);
            const response = await sesClient.send(command);

            return response;
        } catch (error) {
            console.error("Failed to send email:", error);
            throw error;
        }
    }

};