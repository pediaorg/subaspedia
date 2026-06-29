import { useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import {
  ChartLineIcon,
  Clock,
  LogOut,
  LucideHammer,
  Package,
  Pencil,
  TriangleAlertIcon,
  Wallet,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { MenuItem } from "@/components/profile/menu-item";
import RankBadge from "@/components/profile/rank-badge";
import { StatCard } from "@/components/profile/stat-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";
import { DEFAULT_AVATAR_URI } from "@/lib/constants";

export default function Profile() {
  const handleAccept = () => {
    authStore.set(null);
    queryClient.clear();
    router.replace("/");
  };
  const queryClient = useQueryClient();
  const { data: user } = api.users.me.useQuery();
  // Actividad real para las StatCards: participaciones y subastas ganadas.
  // rankSummary ya las calcula (attendees + bids.winner); se comparte con la
  // pantalla de Rango.
  const { data: rank } = api.user.rankSummary.useQuery();
  if (!user) return <Text>Cargando usuario...</Text>;

  // Dos estados distintos cuando el perfil no está "onboarded":
  //   - faltan datos que carga el usuario (nombre / documento)
  //   - datos completos pero sin categoría -> la empresa todavía no verificó
  const profileIncomplete = user.name === null || user.documentId === null;
  const awaitingVerification = !profileIncomplete && user.category === null;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 pb-32"
      showsVerticalScrollIndicator={false}
    >
      <View>
        {/* card de profile */}
        <View className="relative">
          <View
            className="absolute size-40 z-30 self-center rounded-full bg-white"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Avatar
              alt={`avatar`}
              className="border absolute size-full border-border"
            >
              <AvatarImage
                source={{
                  uri: user?.avatarUrl ?? DEFAULT_AVATAR_URI,
                }}
              ></AvatarImage>
            </Avatar>
          </View>
          <Card className="bg-primary border-0 drop-shadow-lg/30 mt-20 p-5 mx-5 z-20">
            <View className="mt-16 flex-row gap-2 justify-between">
              <View>
                <Text className="text-white text-xl font-bold">
                  {user.name
                    ? `${user.name} ${user.surname ?? ""}`.trim()
                    : "Completá tu perfil"}
                </Text>
                <Text className="text-gray-300">{user?.email}</Text>
              </View>
              {user?.category && (
                <Link href="/rank-up" asChild>
                  <Pressable className="active:opacity-60">
                    <RankBadge category={user.category} />
                  </Pressable>
                </Link>
              )}
            </View>
            <View className="flex-row gap-5 ">
              <StatCard
                value={rank?.activity.participated ?? 0}
                label="Cantidad de subastas"
              />
              <StatCard
                value={rank?.activity.won ?? 0}
                label="Subastas ganadas"
              />
            </View>
          </Card>
          <View
            className="w-full h-41 absolute rounded-t-2xl z-10 bottom-0"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 0,
            }}
          ></View>
        </View>
        {/* Aviso de estado del perfil: faltan datos vs esperando verificación */}
        {(profileIncomplete || awaitingVerification) && (
          <Card className="mx-5 flex-row items-center gap-3 border-0 bg-amber-50 p-4 drop-shadow-lg/10">
            {profileIncomplete ? (
              <TriangleAlertIcon className="size-7 color-amber-600" />
            ) : (
              <Clock className="size-7 color-amber-600" />
            )}
            <View className="flex-1">
              <Text className="font-bold text-amber-900">
                {profileIncomplete
                  ? "Perfil incompleto"
                  : "Esperando verificación de perfil"}
              </Text>
              <Text className="text-sm text-amber-800">
                {profileIncomplete
                  ? "Completá tus datos para que la empresa pueda verificarte."
                  : "La empresa está verificando tu perfil y asignando tu categoría. Vas a poder operar cuando termine."}
              </Text>
            </View>
          </Card>
        )}
        {/* Menu options */}
        <View className="gap-3 mb-9 px-5 py-6">
          <MenuItem icon={Pencil} label="Editar Perfil" href="/profile/edit" />
          <MenuItem
            icon={Package}
            label="Mis Productos"
            href="/profile/products"
          />
          <MenuItem
            icon={ChartLineIcon}
            label="Estadísticas"
            href="/profile/stats"
          />
          <MenuItem
            icon={TriangleAlertIcon}
            label="Multas y pagos"
            href="/profile/infractions"
          />
          <MenuItem
            icon={Wallet}
            label="Métodos de Pago"
            href="/profile/payment-methods"
          />
          <View className="w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Pressable className="flex-row items-center gap-2 ml-10 pl-1 active:opacity-60">
                  <LogOut size={28} color="#0d4da0" />
                  <Text className="font-bold text-2xl text-secondary-foreground">
                    Cerrar sesión
                  </Text>
                </Pressable>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="bg-primary-foreground"
                overlayClassName="backdrop-blur-md bg-black/30"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Seguro de que quieres cerrar sesión?
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    <Text>Cancelar</Text>
                  </AlertDialogCancel>
                  <AlertDialogAction onPress={handleAccept}>
                    <Text className="font-bold text-white">Sí, aceptar</Text>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Separator className="mt-3 bg-gray-500" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
