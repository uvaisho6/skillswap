import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let wallet = await prisma.wallet.findFirst({
    where: {
      userId: session.user.id as string,
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: session.user.id,
        balance: 10,
      },
    });
  }

  return NextResponse.json(wallet);
}