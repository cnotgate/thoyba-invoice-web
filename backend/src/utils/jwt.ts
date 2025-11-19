import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function generateToken(payload: { id: number; username: string; role: string }) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setExpirationTime('24h')
		.setIssuedAt()
		.sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return payload as { id: number; username: string; role: string };
	} catch (error) {
		return null;
	}
}
