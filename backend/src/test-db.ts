import prisma from "./utils/prisma";

async function main() {
  try {
    console.log("Attempting to connect to database...");
    const userCount = await prisma.user.count();
    console.log(`Success! Current user count: ${userCount}`);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
