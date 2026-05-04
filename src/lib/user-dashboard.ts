import { prisma } from "@/src/lib/prisma";
import type { AppSession } from "@/src/lib/auth";

export type UserDashboardData = {
  source: "database" | "fallback";
  metrics: {
    pets: number;
    posts: number;
    pendingReviews: number;
  };
  pets: Array<{
    id: string;
    name: string;
    species: string;
    breed: string;
    city: string;
  }>;
  posts: Array<{
    id: string;
    body: string;
    pet: string;
    status: string;
    createdAt: string;
  }>;
};

export async function ensurePetlyUser(session: AppSession) {
  return prisma.user.upsert({
    create: {
      email: session.email,
      name: session.name,
      role: "USER",
      username: `user-${session.userId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    },
    update: {
      name: session.name,
      role: "USER",
    },
    where: {
      email: session.email,
    },
  });
}

export async function getUserDashboardData(session: AppSession): Promise<UserDashboardData> {
  try {
    const user = await ensurePetlyUser(session);
    const [pets, posts, pendingReviews] = await Promise.all([
      prisma.pet.findMany({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          ownerId: user.id,
        },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          city: true,
        },
      }),
      prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        where: {
          authorId: user.id,
        },
        select: {
          id: true,
          body: true,
          moderationStatus: true,
          createdAt: true,
          pet: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.post.count({
        where: {
          authorId: user.id,
          moderationStatus: {
            in: ["PENDING", "FLAGGED"],
          },
        },
      }),
    ]);

    return {
      source: "database",
      metrics: {
        pets: pets.length,
        posts: posts.length,
        pendingReviews,
      },
      pets: pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed ?? "Sin raza",
        city: pet.city ?? "Sin ciudad",
      })),
      posts: posts.map((post) => ({
        id: post.id,
        body: post.body,
        pet: post.pet?.name ?? "Publicacion general",
        status: post.moderationStatus,
        createdAt: post.createdAt.toLocaleDateString("es-CR"),
      })),
    };
  } catch (error) {
    console.error("User dashboard database read failed", error);
    return {
      source: "fallback",
      metrics: {
        pets: 0,
        posts: 0,
        pendingReviews: 0,
      },
      pets: [],
      posts: [],
    };
  }
}
