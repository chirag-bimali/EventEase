import crypto from 'crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string, salt?: string) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  return new Promise<{ hash: string; salt: string }>((resolve, reject) => {
    crypto.scrypt(password, actualSalt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({ hash: derivedKey.toString('hex'), salt: actualSalt });
    });
  });
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const result = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(result.hash, 'hex'), Buffer.from(hash, 'hex'));
}
