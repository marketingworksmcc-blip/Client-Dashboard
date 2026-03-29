import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Hash helper ─────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ─── Revel Team Users ────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@revel.agency" },
    update: {},
    create: {
      email: "superadmin@revel.agency",
      name: "Alex Rivera",
      passwordHash: await hash("revel-super-2024"),
      role: "SUPER_ADMIN",
    },
  });

  const revelAdmin = await prisma.user.upsert({
    where: { email: "admin@revel.agency" },
    update: {},
    create: {
      email: "admin@revel.agency",
      name: "Jordan Marsh",
      passwordHash: await hash("revel-admin-2024"),
      role: "REVEL_ADMIN",
    },
  });

  const revelTeam = await prisma.user.upsert({
    where: { email: "team@revel.agency" },
    update: {},
    create: {
      email: "team@revel.agency",
      name: "Sam Chen",
      passwordHash: await hash("revel-team-2024"),
      role: "REVEL_TEAM",
    },
  });

  console.log("✓ Revel team users created");

  // ─── Demo Clients ─────────────────────────────────────────────
  const clientAcme = await prisma.client.upsert({
    where: { slug: "acme-co" },
    update: {},
    create: {
      name: "Acme Co",
      slug: "acme-co",
      brandSettings: {
        create: {
          portalName: "Acme Co Portal",
          portalSubtitle: "Powered by Revel",
          primaryColor: "#d3de2c",
          secondaryColor: "#263a2e",
        },
      },
    },
  });

  const clientBlue = await prisma.client.upsert({
    where: { slug: "blue-harbor" },
    update: {},
    create: {
      name: "Blue Harbor",
      slug: "blue-harbor",
      brandSettings: {
        create: {
          portalName: "Blue Harbor",
          portalSubtitle: "Creative Partnership",
          primaryColor: "#3b82f6",
          secondaryColor: "#1e3a5f",
        },
      },
    },
  });

  console.log("✓ Demo clients created");

  // ─── Client Users ─────────────────────────────────────────────
  const clientAdmin1 = await prisma.user.upsert({
    where: { email: "admin@acmeco.com" },
    update: {},
    create: {
      email: "admin@acmeco.com",
      name: "Morgan Lee",
      passwordHash: await hash("client-admin-2024"),
      role: "CLIENT_ADMIN",
      clientUsers: {
        create: { clientId: clientAcme.id, isPrimary: true },
      },
    },
  });

  const clientUser1 = await prisma.user.upsert({
    where: { email: "user@acmeco.com" },
    update: {},
    create: {
      email: "user@acmeco.com",
      name: "Taylor Brooks",
      passwordHash: await hash("client-user-2024"),
      role: "CLIENT_USER",
      clientUsers: {
        create: { clientId: clientAcme.id, isPrimary: true },
      },
    },
  });

  const clientAdmin2 = await prisma.user.upsert({
    where: { email: "admin@blueharbor.com" },
    update: {},
    create: {
      email: "admin@blueharbor.com",
      name: "Casey Park",
      passwordHash: await hash("client-admin-2024"),
      role: "CLIENT_ADMIN",
      clientUsers: {
        create: { clientId: clientBlue.id, isPrimary: true },
      },
    },
  });

  console.log("✓ Client users created");
  console.log("\n✅ Seed complete!\n");

  console.log("─── Login Credentials ───────────────────────────");
  console.log("REVEL TEAM:");
  console.log("  Super Admin  →  superadmin@revel.agency  /  revel-super-2024");
  console.log("  Revel Admin  →  admin@revel.agency        /  revel-admin-2024");
  console.log("  Team Member  →  team@revel.agency         /  revel-team-2024");
  console.log("\nCLIENT PORTAL:");
  console.log("  Acme Admin   →  admin@acmeco.com          /  client-admin-2024");
  console.log("  Acme User    →  user@acmeco.com           /  client-user-2024");
  console.log("  Blue Harbor  →  admin@blueharbor.com      /  client-admin-2024");
  console.log("─────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
