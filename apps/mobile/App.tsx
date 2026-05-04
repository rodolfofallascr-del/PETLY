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

type Screen = "feed" | "pets" | "post" | "profile";

type Pet = {
  id: string;
  name: string;
  species: string;
  meta: string;
};

type Post = {
  id: string;
  author: string;
  body: string;
  status: "APPROVED" | "PENDING" | "FLAGGED";
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

const initialPets: Pet[] = [
  { id: "pet-luna", name: "Luna", species: "Perro", meta: "Golden Retriever - San Jose" },
  { id: "pet-misha", name: "Misha", species: "Gato", meta: "Indoor - Heredia" }
];

const initialPosts: Post[] = [
  {
    id: "post-1",
    author: "Luna",
    body: "Probamos una ruta con sombra y poco ruido. Ideal para paseos tranquilos.",
    status: "APPROVED"
  },
  {
    id: "post-2",
    author: "Misha",
    body: "Busco recomendaciones de rascadores resistentes.",
    status: "APPROVED"
  }
];

function statusTone(status: Post["status"]) {
  if (status === "APPROVED") return styles.goodPill;
  if (status === "FLAGGED") return styles.dangerPill;
  return styles.warningPill;
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
      dashboard.pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        meta: `${pet.breed} - ${pet.city}`
      }))
    );
    setPosts(
      dashboard.posts.map((post) => ({
        id: post.id,
        author: post.pet,
        body: post.body,
        status: post.status
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
          meta: "Perfil movil demo"
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
          status: suspicious ? "FLAGGED" : "APPROVED"
        },
        ...current
      ]);
      setPostBody("");
      setStatusMessage("Publicacion guardada en demo");
      setScreen("feed");
    }
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
          <Text style={styles.loginTitle}>La comunidad de mascotas en tu bolsillo.</Text>
          <Text style={styles.copy}>
            Primer MVP movil conectado visualmente al panel web: usuarios, mascotas,
            publicaciones y moderacion.
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
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.eyebrow}>Mi Petly</Text>
          <Text style={styles.title}>Hola, {session?.name ?? "Usuario"}</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{statusMessage}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {screen === "feed" ? (
          <View style={styles.section}>
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{pets.length}</Text>
                <Text style={styles.metricLabel}>Mascotas</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{posts.length}</Text>
                <Text style={styles.metricLabel}>Posts</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{pendingReviews}</Text>
                <Text style={styles.metricLabel}>Revision</Text>
              </View>
            </View>

            {posts.map((post) => (
              <View style={styles.postCard} key={post.id}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{post.author.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.postTitleWrap}>
                    <Text style={styles.postAuthor}>{post.author}</Text>
                    <Text style={styles.postMeta}>Comunidad Petly</Text>
                  </View>
                  <View style={[styles.statusPill, statusTone(post.status)]}>
                    <Text style={styles.statusText}>{post.status}</Text>
                  </View>
                </View>
                <Text style={styles.postBody}>{post.body}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {screen === "pets" ? (
          <View style={styles.section}>
            {pets.map((pet) => (
              <View style={styles.petCard} key={pet.id}>
                <View style={styles.petIcon}>
                  <Text style={styles.petIconText}>{pet.name.slice(0, 1)}</Text>
                </View>
                <View>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.postMeta}>{pet.species} - {pet.meta}</Text>
                </View>
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
              <Text style={styles.cardTitle}>Compartir momento</Text>
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
              <Pressable style={styles.primaryButton} onPress={createPost}>
                <Text style={styles.primaryButtonText}>Publicar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {screen === "profile" ? (
          <View style={styles.section}>
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Perfil Petly</Text>
              <Text style={styles.copy}>
                Proxima integracion: Supabase Auth, perfiles reales, imagenes y notificaciones push.
              </Text>
              <Pressable style={styles.secondaryButton} onPress={() => setIsLoggedIn(false)}>
                <Text style={styles.secondaryButtonText}>Cerrar sesion demo</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.tabBar}>
        {[
          ["feed", "Feed"],
          ["pets", "Mascotas"],
          ["post", "Publicar"],
          ["profile", "Perfil"]
        ].map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tabItem, screen === key ? styles.tabItemActive : null]}
            onPress={() => setScreen(key as Screen)}
          >
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
    backgroundColor: "#F2F8FB"
  },
  loginShell: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F2F8FB"
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
    maxWidth: 330,
    marginTop: 8,
    color: "#172027",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 42
  },
  title: {
    color: "#172027",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.6
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
    backgroundColor: "rgba(255,255,255,0.86)"
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
    minHeight: 140,
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
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12
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
  content: {
    padding: 20,
    paddingBottom: 120
  },
  section: {
    gap: 14
  },
  metricRow: {
    flexDirection: "row",
    gap: 10
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.86)"
  },
  metricValue: {
    color: "#172027",
    fontSize: 30,
    fontWeight: "900"
  },
  metricLabel: {
    color: "#62727E",
    fontSize: 12,
    fontWeight: "800"
  },
  postCard: {
    padding: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.88)"
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
    color: "#25313A",
    fontSize: 15,
    lineHeight: 22
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
  petCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.88)"
  },
  petIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFD166"
  },
  petIconText: {
    color: "#172027",
    fontSize: 20,
    fontWeight: "900"
  },
  petName: {
    color: "#172027",
    fontSize: 18,
    fontWeight: "900"
  },
  formCard: {
    padding: 18,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.9)"
  },
  cardTitle: {
    color: "#172027",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1
  },
  tabBar: {
    position: "absolute",
    right: 16,
    bottom: 18,
    left: 16,
    flexDirection: "row",
    gap: 8,
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)"
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 999
  },
  tabItemActive: {
    backgroundColor: "#DDEFF9"
  },
  tabText: {
    color: "#62727E",
    fontSize: 12,
    fontWeight: "900"
  },
  tabTextActive: {
    color: "#172027"
  }
});
