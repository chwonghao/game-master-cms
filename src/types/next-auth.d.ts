import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types/game";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role?: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
