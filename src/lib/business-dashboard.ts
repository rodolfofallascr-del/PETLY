import { prisma } from "@/src/lib/prisma";
import type { AppSession } from "@/src/lib/auth";

export type BusinessDashboardData = {
  source: "database" | "fallback";
  business: {
    id: string;
    name: string;
    category: string;
    description: string;
    website: string;
    phone: string;
    city: string;
    verified: boolean;
  } | null;
  metrics: {
    campaigns: number;
    ads: number;
    impressions: number;
    clicks: number;
  };
  ads: Array<{
    id: string;
    title: string;
    body: string;
    placement: string;
    status: string;
    impressions: number;
    clicks: number;
  }>;
};

export async function ensureBusinessUser(session: AppSession) {
  return prisma.user.upsert({
    create: {
      email: session.email,
      name: session.name,
      role: "BUSINESS",
      username: `business-${session.userId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    },
    update: {
      name: session.name,
      role: "BUSINESS",
    },
    where: {
      email: session.email,
    },
  });
}

export async function getBusinessDashboardData(session: AppSession): Promise<BusinessDashboardData> {
  try {
    const user = await ensureBusinessUser(session);
    const business = await prisma.business.findFirst({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        website: true,
        phone: true,
        city: true,
        verified: true,
        campaigns: {
          select: {
            ads: {
              orderBy: {
                createdAt: "desc",
              },
              select: {
                id: true,
                title: true,
                body: true,
                placement: true,
                moderationStatus: true,
                _count: {
                  select: {
                    impressions: true,
                    clicks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!business) {
      return {
        source: "database",
        business: null,
        metrics: {
          campaigns: 0,
          ads: 0,
          impressions: 0,
          clicks: 0,
        },
        ads: [],
      };
    }

    const ads = business.campaigns.flatMap((campaign) => campaign.ads);
    const impressions = ads.reduce((total, ad) => total + ad._count.impressions, 0);
    const clicks = ads.reduce((total, ad) => total + ad._count.clicks, 0);

    return {
      source: "database",
      business: {
        id: business.id,
        name: business.name,
        category: business.category,
        description: business.description ?? "",
        website: business.website ?? "",
        phone: business.phone ?? "",
        city: business.city ?? "",
        verified: business.verified,
      },
      metrics: {
        campaigns: business.campaigns.length,
        ads: ads.length,
        impressions,
        clicks,
      },
      ads: ads.slice(0, 5).map((ad) => ({
        id: ad.id,
        title: ad.title,
        body: ad.body,
        placement: ad.placement.replaceAll("_", " ").toLowerCase(),
        status: ad.moderationStatus,
        impressions: ad._count.impressions,
        clicks: ad._count.clicks,
      })),
    };
  } catch (error) {
    console.error("Business dashboard database read failed", error);
    return {
      source: "fallback",
      business: null,
      metrics: {
        campaigns: 0,
        ads: 0,
        impressions: 0,
        clicks: 0,
      },
      ads: [],
    };
  }
}
