import { NextResponse } from "next/server";
import type { PetSpecies } from "@prisma/client";
import { requireMobileSession } from "@/src/lib/mobile-api-auth";
import { ensurePetlyUser } from "@/src/lib/user-dashboard";
import { prisma } from "@/src/lib/prisma";

const validSpecies = new Set<PetSpecies>(["DOG", "CAT", "RABBIT", "BIRD", "REPTILE", "OTHER"]);

export async function POST(request: Request) {
  const { response, session } = requireMobileSession(request);

  if (response || !session) {
    return response;
  }

  if (session.role !== "USER") {
    return NextResponse.json({ error: "Only users can create pets" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const species = String(body?.species ?? "OTHER").trim() as PetSpecies;

  if (!name || !validSpecies.has(species)) {
    return NextResponse.json({ error: "Name and valid species are required" }, { status: 400 });
  }

  try {
    const user = await ensurePetlyUser(session);
    const pet = await prisma.pet.create({
      data: {
        bio: String(body?.bio ?? "").trim() || null,
        breed: String(body?.breed ?? "").trim() || null,
        city: String(body?.city ?? "").trim() || null,
        name,
        ownerId: user.id,
        personality: String(body?.personality ?? "").trim() || null,
        species,
      },
    });

    return NextResponse.json({ pet });
  } catch (error) {
    console.error("Mobile pet creation failed", error);
    return NextResponse.json({ error: "Unable to create pet" }, { status: 500 });
  }
}
