import type { Role } from "@prisma/client";

// NextAuth session augmentation
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      clientIds: string[];
    };
  }
}

export type { Role };
