import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { displayName, bio, skills, postcode } = await req.json();

  // Geocode the postcode
  const geoRes = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${postcode}&key=${process.env.OPENCAGE_API_KEY}`
  );
  const geoData = await geoRes.json();
  const { lat, lng } = geoData.results[0].geometry;
  const { city, country_code } = geoData.results[0].components;

  // Create location
  const location = await prisma.location.create({
    data: {
      lat,
      lng,
      city,
      postcode,
      countryCode: country_code,
    },
  });

  // Update user
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName,
      bio,
      homeLocationId: location.id,
    },
  });

  // Create skills
  const skillTags = skills.split(",").map((skill: string) => skill.trim());
  await prisma.profileSkill.createMany({
    data: skillTags.map((tag: string) => ({
      userId: session.user.id,
      tag,
    })),
  });

  return NextResponse.json({ success: true });
}