import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding features...");

  // Create the admin feature
  const adminFeature = await prisma.feature.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Administrative access to the admin panel",
    },
  });

  console.log("✅ Admin feature created:", adminFeature);

  // Create some other example features
  const features = [
    {
      name: "google-calendar",
      description: "Access to Google Calendar",
    },
  ];

  for (const feature of features) {
    const createdFeature = await prisma.feature.upsert({
      where: { name: feature.name },
      update: {},
      create: feature,
    });
    console.log("✅ Feature created:", createdFeature.name);
  }

  const jasonHedman = await prisma.user.findFirst({
    where: {
      email: "jason@hedmans.org",
    },
  });

  if (jasonHedman) {
    await prisma.userFeature.upsert({
      where: {
        userId_featureId: {
          userId: jasonHedman.id,
          featureId: adminFeature.id,
        },
      },
      update: {},
      create: {
        userId: jasonHedman.id,
        featureId: adminFeature.id,
      },
    });
    console.log("✅ Admin access granted to first user:", jasonHedman.email);
  } else {
    console.log(
      "⚠️  No users found. Create a user first, then run this seed again to grant admin access.",
    );
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
