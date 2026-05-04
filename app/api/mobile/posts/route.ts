import { NextResponse } from "next/server";
import { analyzeContentModeration, formatModerationDetails } from "@/src/lib/content-moderation";
import { requireMobileSession } from "@/src/lib/mobile-api-auth";
import { ensurePetlyUser } from "@/src/lib/user-dashboard";
import { prisma } from "@/src/lib/prisma";

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

export async function POST(request: Request) {
  const { response, session } = requireMobileSession(request);

  if (response || !session) {
    return response;
  }

  if (session.role !== "USER") {
    return NextResponse.json({ error: "Only users can create posts" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  const petId = String(body?.petId ?? "").trim();

  if (!text) {
    return NextResponse.json({ error: "Post body is required" }, { status: 400 });
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
    const moderation = analyzeContentModeration(text);
    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        body: text,
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

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Mobile post creation failed", error);
    return NextResponse.json({ error: "Unable to create post" }, { status: 500 });
  }
}
