import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getEmbedding } from "@/lib/openai";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { lat, lng, radiusKm, query } = await req.json();

  const queryEmbedding = await getEmbedding(query);
  const queryVector = Buffer.from(new Float32Array(queryEmbedding).buffer);

  const listings = await prisma.$queryRaw`
    SELECT l.*, loc.lat, loc.lng, (
      6371 * acos (
        cos ( radians(${lat}) )
        * cos( radians( loc.lat ) )
        * cos( radians( loc.lng ) - radians(${lng}) )
        + sin ( radians(${lat}) )
        * sin( radians( loc.lat ) )
      )
    ) AS distance, (
      1 - (e.vector <=> ${queryVector})
    ) as similarity
    FROM "Listing" l
    JOIN "Location" loc ON l."locationId" = loc."id"
    JOIN "Embedding" e ON l."id" = e."listingId"
    WHERE (
      6371 * acos (
        cos ( radians(${lat}) )
        * cos( radians( loc.lat ) )
        * cos( radians( loc.lng ) - radians(${lng}) )
        + sin ( radians(${lat}) )
        * sin( radians( loc.lat ) )
      )
    ) < ${radiusKm}
    ORDER BY similarity DESC, distance ASC
  `;

  return NextResponse.json(listings);
}