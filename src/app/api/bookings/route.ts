import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { listingId, meetType, scheduledStart, scheduledEnd } =
    await req.json();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Handle credit transaction for barter listings
  if (listing.priceType === "BARTER" || listing.priceType === "BOTH") {
    const wallet = await prisma.wallet.findFirst({
      where: { userId: session.user.id },
    });

    if (!wallet || wallet.balance < (listing.creditPrice || 0)) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    // Hold credits
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: listing.creditPrice || 0 } },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "SPEND",
        amount: listing.creditPrice || 0,
        bookingId: "", // Will be updated after booking is created
        reason: `Booking for listing: ${listing.title}`,
      },
    });
  }

  const booking = await prisma.booking.create({
    data: {
      listingId,
      requesterId: session.user.id,
      meetType,
      scheduledStart,
      scheduledEnd,
    },
  });

  // Update transaction with booking id
  if (listing.priceType === "BARTER" || listing.priceType === "BOTH") {
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        wallet: { userId: session.user.id },
        bookingId: "",
      },
    });
    if (transaction) {
      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { bookingId: booking.id },
      });
    }
  }

  return NextResponse.json(booking);
}
