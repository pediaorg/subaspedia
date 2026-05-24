import { Link } from "expo-router";
import {
  CircleStarIcon,
  FileJson2Icon,
  LucideHammer,
  Package,
  Pencil,
  Settings,
  TriangleAlertIcon,
  Wallet,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { MenuItem } from "@/components/profile/menu-item";
import RankBadge from "@/components/profile/rank-badge";
import { StatCard } from "@/components/profile/stat-card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Tier = "comun" | "especial" | "plata" | "oro" | "platino";

export default function Profile() {
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
              alt="@mrzachnugent"
              className="border absolute size-full border-border"
            >
              <AvatarImage
                source={{
                  uri: "https://avatars.githubusercontent.com/u/66040481?v=4",
                }}
              ></AvatarImage>
            </Avatar>
          </View>
          <Card className="bg-primary border-0 drop-shadow-lg/30 mt-20 p-5 mx-5 z-20">
            <View className="mt-16 flex-row gap-2 justify-between">
              <View>
                <Text className="text-white text-xl font-bold">
                  Juan I. Casareski
                </Text>
                <Text className="text-gray-300">jcasareski@uade.edu.ar</Text>
              </View>
              <Link href="/rank" asChild>
                <Pressable className="active:opacity-60">
                  <RankBadge tier="comun" />
                </Pressable>
              </Link>
            </View>
            <View className="flex-row gap-5 ">
              <StatCard value={8} label="Cantidad de subastas" />
              <StatCard value={8} label="Subastas ganadas" />
              <StatCard value={8} label="Categoría favorita" />
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
          <MenuItem icon={Pencil} label="Editar Perfil" link="/profile/edit" />
          <MenuItem
            icon={Package}
            label="Mis Productos"
            link="/profile/products"
          />
          <MenuItem
            icon={LucideHammer}
            label="subastas"
            link="/profile/auctions"
          />
          <MenuItem
            icon={TriangleAlertIcon}
            label="Multas y pagos"
            link="/profile/infractions"
          />
          <MenuItem
            icon={Wallet}
            label="Métodos de Pago"
            link="/profile/payment-methods"
          />
          <MenuItem
            icon={Settings}
            label="Configuración"
            link="/profile/settings"
          />
        </View>
      </View>
    </View>
  );
}
