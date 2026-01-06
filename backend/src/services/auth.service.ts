import crypto, { hash } from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/primsa.ts";
import type { User } from "../generated/prisma/client.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("Environment variable JWT_SECRET is not set.");

const secret: string = JWT_SECRET;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string, salt?: string) {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  return new Promise<{ hash: string; salt: string }>((resolve, reject) => {
    crypto.scrypt(
      password,
      actualSalt,
      KEYLEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve({ hash: derivedKey.toString("hex"), salt: actualSalt });
      }
    );
  });
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
) {
  const result = await hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(result.hash, "hex"),
    Buffer.from(hash, "hex")
  );
}
export function generateJWT(userId: number, roleId: number) {
  return jwt.sign({ userId, roleId }, secret, { expiresIn: "7d" });
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, secret) as {
      userId: number;
      iat: number;
      exp: number;
    };
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string) {
  const payload = verifyJWT(token);
  if (!payload) return null;

  const userId = payload.userId;

  const user = await prisma.$queryRaw<User[]>`
    SELECT * FROM "User"
    WHERE id = ${userId}
  `
  
  return user[0] || null;
}
