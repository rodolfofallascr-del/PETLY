"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PetSpecies } from "@prisma/client";
import { requireRole } from "@/src/lib/auth";
import { analyzeContentModeration, formatModerationDetails } from "@/src/lib/content-moderation";
import { ensurePetlyUser } from "@/src/lib/user-dashboard";
import { prisma } from "@/src/lib/prisma";

const validSpecies = new Set<PetSpecies>(["DOG", "CAT", "RABBIT", "BIRD", "REPTILE", "OTHER"]);

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function getSystemModerator() {
  return prisma.user.upsert({
    create: {
      email: "system@petly.local",
      name: "Sistema Petly",
      role: "ADMIN",
      username: "system-moderator",
    },
    update: {
      role: "ADMIN",
    },
    where: {
      email: "system@petly.local",
    },
  });
}

export async function createPetAction(formData: FormData) {
  const session = await requireRole("USER", "/app");
  const name = requiredString(formData, "name");
  const species = requiredString(formData, "species") as PetSpecies;

  if (!name || !validSpecies.has(species)) {
    redirect("/app?pet=missing");
  }

  try {
    const user = await ensurePetlyUser(session);

    await prisma.pet.create({
      data: {
        bio: requiredString(formData, "bio") || null,
        breed: requiredString(formData, "breed") || null,
        city: requiredString(formData, "city") || null,
        name,
        ownerId: user.id,
        personality: requiredString(formData, "personality") || null,
        species,
      },
    });

    revalidatePath("/app");
  } catch (error) {
    console.error("Unable to create pet", error);
    redirect("/app?pet=error");
  }

  redirect("/app?pet=created");
}

export async function createPostAction(formData: FormData) {
  const session = await requireRole("USER", "/app");
  const body = requiredString(formData, "body");
  const petId = requiredString(formData, "petId");

  if (!body) {
    redirect("/app?post=missing");
  }

  try {
    const user = await ensurePetlyUser(session);
    const selectedPet = petId
      ? await prisma.pet.findFirst({
          where: {
            id: petId,
            ownerId: user.id,
          },
          select: {
            id: true,
          },
        })
      : null;
    const moderation = analyzeContentModeration(body);
    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        body,
        mediaUrls: [],
        moderationStatus: moderation.status,
        petId: selectedPet?.id,
      },
    });

    if (moderation.status !== "APPROVED") {
      const systemModerator = await getSystemModerator();

      await prisma.report.create({
        data: {
          details: formatModerationDetails(moderation),
          postId: post.id,
          reason: `Auto: ${moderation.primaryReason}`,
          reportedUserId: user.id,
          reporterId: systemModerator.id,
          status: "PENDING",
        },
      });
    }

    revalidatePath("/app");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Unable to create post", error);
    redirect("/app?post=error");
  }

  redirect("/app?post=created");
}
