import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface tokenPayload {
    userId: string;
    email: string;
    role: string;
}

function generateAccessToken(payload: tokenPayload): string {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' });
} 


function verifyAccessToken(token: string): tokenPayload {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as tokenPayload;
}

function generateRefreshToken(payload: tokenPayload): string {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '7d' });
}

function verifyRefreshToken(token: string): tokenPayload {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as tokenPayload;
}


//passwords logic


export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  userPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, userPassword);
};


export { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken };

