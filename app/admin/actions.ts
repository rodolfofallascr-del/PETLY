"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, requireRole } from "@/src/lib/auth";
import { analyzeContentModeration, formatModerationDetails } from "@/src/lib/content-moderation";
import { prisma } from "@/src/lib/prisma";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry<T>(operation: () => Promise<T>, attempts = 2) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await wait(450 * attempt);
      }
    }
  }

  throw lastError;
}

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

    const flaggedPostAnalysis = analyzeContentModeration(
      "Vendo cachorros golden, precio especial por inbox. Entrega inmediata.",
    );

    const flaggedPost = await prisma.post.upsert({
      create: {
        id: "demo-post-auto-flagged-sale",
        authorId: user.id,
        body: "Vendo cachorros golden, precio especial por inbox. Entrega inmediata.",
        mediaUrls: [],
        moderationStatus: flaggedPostAnalysis.status,
        petId: pet.id,
      },
      update: {
        moderationStatus: flaggedPostAnalysis.status,
      },
      where: {
        id: "demo-post-auto-flagged-sale",
      },
    });

    const existingAutoReport = await prisma.report.findFirst({
      where: {
        postId: flaggedPost.id,
        reason: `Auto: ${flaggedPostAnalysis.primaryReason}`,
      },
    });

    if (!existingAutoReport && flaggedPostAnalysis.status !== "APPROVED") {
      await prisma.report.create({
        data: {
          details: formatModerationDetails(flaggedPostAnalysis),
          postId: flaggedPost.id,
          reason: `Auto: ${flaggedPostAnalysis.primaryReason}`,
          reportedUserId: user.id,
          reporterId: admin.id,
          status: "PENDING",
        },
      });
    }

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

export async function scanContentModerationAction() {
  const session = await requireRole("ADMIN");
  let flagged = 0;
  let pending = 0;

  try {
    await runWithRetry(async () => {
      const posts = await prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
        where: {
          moderationStatus: {
            in: ["APPROVED", "PENDING"],
          },
        },
        select: {
          authorId: true,
          body: true,
          id: true,
          moderationStatus: true,
        },
      });
      const moderator = await prisma.user.upsert({
        create: {
          email: session.email,
          name: session.name,
          role: "ADMIN",
          username: `moderator-${session.userId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        },
        update: {
          role: "ADMIN",
        },
        where: {
          email: session.email,
        },
      });

      flagged = 0;
      pending = 0;

      for (const post of posts) {
        const result = analyzeContentModeration(post.body);

        if (result.status === "APPROVED") {
          continue;
        }

        if (result.status === "FLAGGED") {
          flagged += 1;
        } else {
          pending += 1;
        }

        await prisma.post.update({
          data: {
            moderationStatus: result.status,
          },
          where: {
            id: post.id,
          },
        });

        const reason = `Auto: ${result.primaryReason}`;
        const existingReport = await prisma.report.findFirst({
          where: {
            postId: post.id,
            reason,
          },
        });

        if (!existingReport) {
          await prisma.report.create({
            data: {
              details: formatModerationDetails(result),
              postId: post.id,
              reason,
              reportedUserId: post.authorId,
              reporterId: moderator.id,
              status: "PENDING",
            },
          });
        }
      }
    });

    revalidatePath("/admin");
  } catch (error) {
    console.error("Unable to run content moderation scan", error);
    redirect("/admin?scan=error");
  }

  redirect(`/admin?scan=success&flagged=${flagged}&pending=${pending}`);
}

export async function approveModerationReportAction(formData: FormData) {
  await requireRole("ADMIN");

  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    redirect("/admin?moderation=error");
  }

  try {
    const report = await prisma.report.update({
      data: {
        status: "APPROVED",
      },
      where: {
        id: reportId,
      },
      select: {
        postId: true,
      },
    });

    if (report.postId) {
      await prisma.post.update({
        data: {
          moderationStatus: "APPROVED",
        },
        where: {
          id: report.postId,
        },
      });
    }

    revalidatePath("/admin");
  } catch (error) {
    console.error("Unable to approve moderation report", error);
    redirect("/admin?moderation=error");
  }

  redirect("/admin?moderation=approved");
}

export async function rejectModerationReportAction(formData: FormData) {
  await requireRole("ADMIN");

  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    redirect("/admin?moderation=error");
  }

  try {
    const report = await prisma.report.update({
      data: {
        status: "REJECTED",
      },
      where: {
        id: reportId,
      },
      select: {
        postId: true,
      },
    });

    if (report.postId) {
      await prisma.post.update({
        data: {
          moderationStatus: "REJECTED",
        },
        where: {
          id: report.postId,
        },
      });
    }

    revalidatePath("/admin");
  } catch (error) {
    console.error("Unable to reject moderation report", error);
    redirect("/admin?moderation=error");
  }

  redirect("/admin?moderation=rejected");
}

export async function resolveModerationReportAction(formData: FormData) {
  await requireRole("ADMIN");

  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    redirect("/admin?moderation=error");
  }

  try {
    await prisma.report.update({
      data: {
        status: "APPROVED",
      },
      where: {
        id: reportId,
      },
    });

    revalidatePath("/admin");
  } catch (error) {
    console.error("Unable to resolve moderation report", error);
    redirect("/admin?moderation=error");
  }

  redirect("/admin?moderation=resolved");
}
