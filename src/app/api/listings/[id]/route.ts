import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(req: NextRequest, context: RouteContext) {
  const listing = await prisma.listing.findUnique({
    where: {
      id: context.params.id,
    },
  });

  return NextResponse.json(listing);
}

export async function PUT(req: NextRequest, context: RouteContext) {
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
      id: context.params.id,
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

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.listing.delete({
    where: {
      id: context.params.id,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
