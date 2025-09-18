import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const featureFlags = await prisma.featureFlag.findMany();
  return NextResponse.json(featureFlags);
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json();
  const featureFlag = await prisma.featureFlag.create({
    data: {
      key,
      value,
    },
  });
  return NextResponse.json(featureFlag);
}