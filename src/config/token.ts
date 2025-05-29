import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from "jsonwebtoken";
import { envConfig } from './envConfigs';


enum TokenTypes {
    ACCESS = 'access',
    REFRESH = 'refresh',
}

export const generateAuthTokens = (payload: { userId: string }) => {
    const jwtPayLoad = {
        userId: payload.userId,
        type: TokenTypes.ACCESS,
    }
    console.log(jwtPayLoad)
    const accessToken = jwt.sign(
        jwtPayLoad,
        envConfig.jwt.secret,
        {
            expiresIn: `${envConfig.jwt.expires}d`
        });
    return accessToken;
}

const jwtOptions = {
    secretOrKey: envConfig.jwt.secret,
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

export const verifyTokenAndGetPayload = (
    token: string,
    allowExpiredToken = false
): { valid: boolean; payload?: any; error?: string } => {
    try {
        const options = allowExpiredToken ? { ignoreExpiration: true } : {};
        const decoded = jwt.verify(token, envConfig.jwt.secret, options);
        return { valid: true, payload: decoded };
    } catch (err: any) {
        console.log("Error in verifying ", err)
        return {
            valid: false,
            error: err.message,
        };
    }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);