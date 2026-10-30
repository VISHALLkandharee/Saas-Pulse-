import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface tokenPayload {
    userId: string;
    email: string;
    role: string;
}

interface socketTicketPayload {
    userId: string;
    scope: "socket";
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

function generateSocketTicket(userId: string): string {
    return jwt.sign(
        { userId, scope: "socket" },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "60s", audience: "saas-pulse-socket", issuer: "saas-pulse" },
    );
}

function verifySocketTicket(token: string): socketTicketPayload {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, {
        audience: "saas-pulse-socket",
        issuer: "saas-pulse",
    }) as socketTicketPayload;
    if (payload.scope !== "socket" || !payload.userId) {
        throw new Error("Invalid socket ticket");
    }
    return payload;
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


export {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateSocketTicket,
  verifySocketTicket,
};

