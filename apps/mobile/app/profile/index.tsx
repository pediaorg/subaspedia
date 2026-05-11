import { Link } from "expo-router";
import {
  CircleStarIcon,
  FileJson2Icon,
  Package,
  Pencil,
  Settings,
  TriangleAlertIcon,
  Wallet,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { MenuItem } from "@/components/profile/menu-item";
import { StatCard } from "@/components/profile/stat-card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  return (
    <View className="flex-1 px-4 gap-6 py-16">
      {/* header */}
      <View>
        <Text>header</Text>
      </View>
      {/* card de profile */}
      <View className="relative">
        <Avatar
          alt="@mrzachnugent"
          className=" self-center absolute size-40 z-10"
        >
          <AvatarImage
            source={{
              uri: "https://avatars.githubusercontent.com/u/66040481?v=4",
            }}
          ></AvatarImage>
        </Avatar>
        <Card className="bg-blue-400 mt-20 p-5">
          <View className="mt-16 flex-row gap-2">
            <View>
              <Text className="text-white text-xl font-bold">
                Juan I. Casareski
              </Text>
              <Text className="text-gray-300">jcasareski@uade.edu.ar</Text>
            </View>
            <Badge className="self-start flex-row justify-between mt-1.5 h-5 w-24 bg-amber-300">
              {" "}
              {/*Aca, tendría que recibir un parametro para el color y la tag*/}
              <CircleStarIcon className="aboslute size-4" />
              <Text className="font-bold text-xs">BRONCE</Text>
            </Badge>
          </View>
          <View className="flex-row gap-5 ">
            <StatCard value={8} label="Cantidad de subastas" />
            <StatCard value={8} label="Subastas ganadas" />
            <StatCard value={8} label="Categoría favorita" />
          </View>
        </Card>
      </View>

      {/* Menu options */}
      <View className="gap-3 my-9">
        <MenuItem icon={Pencil} label="Editar Perfil" link="/profile/edit" />
        <MenuItem
          icon={Package}
          label="Mis Productos"
          link="/profile/products"
        />
        <MenuItem
          icon={FileJson2Icon}
          label="Subastas"
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
  );
}
