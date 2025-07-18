const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { email: "admin@store.com" },
  });

  if (!adminExists) {
    const hashed = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@store.com",
        password: hashed,
        role: "ADMIN",
      },
    });
    console.log("✅ Admin seeded");
  } else {
    console.log("ℹ️ Admin already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
