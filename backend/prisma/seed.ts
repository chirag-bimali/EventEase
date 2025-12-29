import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.js";

import crypto from "crypto";

if (
  process.env.DATABASE_HOST === undefined ||
  process.env.DATABASE_USER === undefined ||
  process.env.DATABASE_PASSWORD === undefined ||
  process.env.DATABASE_NAME === undefined
) {
  throw new Error("Database environment variables are not set properly.");
}

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

// Hash password inline to avoid dependency on service
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

async function hashPassword(password: string, salt?: string) {
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

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Create roles
  const adminRole = await prisma.role.create({
    data: { name: "admin" },
  });
  console.log("✅ Created admin role");

  const userRole = await prisma.role.create({
    data: { name: "user" },
  });
  console.log("✅ Created user role");

  const moderatorRole = await prisma.role.create({
    data: { name: "moderator" },
  });
  console.log("✅ Created moderator role");

  // Create users with hashed passwords
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      password: `${adminPassword.salt}:${adminPassword.hash}`,
    },
  });
  console.log("✅ Created admin user");

  const userPassword = await hashPassword("user123");
  const user1 = await prisma.user.create({
    data: {
      username: "john_doe",
      password: `${userPassword.salt}:${userPassword.hash}`,
    },
  });
  console.log("✅ Created user: john_doe");

  const user2Password = await hashPassword("user456");
  const user2 = await prisma.user.create({
    data: {
      username: "jane_smith",
      password: `${user2Password.salt}:${user2Password.hash}`,
    },
  });
  console.log("✅ Created user: jane_smith");

  // Assign roles to users
  await prisma.userRole.create({
    data: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });
  console.log("✅ Assigned admin role to admin user");

  await prisma.userRole.create({
    data: {
      userId: user1.id,
      roleId: userRole.id,
    },
  });
  console.log("✅ Assigned user role to john_doe");

  await prisma.userRole.create({
    data: {
      userId: user2.id,
      roleId: userRole.id,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: user2.id,
      roleId: moderatorRole.id,
    },
  });
  console.log("✅ Assigned user and moderator roles to jane_smith");

  console.log("✨ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
