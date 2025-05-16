import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import moment from 'moment';
import jwt from "jsonwebtoken";
import { envConfig } from './envConfigs';

enum OtpVerificationMethods {
    WHATSAPP = "whatsapp",
    EMAIL = "email"
}

enum TokenTypes {
    ACCESS = 'access',
    REFRESH = 'refresh',
}

export const generateAuthTokens = (payload: { userId: any }) => {
    const accessTokenExpires = moment().add(
        36000,
        "minutes"
    );
    const accessToken = jwt.sign(JSON.stringify({
        userId: payload.userId,
        type: TokenTypes.ACCESS,
        exp: accessTokenExpires.unix() 
    }), envConfig.jwtSecret);
    return accessToken;
}

const jwtOptions = {
    secretOrKey: envConfig.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
    try {
        if (payload.type !== TokenTypes.ACCESS) {
            throw new Error('Invalid token type');
        }
        done(null, payload);
    } catch (error) {
        done(error, false);
    }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);