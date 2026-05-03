"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, requireRole } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function seedDemoDataAction() {
  await requireRole("ADMIN");

  try {
    const admin = await prisma.user.upsert({
      create: {
        email: "admin@petly.local",
        name: "Admin Petly",
        role: "ADMIN",
        username: "admin",
      },
      update: {
        role: "ADMIN",
      },
      where: {
        email: "admin@petly.local",
      },
    });

    const user = await prisma.user.upsert({
      create: {
        city: "San Jose",
        email: "sofia@petly.local",
        name: "Sofia Vargas",
        role: "USER",
        username: "sofia",
      },
      update: {},
      where: {
        email: "sofia@petly.local",
      },
    });

    const businessOwner = await prisma.user.upsert({
      create: {
        city: "Escazu",
        email: "vetcare@petly.local",
        name: "VetCare CR",
        role: "BUSINESS",
        username: "vetcare",
      },
      update: {
        role: "BUSINESS",
      },
      where: {
        email: "vetcare@petly.local",
      },
    });

    const pet = await prisma.pet.upsert({
      create: {
        id: "demo-pet-luna",
        breed: "Golden Retriever",
        city: "San Jose",
        name: "Luna",
        ownerId: user.id,
        personality: "Sociable, curiosa y muy caminadora",
        species: "DOG",
      },
      update: {},
      where: {
        id: "demo-pet-luna",
      },
    });

    const post = await prisma.post.upsert({
      create: {
        id: "demo-post-luna-route",
        authorId: user.id,
        body: "Luna descubrio una ruta nueva con sombra y espacio para correr.",
        mediaUrls: [],
        petId: pet.id,
      },
      update: {},
      where: {
        id: "demo-post-luna-route",
      },
    });

    const business = await prisma.business.upsert({
      create: {
        category: "Veterinaria",
        city: "Escazu",
        description: "Clinica veterinaria enfocada en bienestar preventivo.",
        name: "VetCare CR",
        ownerId: businessOwner.id,
        slug: "vetcare-cr",
        verified: true,
      },
      update: {
        verified: true,
      },
      where: {
        slug: "vetcare-cr",
      },
    });

    const campaign = await prisma.campaign.upsert({
      create: {
        id: "demo-campaign-vetcare",
        budgetCents: 45000,
        businessId: business.id,
        name: "Chequeo preventivo 2026",
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
      },
      where: {
        id: "demo-campaign-vetcare",
      },
    });

    const ad = await prisma.ad.upsert({
      create: {
        id: "demo-ad-vetcare-feed",
        body: "Agenda un chequeo preventivo para tu mascota esta semana.",
        campaignId: campaign.id,
        moderationStatus: "APPROVED",
        placement: "FEED_NATIVE",
        targetUrl: "https://example.com/vetcare",
        title: "Chequeo preventivo VetCare",
      },
      update: {
        moderationStatus: "APPROVED",
      },
      where: {
        id: "demo-ad-vetcare-feed",
      },
    });

    await prisma.comment.upsert({
      create: {
        id: "demo-comment-admin",
        authorId: admin.id,
        body: "Contenido revisado y aprobado para demo.",
        postId: post.id,
      },
      update: {},
      where: {
        id: "demo-comment-admin",
      },
    });

    const existingImpressions = await prisma.adImpression.count({
      where: {
        adId: ad.id,
      },
    });

    if (existingImpressions === 0) {
      await prisma.adImpression.createMany({
        data: Array.from({ length: 120 }, () => ({
          adId: ad.id,
          placement: "FEED_NATIVE",
        })),
      });
    }

    const existingClicks = await prisma.adClick.count({
      where: {
        adId: ad.id,
      },
    });

    if (existingClicks === 0) {
      await prisma.adClick.createMany({
        data: Array.from({ length: 9 }, () => ({
          adId: ad.id,
        })),
      });
    }

    revalidatePath("/admin");
  } catch (error) {
    console.error("Unable to seed demo data", error);
    redirect("/admin?seed=fallback");
  }

  redirect("/admin?seed=success");
}
