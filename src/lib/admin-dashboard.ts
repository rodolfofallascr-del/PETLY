import { prisma } from "@/src/lib/prisma";

export type AdminDashboardData = {
  source: "database" | "fallback";
  metrics: {
    users: number;
    pets: number;
    posts: number;
    businesses: number;
    campaigns: number;
    ads: number;
    impressions: number;
    clicks: number;
    pendingReports: number;
  };
  recentPosts: Array<{
    id: string;
    label: string;
    status: string;
    icon: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    pets: number;
  }>;
  partners: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    ctr: string;
  }>;
  adInventory: Array<{
    id: string;
    title: string;
    channel: string;
    status: string;
  }>;
};

const fallbackDashboard: AdminDashboardData = {
  source: "fallback",
  metrics: {
    users: 128,
    pets: 214,
    posts: 57,
    businesses: 12,
    campaigns: 4,
    ads: 7,
    impressions: 1280,
    clicks: 96,
    pendingReports: 2,
  },
  recentPosts: [
    {
      id: "fallback-post-1",
      label: "Luna descubrio una ruta nueva con sombra y espacio para correr.",
      status: "APPROVED",
      icon: "D",
    },
    {
      id: "fallback-post-2",
      label: "Misha busca recomendaciones de rascadores resistentes.",
      status: "APPROVED",
      icon: "C",
    },
  ],
  recentUsers: [
    {
      id: "fallback-user-1",
      name: "Sofia Vargas",
      email: "sofia@petly.local",
      role: "USER",
      pets: 1,
    },
    {
      id: "fallback-user-2",
      name: "VetCare CR",
      email: "vetcare@petly.local",
      role: "BUSINESS",
      pets: 0,
    },
  ],
  partners: [
    {
      id: "fallback-partner-1",
      name: "VetCare CR",
      category: "Veterinaria",
      status: "Verificada",
      ctr: "7.5%",
    },
    {
      id: "fallback-partner-2",
      name: "Happy Groom",
      category: "Grooming",
      status: "Revision",
      ctr: "3.2%",
    },
  ],
  adInventory: [
    {
      id: "fallback-ad-1",
      title: "Feed nativo",
      channel: "Google Ads / marcas privadas",
      status: "Listo",
    },
    {
      id: "fallback-ad-2",
      title: "Directorio premium",
      channel: "Veterinarias, groomers y tiendas",
      status: "Listo",
    },
  ],
};

function calculateCtr(clicks: number, impressions: number) {
  if (impressions === 0) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const [
      users,
      pets,
      posts,
      businesses,
      campaigns,
      ads,
      impressions,
      clicks,
      pendingReports,
      recentPosts,
      recentUsers,
      partners,
      adInventory,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.pet.count(),
      prisma.post.count(),
      prisma.business.count(),
      prisma.campaign.count(),
      prisma.ad.count(),
      prisma.adImpression.count(),
      prisma.adClick.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          body: true,
          moderationStatus: true,
          pet: {
            select: {
              species: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              pets: true,
            },
          },
        },
      }),
      prisma.business.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          category: true,
          verified: true,
          campaigns: {
            select: {
              ads: {
                select: {
                  _count: {
                    select: {
                      clicks: true,
                      impressions: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.ad.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          placement: true,
          moderationStatus: true,
        },
      }),
    ]);

    return {
      source: "database",
      metrics: {
        users,
        pets,
        posts,
        businesses,
        campaigns,
        ads,
        impressions,
        clicks,
        pendingReports,
      },
      recentPosts: recentPosts.length
        ? recentPosts.map((post) => ({
            id: post.id,
            label: post.body.slice(0, 54) || "Publicacion sin texto",
            status: post.moderationStatus,
            icon: post.pet?.species === "CAT" ? "C" : post.pet?.species === "DOG" ? "D" : "P",
          }))
        : fallbackDashboard.recentPosts,
      recentUsers: recentUsers.length
        ? recentUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            pets: user._count.pets,
          }))
        : fallbackDashboard.recentUsers,
      partners: partners.length
        ? partners.map((partner) => {
            const partnerTotals = partner.campaigns.reduce(
              (total, campaign) => {
                campaign.ads.forEach((ad) => {
                  total.clicks += ad._count.clicks;
                  total.impressions += ad._count.impressions;
                });
                return total;
              },
              { clicks: 0, impressions: 0 },
            );

            return {
              id: partner.id,
              name: partner.name,
              category: partner.category,
              status: partner.verified ? "Verificada" : "Revision",
              ctr: calculateCtr(partnerTotals.clicks, partnerTotals.impressions),
            };
          })
        : fallbackDashboard.partners,
      adInventory: adInventory.length
        ? adInventory.map((ad) => ({
            id: ad.id,
            title: ad.title,
            channel: ad.placement.replaceAll("_", " ").toLowerCase(),
            status: ad.moderationStatus,
          }))
        : fallbackDashboard.adInventory,
    };
  } catch (error) {
    console.error("Admin dashboard database read failed", error);
    return fallbackDashboard;
  }
}
