import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createReviewSchema } from "@/lib/schemas";
import { limiter } from "@/lib/rate-limiter";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  await limiter.check(req, 60, "CACHE_TOKEN"); // 60 requests per minute

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const validation = createReviewSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(validation.error.errors, { status: 400 });
  }

  const { bookingId, rating, body: reviewBody } = validation.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (
    booking.requesterId !== session.user.id &&
    booking.listing.ownerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (booking.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Booking not completed" },
      { status: 400 }
    );
  }

  const targetUserId =
    booking.requesterId === session.user.id
      ? booking.listing.ownerId
      : booking.requesterId;

  const review = await prisma.review.create({
    data: {
      bookingId,
      authorId: session.user.id,
      targetUserId,
      rating,
      body: reviewBody,
    },
  });

  return NextResponse.json(review);
}