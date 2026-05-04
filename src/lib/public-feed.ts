import { prisma } from "@/src/lib/prisma";

export type PublicFeedData = {
  source: "database" | "fallback";
  featuredPet: {
    name: string;
    meta: string;
    icon: string;
  };
  posts: Array<{
    id: string;
    author: string;
    meta: string;
    body: string;
    icon: string;
  }>;
  nearbyPets: Array<{
    id: string;
    name: string;
    distance: string;
    icon: string;
  }>;
  ad: {
    title: string;
    body: string;
    targetUrl: string;
  } | null;
};

function speciesIcon(species?: string) {
  if (species === "CAT") return "C";
  if (species === "DOG") return "D";
  if (species === "BIRD") return "A";
  if (species === "RABBIT") return "R";
  return "P";
}

const fallbackFeed: PublicFeedData = {
  source: "fallback",
  featuredPet: {
    name: "Luna",
    meta: "Golden Retriever - 2 anos - San Jose",
    icon: "D",
  },
  posts: [
    {
      id: "fallback-post-max",
      author: "Max",
      meta: "Parque La Sabana - hace 18 min",
      body: "Probamos una ruta nueva con mucha sombra. Ideal para perros nerviosos porque hay espacios abiertos.",
      icon: "D",
    },
    {
      id: "fallback-post-misha",
      author: "Misha",
      meta: "Casa - hace 1 h",
      body: "Busco recomendaciones de rascadores resistentes. Misha declaro guerra al sofa.",
      icon: "C",
    },
  ],
  nearbyPets: [
    { id: "nearby-nala", name: "Nala", distance: "800 m", icon: "D" },
    { id: "nearby-rocky", name: "Rocky", distance: "1.4 km", icon: "D" },
    { id: "nearby-simba", name: "Simba", distance: "2.1 km", icon: "C" },
  ],
  ad: null,
};

export async function getPublicFeedData(): Promise<PublicFeedData> {
  try {
    const [posts, pets, ad] = await Promise.all([
      prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
        where: {
          moderationStatus: "APPROVED",
          visibility: "PUBLIC",
        },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              city: true,
            },
          },
          pet: {
            select: {
              name: true,
              species: true,
            },
          },
        },
      }),
      prisma.pet.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
        where: {
          isPublic: true,
        },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          city: true,
        },
      }),
      prisma.ad.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          moderationStatus: "APPROVED",
        },
        select: {
          title: true,
          body: true,
          targetUrl: true,
        },
      }),
    ]);

    const featuredPet = pets[0]
      ? {
          name: pets[0].name,
          meta: `${pets[0].breed ?? "Mascota"} - ${pets[0].city ?? "Costa Rica"}`,
          icon: speciesIcon(pets[0].species),
        }
      : fallbackFeed.featuredPet;

    return {
      source: "database",
      featuredPet,
      posts: posts.length
        ? posts.map((post) => ({
            id: post.id,
            author: post.pet?.name ?? post.author.name,
            meta: `${post.author.city ?? "Petly"} - ${post.createdAt.toLocaleDateString("es-CR")}`,
            body: post.body,
            icon: speciesIcon(post.pet?.species),
          }))
        : fallbackFeed.posts,
      nearbyPets: pets.length
        ? pets.map((pet, index) => ({
            id: pet.id,
            name: pet.name,
            distance: pet.city ?? `${index + 1}.0 km`,
            icon: speciesIcon(pet.species),
          }))
        : fallbackFeed.nearbyPets,
      ad: ad
        ? {
            title: ad.title,
            body: ad.body,
            targetUrl: ad.targetUrl,
          }
        : null,
    };
  } catch (error) {
    console.error("Public feed database read failed", error);
    return fallbackFeed;
  }
}
