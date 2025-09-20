import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const listing = await prisma.listing.findUnique({
    where: {
      id: params.id,
    },
  });

  return NextResponse.json(listing);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const {
    kind,
    title,
    description,
    categories,
    priceType,
    cashPrice,
    creditPrice,
    preferredMeet,
    locationId,
    images,
    visibility,
    status,
  } = await req.json();

  const listing = await prisma.listing.update({
    where: {
      id: params.id,
      ownerId: session.user.id,
    },
    data: {
      kind,
      title,
      description,
      categories,
      priceType,
      cashPrice,
      creditPrice,
      preferredMeet,
      locationId,
      images,
      visibility,
      status,
    },
  });

  return NextResponse.json(listing);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.listing.delete({
    where: {
      id: params.id,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
