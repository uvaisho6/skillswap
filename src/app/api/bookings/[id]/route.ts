import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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
      listing: {
        include: {
          owner: true,
        },
      },
      requester: true,
    },
  });

  if (
    booking?.requesterId !== session.user.id &&
    booking?.listing.ownerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json(booking);
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { status } = await req.json();

  const booking = await prisma.booking.findUnique({
    where: { id: context.params.id },
    include: { listing: true },
  });

  if (booking?.listing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const updatedBooking = await prisma.booking.update({
    where: {
      id: context.params.id,
    },
    data: {
      status,
    },
  });

  // Handle credit refund on cancellation
  if (
    booking &&
    status === "CANCELLED" &&
    (booking.listing.priceType === "BARTER" ||
      booking.listing.priceType === "BOTH")
  ) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId: booking.requesterId },
    });
    if (wallet) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: booking.listing.creditPrice || 0 } },
      });
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount: booking.listing.creditPrice || 0,
          bookingId: booking.id,
          reason: `Cancelled booking for listing: ${booking.listing.title}`,
        },
      });
    }
  }

  return NextResponse.json(updatedBooking);
}
