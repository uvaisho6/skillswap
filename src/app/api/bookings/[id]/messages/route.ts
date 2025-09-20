import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { moderateText } from "@/lib/openai";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: {
      id: context.params.id,
    },
    include: {
      listing: true,
    },
  });

  if (
    booking?.requesterId !== session.user.id &&
    booking?.listing.ownerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: {
      bookingId: context.params.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { body } = await req.json();

  // Moderate message
  const moderation = await moderateText(body);
  if (moderation.flagged) {
    return NextResponse.json({ error: "Inappropriate content" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      bookingId: context.params.id,
      senderId: session.user.id,
      body,
    },
  });

  return NextResponse.json(message);
}
