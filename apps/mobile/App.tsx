import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

type Screen = "feed" | "watch" | "pets" | "post" | "profile";

type Pet = {
  id: string;
  name: string;
  species: string;
  meta: string;
  tone: string;
};

type Post = {
  id: string;
  author: string;
  body: string;
  status: "APPROVED" | "PENDING" | "FLAGGED";
  place: string;
  minutesAgo: string;
  mood: string;
  imageTone: string;
  reactions: number;
  comments: number;
  shares: number;
  liked?: boolean;
};

type MobileSession = {
  email: string;
  name: string;
  role: "USER" | "BUSINESS" | "ADMIN";
  userId: string;
};

type ApiDashboard = {
  metrics: {
    pendingReviews: number;
    pets: number;
    posts: number;
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
    status: Post["status"];
  }>;
};

const API_BASE_URL = "https://petly-omega.vercel.app";
const imageTones = ["#DDEFF9", "#FFE6B8", "#D8F1E3", "#FAD7D2"];

const initialPets: Pet[] = [
  {
    id: "pet-luna",
    name: "Luna",
    species: "Perro",
    meta: "Golden Retriever - San Jose",
    tone: "#FFD166"
  },
  {
    id: "pet-misha",
    name: "Misha",
    species: "Gato",
    meta: "Indoor - Heredia",
    tone: "#8FC7D5"
  },
  {
    id: "pet-rocky",
    name: "Rocky",
    species: "Perro",
    meta: "Adopcion responsable - Cartago",
    tone: "#D8F1E3"
  }
];

const initialPosts: Post[] = [
  {
    id: "post-1",
    author: "Luna",
    body: "Probamos una ruta con sombra y poco ruido. Ideal para paseos tranquilos y perros nerviosos.",
    status: "APPROVED",
    place: "Parque del Este",
    minutesAgo: "12 min",
    mood: "Paseo tranquilo",
    imageTone: "#DDEFF9",
    reactions: 128,
    comments: 24,
    shares: 8
  },
  {
    id: "post-2",
    author: "Misha",
    body: "Busco recomendaciones de rascadores resistentes. Esta pequena gerente ya destruyo dos.",
    status: "APPROVED",
    place: "Heredia",
    minutesAgo: "34 min",
    mood: "Consejo pet",
    imageTone: "#FFE6B8",
    reactions: 74,
    comments: 19,
    shares: 3
  }
];

function statusTone(status: Post["status"]) {
  if (status === "APPROVED") return styles.goodPill;
  if (status === "FLAGGED") return styles.dangerPill;
  return styles.warningPill;
}

