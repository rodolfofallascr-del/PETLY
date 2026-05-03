"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureBusinessUser } from "@/src/lib/business-dashboard";
import { requireRole } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 54);
}

function requiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveBusinessProfileAction(formData: FormData) {
  const session = await requireRole("BUSINESS", "/business");
  const name = requiredString(formData, "name");
  const category = requiredString(formData, "category");

  if (!name || !category) {
    redirect("/business?profile=missing");
  }

  try {
    const user = await ensureBusinessUser(session);
    const existingBusiness = await prisma.business.findFirst({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        slug: true,
      },
    });
    const baseSlug = slugify(name) || `empresa-${user.id.slice(0, 8)}`;

    await prisma.business.upsert({
      create: {
        category,
        city: requiredString(formData, "city") || null,
        description: requiredString(formData, "description") || null,
        name,
        ownerId: user.id,
        phone: requiredString(formData, "phone") || null,
        slug: `${baseSlug}-${user.id.slice(0, 6)}`,
        website: requiredString(formData, "website") || null,
      },
      update: {
        category,
        city: requiredString(formData, "city") || null,
        description: requiredString(formData, "description") || null,
        name,
        phone: requiredString(formData, "phone") || null,
        website: requiredString(formData, "website") || null,
      },
      where: {
        id: existingBusiness?.id ?? "__new_business__",
      },
    });

    revalidatePath("/business");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Unable to save business profile", error);
    redirect("/business?profile=error");
  }

  redirect("/business?profile=saved");
}

export async function submitAdForReviewAction(formData: FormData) {
  const session = await requireRole("BUSINESS", "/business");
  const title = requiredString(formData, "title");
  const body = requiredString(formData, "body");
  const targetUrl = requiredString(formData, "targetUrl");

  if (!title || !body || !targetUrl) {
    redirect("/business?ad=missing");
  }

  try {
    const user = await ensureBusinessUser(session);
    const business = await prisma.business.findFirst({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!business) {
      return redirect("/business?ad=profile-required");
    }

    const campaign = await prisma.campaign.upsert({
      create: {
        id: `campaign-review-${business.id}`,
        businessId: business.id,
        budgetCents: 0,
        name: `Revision de anuncios - ${business.name}`,
        status: "REVIEW",
      },
      update: {
        status: "REVIEW",
      },
      where: {
        id: `campaign-review-${business.id}`,
      },
    });

    await prisma.ad.create({
      data: {
        body,
        campaignId: campaign.id,
        moderationStatus: "PENDING",
        placement: "FEED_NATIVE",
        targetUrl,
        title,
      },
    });

    revalidatePath("/business");
    revalidatePath("/admin");
  } catch (error) {
    console.error("Unable to submit ad for review", error);
    redirect("/business?ad=error");
  }

  redirect("/business?ad=submitted");
}
