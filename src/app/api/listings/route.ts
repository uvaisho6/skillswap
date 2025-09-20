import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { moderateText, getEmbedding } from "@/lib/openai";
import { createListingSchema } from "@/lib/schemas";
import { limiter } from "@/lib/rate-limiter";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  await limiter.check(req, 60, "CACHE_TOKEN"); // 60 requests per minute

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const validation = createListingSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(validation.error.errors, { status: 400 });
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
  } = validation.data;

  // Moderate text
  const moderation = await moderateText(`${title} ${description}`);
  if (moderation.flagged) {
    return NextResponse.json({ error: "Inappropriate content" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      ownerId: session.user.id,
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
    },
  });

  // Get embedding
  const embedding = await getEmbedding(`${title} ${description}`);
  await prisma.embedding.create({
    data: {
      listingId: listing.id,
      kind: "LISTING",
      vector: Buffer.from(new Float32Array(embedding).buffer),
      model: "text-embedding-3-large",
    },
  });

  return NextResponse.json(listing);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    where: {
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(listings);
}