function petEmoji(species: string) {
  return species.toLowerCase().includes("gato") || species.toLowerCase().includes("cat") ? "cat" : "dog";
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<MobileSession | null>(null);
  const [screen, setScreen] = useState<Screen>("feed");
  const [pets, setPets] = useState(initialPets);
  const [posts, setPosts] = useState(initialPosts);
  const [petName, setPetName] = useState("");
  const [postBody, setPostBody] = useState("");
  const [statusMessage, setStatusMessage] = useState("Modo demo listo");

  const pendingReviews = useMemo(
    () => posts.filter((post) => post.status !== "APPROVED").length,
    [posts]
  );

  async function apiRequest(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {})
      }
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    return response.json();
  }

  function hydrateDashboard(dashboard: ApiDashboard) {
    setPets(
      dashboard.pets.map((pet, index) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        meta: `${pet.breed} - ${pet.city}`,
        tone: imageTones[index % imageTones.length]
      }))
    );
    setPosts(
      dashboard.posts.map((post, index) => ({
        id: post.id,
        author: post.pet,
        body: post.body,
        status: post.status,
        place: "Comunidad Petly",
        minutesAgo: index === 0 ? "Ahora" : `${index * 9 + 7} min`,
        mood: post.status === "FLAGGED" ? "En revision" : "Momento pet",
        imageTone: imageTones[index % imageTones.length],
        reactions: 34 + index * 17,
        comments: 6 + index * 3,
        shares: index + 1
      }))
    );
  }

  async function login() {
    try {
      const result = await fetch(`${API_BASE_URL}/api/mobile/login`, {
        body: JSON.stringify({ password: "usuario123", username: "usuario" }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!result.ok) {
        throw new Error("Invalid mobile login");
      }

      const data = (await result.json()) as { session: MobileSession; token: string };
      setToken(data.token);
      setSession(data.session);
      setIsLoggedIn(true);
      setStatusMessage("Conectado a Petly");

      const dashboard = (await fetch(`${API_BASE_URL}/api/mobile/dashboard`, {
        headers: { Authorization: `Bearer ${data.token}` }
      }).then((response) => response.json())) as ApiDashboard;
      hydrateDashboard(dashboard);
    } catch (error) {
      console.error(error);
      setIsLoggedIn(true);
      setStatusMessage("Modo demo sin conexion");
    }
  }

  async function refreshDashboard() {
    if (!token) return;

    try {
      const dashboard = (await apiRequest("/api/mobile/dashboard")) as ApiDashboard;
      hydrateDashboard(dashboard);
      setStatusMessage("Datos sincronizados");
    } catch (error) {
      console.error(error);
      setStatusMessage("No se pudo sincronizar");
    }
  }

  async function createPet() {
    if (!petName.trim()) return;

    try {
      if (!token) throw new Error("No token");
      await apiRequest("/api/mobile/pets", {
        body: JSON.stringify({ name: petName.trim(), species: "DOG" }),
        method: "POST"
      });
      setPetName("");
      await refreshDashboard();
      setScreen("pets");
    } catch (error) {
      console.error(error);
      setPets((current) => [
        {
          id: `pet-${Date.now()}`,
          name: petName.trim(),
          species: "Mascota",
          meta: "Perfil movil demo",
          tone: "#D8F1E3"
        },
        ...current
      ]);
      setPetName("");
      setStatusMessage("Mascota guardada en demo");
      setScreen("pets");
    }
  }

  async function createPost() {
    if (!postBody.trim()) return;
    const lower = postBody.toLowerCase();
    const suspicious = lower.includes("vendo cachorro") || lower.includes("droga");

    try {
      if (!token) throw new Error("No token");
      await apiRequest("/api/mobile/posts", {
        body: JSON.stringify({ body: postBody.trim(), petId: pets[0]?.id }),
        method: "POST"
      });
      setPostBody("");
      await refreshDashboard();
      setScreen("feed");
    } catch (error) {
      console.error(error);
      setPosts((current) => [
        {
          id: `post-${Date.now()}`,
          author: pets[0]?.name ?? "Petly",
          body: postBody.trim(),
          status: suspicious ? "FLAGGED" : "APPROVED",
          place: "Publicado desde mobile",
          minutesAgo: "Ahora",
          mood: suspicious ? "Revision automatica" : "Nuevo momento",
          imageTone: "#D8F1E3",
          reactions: 0,
          comments: 0,
          shares: 0
        },
        ...current
      ]);
      setPostBody("");
      setStatusMessage("Publicacion guardada en demo");
      setScreen("feed");
    }
  }

  function toggleLike(postId: string) {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.liked;
        return {
          ...post,
          liked,
          reactions: liked ? post.reactions + 1 : Math.max(0, post.reactions - 1)
        };
      })
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loginShell}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.eyebrow}>Petly mobile</Text>
          <Text style={styles.loginTitle}>Una red social para mascotas y sus familias.</Text>
          <Text style={styles.copy}>
            Feed, perfiles de mascotas, publicaciones, moderacion automatica y comunidad en tiempo real.
          </Text>
          <View style={styles.loginCard}>
            <Text style={styles.label}>Usuario demo</Text>
            <TextInput style={styles.input} value="usuario" editable={false} />
            <Text style={styles.label}>Contrasena demo</Text>
            <TextInput style={styles.input} value="usuario123" editable={false} secureTextEntry />
            <Pressable style={styles.primaryButton} onPress={login}>
              <Text style={styles.primaryButtonText}>Entrar a Petly</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.miniLogo}>
            <Text style={styles.miniLogoText}>P</Text>
          </View>
          <Text style={styles.brandName}>Petly</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable style={styles.circleButton} onPress={() => setScreen("post")}>
            <Ionicons name="add" size={22} color="#172027" />
          </Pressable>
          <Pressable style={styles.circleButton}>
            <Ionicons name="search" size={20} color="#172027" />
          </Pressable>
          <Pressable style={styles.circleButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#172027" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {screen === "feed" ? (
          <View style={styles.section}>
            <View style={styles.statusStrip}>
              <View>
                <Text style={styles.statusTitle}>Hola, {session?.name ?? "Usuario"}</Text>
                <Text style={styles.statusCopy}>{statusMessage}</Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{pendingReviews} revision</Text>
              </View>
            </View>

            <View style={styles.composerCard}>
              <View style={styles.avatarLarge}>
                <MaterialCommunityIcons name="paw" size={22} color="#172027" />
              </View>
              <Pressable style={styles.composerInput} onPress={() => setScreen("post")}>
                <Text style={styles.composerText}>Que esta haciendo tu mascota?</Text>
              </Pressable>
              <Pressable style={styles.photoButton} onPress={() => setScreen("post")}>
                <Ionicons name="images-outline" size={22} color="#2E779A" />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRail}>
              <Pressable style={styles.storyCreate} onPress={() => setScreen("post")}>
                <View style={styles.storyPlus}>
                  <Ionicons name="add" size={22} color="#172027" />
                </View>
                <Text style={styles.storyName}>Crear historia</Text>
              </Pressable>
              {pets.map((pet) => (
                <View style={[styles.storyCard, { backgroundColor: pet.tone }]} key={pet.id}>
                  <View style={styles.storyAvatar}>
                    <MaterialCommunityIcons name={petEmoji(pet.species)} size={24} color="#172027" />
                  </View>
                  <Text style={styles.storyName}>{pet.name}</Text>
                  <Text style={styles.storyMeta}>Activo hoy</Text>
                </View>
              ))}
            </ScrollView>

            {posts.map((post) => (
              <View style={styles.postCard} key={post.id}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{post.author.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.postTitleWrap}>
                    <Text style={styles.postAuthor}>{post.author}</Text>
                    <Text style={styles.postMeta}>{post.place} - {post.minutesAgo}</Text>
                  </View>
                  <View style={[styles.statusPill, statusTone(post.status)]}>
                    <Text style={styles.statusText}>{post.status}</Text>
                  </View>
                </View>

                <Text style={styles.postBody}>{post.body}</Text>
                <View style={[styles.fakePhoto, { backgroundColor: post.imageTone }]}>
                  <MaterialCommunityIcons name="paw" size={72} color="rgba(23,32,39,0.78)" />
                  <Text style={styles.fakePhotoTitle}>{post.mood}</Text>
                </View>

                <View style={styles.engagementRow}>
                  <Text style={styles.engagementText}>{post.reactions} reacciones</Text>
                  <Text style={styles.engagementText}>{post.comments} comentarios - {post.shares} compartidos</Text>
                </View>
                <View style={styles.actionRow}>
                  <Pressable style={styles.socialAction} onPress={() => toggleLike(post.id)}>
                    <Ionicons name={post.liked ? "heart" : "heart-outline"} size={19} color={post.liked ? "#D95B6A" : "#52616B"} />
                    <Text style={[styles.socialActionText, post.liked ? styles.likedText : null]}>Me gusta</Text>
                  </Pressable>
                  <Pressable style={styles.socialAction}>
                    <Ionicons name="chatbubble-outline" size={18} color="#52616B" />
                    <Text style={styles.socialActionText}>Comentar</Text>
                  </Pressable>
                  <Pressable style={styles.socialAction}>
                    <Ionicons name="paper-plane-outline" size={18} color="#52616B" />
                    <Text style={styles.socialActionText}>Compartir</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {screen === "watch" ? (
          <View style={styles.section}>
            <View style={styles.featureCard}>
              <Text style={styles.cardTitle}>Videos Petly</Text>
              <Text style={styles.copy}>Aqui viviran reels cortos, rescates, tips veterinarios y contenido patrocinado.</Text>
            </View>
          </View>
        ) : null}

        {screen === "pets" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis mascotas</Text>
            {pets.map((pet) => (
              <View style={styles.petCard} key={pet.id}>
                <View style={[styles.petIcon, { backgroundColor: pet.tone }]}>
                  <MaterialCommunityIcons name={petEmoji(pet.species)} size={28} color="#172027" />
                </View>
                <View style={styles.postTitleWrap}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.postMeta}>{pet.species} - {pet.meta}</Text>
                </View>
                <Pressable style={styles.followButton}>
                  <Text style={styles.followButtonText}>Ver</Text>
                </Pressable>
              </View>
            ))}
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Nueva mascota</Text>
              <TextInput
                placeholder="Nombre de mascota"
                placeholderTextColor="#7A8791"
                style={styles.input}
                value={petName}
                onChangeText={setPetName}
              />
              <Pressable style={styles.primaryButton} onPress={createPet}>
                <Text style={styles.primaryButtonText}>Guardar mascota</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {screen === "post" ? (
          <View style={styles.section}>
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Crear publicacion</Text>
              <Text style={styles.copy}>
                El algoritmo revisa senales de venta de mascotas, drogas, estafas y temas fuera de Petly.
              </Text>
              <TextInput
                multiline
                placeholder="Que aventura tuvo tu mascota hoy?"
                placeholderTextColor="#7A8791"
                style={[styles.input, styles.textArea]}
                value={postBody}
                onChangeText={setPostBody}
              />
              <View style={styles.postTools}>
                <View style={styles.toolPill}>
                  <Ionicons name="image-outline" size={17} color="#2E779A" />
                  <Text style={styles.toolText}>Foto</Text>
                </View>
                <View style={styles.toolPill}>
                  <Ionicons name="location-outline" size={17} color="#2E779A" />
                  <Text style={styles.toolText}>Lugar</Text>
                </View>
                <View style={styles.toolPill}>
                  <Ionicons name="shield-checkmark-outline" size={17} color="#2E779A" />
                  <Text style={styles.toolText}>Seguro</Text>
                </View>
              </View>
              <Pressable style={styles.primaryButton} onPress={createPost}>
                <Text style={styles.primaryButtonText}>Publicar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {screen === "profile" ? (
          <View style={styles.section}>
            <View style={styles.profileHero}>
              <View style={styles.profileAvatar}>
                <MaterialCommunityIcons name="account-heart" size={42} color="#172027" />
              </View>
              <Text style={styles.profileName}>{session?.name ?? "Usuario Petly"}</Text>
              <Text style={styles.copy}>Familia Petly - comunidad responsable</Text>
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Text style={styles.metricValue}>{pets.length}</Text>
                  <Text style={styles.metricLabel}>Mascotas</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={styles.metricValue}>{posts.length}</Text>
                  <Text style={styles.metricLabel}>Posts</Text>
                </View>
                <View style={styles.profileStat}>
                  <Text style={styles.metricValue}>{pendingReviews}</Text>
                  <Text style={styles.metricLabel}>Revision</Text>
                </View>
              </View>
              <Pressable style={styles.secondaryButton} onPress={() => setIsLoggedIn(false)}>
                <Text style={styles.secondaryButtonText}>Cerrar sesion demo</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.tabBar}>
        {[
          ["feed", "Inicio", "home"],
          ["watch", "Videos", "play-circle"],
          ["pets", "Mascotas", "paw"],
          ["post", "Publicar", "add-circle"],
          ["profile", "Perfil", "person-circle"]
        ].map(([key, label, icon]) => (
          <Pressable
            key={key}
            style={styles.tabItem}
            onPress={() => setScreen(key as Screen)}
          >
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={23}
              color={screen === key ? "#172027" : "#7A8791"}
            />
            <Text style={[styles.tabText, screen === key ? styles.tabTextActive : null]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EDF6FA"
  },
  loginShell: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#EDF6FA"
  },
  logoMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 62,
    height: 62,
    marginBottom: 20,
    borderRadius: 31,
    backgroundColor: "#172027"
  },
  logoText: {
    color: "#FFD98C",
    fontSize: 28,
    fontWeight: "900"
  },
  eyebrow: {
    color: "#9A5B35",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  loginTitle: {
    maxWidth: 345,
    marginTop: 8,
    color: "#172027",
    fontSize: 41,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 42
  },
  copy: {
    marginTop: 10,
    color: "#62727E",
    fontSize: 15,
    lineHeight: 22
  },
  loginCard: {
    marginTop: 26,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.9)"
  },
  label: {
    marginBottom: 6,
    color: "#62727E",
    fontWeight: "800"
  },
  input: {
    minHeight: 50,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(89,139,171,0.22)",
    borderRadius: 18,
    color: "#172027",
    backgroundColor: "#F8FAFC"
  },
  textArea: {
    minHeight: 150,
    paddingTop: 14,
    textAlignVertical: "top"
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#FFD166"
  },
  primaryButtonText: {
    color: "#172027",
    fontWeight: "900"
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: "rgba(122,167,199,0.2)"
  },
  secondaryButtonText: {
    color: "#315D78",
    fontWeight: "900"
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "rgba(237,246,250,0.98)"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9
  },
  miniLogo: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#172027"
  },
  miniLogoText: {
    color: "#FFD166",
    fontWeight: "900"
  },
  brandName: {
    color: "#172027",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.5
  },
  topActions: {
    flexDirection: "row",
    gap: 8
  },
  circleButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#FFFFFF"
  },
  content: {
    paddingBottom: 110
  },
  section: {
    gap: 12,
    paddingHorizontal: 12
  },
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.86)"
  },
  statusTitle: {
    color: "#172027",
    fontSize: 18,
    fontWeight: "900"
  },
  statusCopy: {
    marginTop: 2,
    color: "#62727E",
    fontSize: 12,
    fontWeight: "700"
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(244,184,96,0.24)"
  },
  headerBadgeText: {
    color: "#8B5A16",
    fontSize: 12,
    fontWeight: "900"
  },
  composerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 24,
    backgroundColor: "#FFFFFF"
  },
  avatarLarge: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFD166"
  },
  composerInput: {
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#F0F5F8"
  },
  composerText: {
    color: "#62727E",
    fontWeight: "800"
  },
  photoButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DDEFF9"
  },
  storyRail: {
    gap: 10,
    paddingVertical: 2,
    paddingRight: 10
  },
  storyCreate: {
    justifyContent: "flex-end",
    width: 112,
    height: 158,
    padding: 12,
    borderRadius: 26,
    backgroundColor: "#FFFFFF"
  },
  storyPlus: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    marginBottom: 36,
    borderRadius: 21,
    backgroundColor: "#FFD166"
  },
  storyCard: {
    justifyContent: "flex-end",
    width: 112,
    height: 158,
    padding: 12,
    borderRadius: 26
  },
  storyAvatar: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    marginBottom: 38,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.76)"
  },
  storyName: {
    color: "#172027",
    fontSize: 13,
    fontWeight: "900"
  },
  storyMeta: {
    marginTop: 2,
    color: "rgba(23,32,39,0.62)",
    fontSize: 11,
    fontWeight: "800"
  },
  postCard: {
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#FFFFFF"
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8FC7D5"
  },
  avatarText: {
    color: "#172027",
    fontWeight: "900"
  },
  postTitleWrap: {
    flex: 1
  },
  postAuthor: {
    color: "#172027",
    fontSize: 16,
    fontWeight: "900"
  },
  postMeta: {
    color: "#62727E",
    fontSize: 12
  },
  postBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    color: "#25313A",
    fontSize: 15,
    lineHeight: 22
  },
  fakePhoto: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 230,
    gap: 10
  },
  fakePhotoTitle: {
    color: "#172027",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  engagementText: {
    color: "#62727E",
    fontSize: 12,
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EEF2F5"
  },
  socialAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13
  },
  socialActionText: {
    color: "#52616B",
    fontSize: 12,
    fontWeight: "900"
  },
  likedText: {
    color: "#D95B6A"
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999
  },
  statusText: {
    color: "#172027",
    fontSize: 10,
    fontWeight: "900"
  },
  goodPill: {
    backgroundColor: "rgba(88,171,133,0.18)"
  },
  warningPill: {
    backgroundColor: "rgba(244,184,96,0.24)"
  },
  dangerPill: {
    backgroundColor: "rgba(217,121,91,0.18)"
  },
  sectionTitle: {
    marginTop: 4,
    color: "#172027",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1
  },
  petCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 26,
    backgroundColor: "#FFFFFF"
  },
  petIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 54,
    height: 54,
    borderRadius: 27
  },
  petName: {
    color: "#172027",
    fontSize: 18,
    fontWeight: "900"
  },
  followButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#DDEFF9"
  },
  followButtonText: {
    color: "#235B78",
    fontWeight: "900"
  },
  featureCard: {
    padding: 22,
    borderRadius: 30,
    backgroundColor: "#FFFFFF"
  },
  formCard: {
    padding: 18,
    borderRadius: 30,
    backgroundColor: "#FFFFFF"
  },
  cardTitle: {
    color: "#172027",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1
  },
  postTools: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },
  toolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EDF6FA"
  },
  toolText: {
    color: "#2E779A",
    fontSize: 12,
    fontWeight: "900"
  },
  profileHero: {
    alignItems: "center",
    padding: 22,
    borderRadius: 32,
    backgroundColor: "#FFFFFF"
  },
  profileAvatar: {
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFD166"
  },
  profileName: {
    marginTop: 12,
    color: "#172027",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1
  },
  profileStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18
  },
  profileStat: {
    alignItems: "center",
    minWidth: 86,
    padding: 12,
    borderRadius: 22,
    backgroundColor: "#F5F8FA"
  },
  metricValue: {
    color: "#172027",
    fontSize: 25,
    fontWeight: "900"
  },
  metricLabel: {
    color: "#62727E",
    fontSize: 12,
    fontWeight: "800"
  },
  tabBar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: "#E1E9EE",
    backgroundColor: "rgba(255,255,255,0.98)"
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50
  },
  tabText: {
    marginTop: 2,
    color: "#7A8791",
    fontSize: 10,
    fontWeight: "900"
  },
  tabTextActive: {
    color: "#172027"
  }
});
