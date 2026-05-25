import { Link } from "expo-router";
import {
  LogOut,
  LucideHammer,
  Package,
  Pencil,
  Settings,
  TriangleAlertIcon,
  Wallet,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { isOnboarded } from "@subaspedia/types/user";
import { MenuItem } from "@/components/profile/menu-item";
import { NotLoggedProfile } from "@/components/profile/not-logged";
import RankBadge from "@/components/profile/rank-badge";
import { StatCard } from "@/components/profile/stat-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuth } from "@/lib/auth";
import { DEFAULT_AVATAR_URI } from "@/lib/constants";

export default function Profile() {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <NotLoggedProfile />;
  return <ProfileAuthed />;
}

function ProfileAuthed() {
  const { data: user } = useCurrentUser();
  if (!user) return <Text>Cargando usuario...</Text>;
  return (
    <View className="flex-1 gap-6">
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
                  {user &&
                    (isOnboarded(user)
                      ? `${user?.name} ${user?.surname}`.trim()
                      : "Completá tu perfil")}
                </Text>
                <Text className="text-gray-300">{user?.email}</Text>
              </View>
              {user?.category && (
                <Link href="/rank" asChild>
                  <Pressable className="active:opacity-60">
                    <RankBadge category={user.category} />
                  </Pressable>
                </Link>
              )}
            </View>
            <View className="flex-row gap-5 ">
              <StatCard value={8} label="Cantidad de subastas" />
              <StatCard value={8} label="Subastas ganadas" />
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
        {/* Menu options */}
        <View className="gap-3 mb-9 px-5 py-6">
          <MenuItem icon={Pencil} label="Editar Perfil" href="/profile/edit" />
          <MenuItem
            icon={Package}
            label="Mis Productos"
            href="/profile/products"
          />
          <MenuItem
            icon={LucideHammer}
            label="subastas"
            href="/profile/auctions"
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
                <Pressable className="flex-row gap-2 ml-10 pl-1 active:opacity-60">
                  <LogOut className="size-8 color-secondary-foreground" />
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
                  {/* <AlertDialogAction onPress={handleAccept}>
                    <Text className="font-bold text-white">Sí, aceptar</Text>
                  </AlertDialogAction> */}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Separator className="mt-3 bg-gray-500" />
          </View>
        </View>
      </View>
    </View>
  );
}
