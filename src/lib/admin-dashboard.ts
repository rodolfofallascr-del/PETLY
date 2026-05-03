import { prisma } from "@/src/lib/prisma";
import { analyzeContentModeration } from "@/src/lib/content-moderation";

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
    risk: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    pets: number;
    posts: number;
    joinedAt: string;
  }>;
  partners: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    ctr: string;
    campaigns: number;
    ads: number;
  }>;
  adInventory: Array<{
    id: string;
    title: string;
    channel: string;
    status: string;
    impressions: number;
    clicks: number;
    ctr: string;
  }>;
  moderationQueue: Array<{
    id: string;
    reason: string;
    status: string;
    target: string;
    details: string;
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
      risk: "Riesgo bajo",
    },
    {
      id: "fallback-post-2",
      label: "Misha busca recomendaciones de rascadores resistentes.",
      status: "APPROVED",
      icon: "C",
      risk: "Riesgo bajo",
    },
  ],
  recentUsers: [
    {
      id: "fallback-user-1",
      name: "Sofia Vargas",
      email: "sofia@petly.local",
      role: "USER",
      pets: 1,
      posts: 1,
      joinedAt: "Demo",
    },
    {
      id: "fallback-user-2",
      name: "VetCare CR",
      email: "vetcare@petly.local",
      role: "BUSINESS",
      pets: 0,
      posts: 0,
      joinedAt: "Demo",
    },
  ],
  partners: [
    {
      id: "fallback-partner-1",
      name: "VetCare CR",
      category: "Veterinaria",
      status: "Verificada",
      ctr: "7.5%",
      campaigns: 1,
      ads: 1,
    },
    {
      id: "fallback-partner-2",
      name: "Happy Groom",
      category: "Grooming",
      status: "Revision",
      ctr: "3.2%",
      campaigns: 0,
      ads: 0,
    },
  ],
  adInventory: [
    {
      id: "fallback-ad-1",
      title: "Feed nativo",
      channel: "Google Ads / marcas privadas",
      status: "Listo",
      impressions: 1280,
      clicks: 96,
      ctr: "7.5%",
    },
    {
      id: "fallback-ad-2",
      title: "Directorio premium",
      channel: "Veterinarias, groomers y tiendas",
      status: "Listo",
      impressions: 0,
      clicks: 0,
      ctr: "0%",
    },
  ],
  moderationQueue: [
    {
      id: "fallback-report-1",
      reason: "Revision de adopcion",
      status: "PENDING",
      target: "Toby busca hogar",
      details: "Pendiente de revision manual.",
    },
    {
      id: "fallback-report-2",
      reason: "Verificacion de empresa",
      status: "PENDING",
      target: "Happy Groom",
      details: "Pendiente de revision manual.",
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
      moderationQueue,
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
              posts: true,
            },
          },
          createdAt: true,
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
          _count: {
            select: {
              clicks: true,
              impressions: true,
            },
          },
        },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          reason: true,
          status: true,
          post: {
            select: {
              body: true,
            },
          },
          reportedUser: {
            select: {
              name: true,
            },
          },
          details: true,
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
        ? recentPosts.map((post) => {
            const moderation = analyzeContentModeration(post.body);

            return {
              id: post.id,
              label: post.body.slice(0, 54) || "Publicacion sin texto",
              status: post.moderationStatus,
              icon: post.pet?.species === "CAT" ? "C" : post.pet?.species === "DOG" ? "D" : "P",
              risk:
                moderation.score >= 60
                  ? `Riesgo alto ${moderation.score}/100`
                  : moderation.score >= 35
                    ? `Riesgo medio ${moderation.score}/100`
                    : `Riesgo bajo ${moderation.score}/100`,
            };
          })
        : fallbackDashboard.recentPosts,
      recentUsers: recentUsers.length
        ? recentUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            pets: user._count.pets,
            posts: user._count.posts,
            joinedAt: user.createdAt.toLocaleDateString("es-CR"),
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
            const ads = partner.campaigns.reduce((total, campaign) => total + campaign.ads.length, 0);

            return {
              id: partner.id,
              name: partner.name,
              category: partner.category,
              status: partner.verified ? "Verificada" : "Revision",
              ctr: calculateCtr(partnerTotals.clicks, partnerTotals.impressions),
              campaigns: partner.campaigns.length,
              ads,
            };
          })
        : fallbackDashboard.partners,
      adInventory: adInventory.length
        ? adInventory.map((ad) => ({
            id: ad.id,
            title: ad.title,
            channel: ad.placement.replaceAll("_", " ").toLowerCase(),
            status: ad.moderationStatus,
            impressions: ad._count.impressions,
            clicks: ad._count.clicks,
            ctr: calculateCtr(ad._count.clicks, ad._count.impressions),
          }))
        : fallbackDashboard.adInventory,
      moderationQueue: pendingReports
        ? moderationQueue.map((report) => ({
            id: report.id,
            reason: report.reason,
            status: report.status,
            target: report.post?.body.slice(0, 42) ?? report.reportedUser?.name ?? "Reporte general",
            details: report.details ?? "Sin detalles adicionales.",
          }))
        : fallbackDashboard.moderationQueue,
    };
  } catch (error) {
    console.error("Admin dashboard database read failed", error);
    return fallbackDashboard;
  }
}
