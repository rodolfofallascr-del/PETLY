"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";

export async function trackAdClickAction(formData: FormData) {
  const adId = String(formData.get("adId") ?? "");
  const targetUrl = String(formData.get("targetUrl") ?? "");

  if (!adId || !targetUrl) {
    redirect("/");
  }

  try {
    const ad = await prisma.ad.findFirst({
      where: {
        id: adId,
        moderationStatus: "APPROVED",
      },
      select: {
        targetUrl: true,
      },
    });

    if (!ad) {
      redirect("/");
    }

    await prisma.adClick.create({
      data: {
        adId,
      },
    });

    redirect(ad.targetUrl);
  } catch (error) {
    console.error("Unable to track ad click", error);
    redirect(targetUrl.startsWith("http") ? targetUrl : "/");
  }
}
