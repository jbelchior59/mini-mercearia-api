import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    return 'dev-only-change-me';
  }
  return secret;
}

export function getJwtOptions(): { issuer: string; audience: string } {
  return {
    issuer: process.env.JWT_ISSUER || 'secure-mini-ecommerce-api',
    audience: process.env.JWT_AUDIENCE || 'secure-mini-ecommerce-client',
  };
}

export function signAccessToken(payload: object) {
  const options: SignOptions = {
    ...getJwtOptions(),
    expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, getJwtSecret(), getJwtOptions() as VerifyOptions);
}
