import { Text, View } from "react-native";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

import type { Status } from "./status-badge";
import StatusBadge from "./status-badge";

export type Product = {
  id: number;
  status: Status;
  name: string;
  img: string;
  salePrice?: number;
  saleDate?: Date;
};

type ProductProps = { product: Product };

export default function ProductCard({ product }: ProductProps) {
  return (
    <View className="flex-col">
      <Card className="flex-row border-0 h-24 gap-2 p-2 drop-shadow-2xl/10 z-20">
        <Avatar alt="@mrzachnugent" className="size-20 rounded-full">
          <AvatarImage
            source={{
              uri: product.img,
            }}
          />
        </Avatar>
        <View className="flex-col gap-1">
          <Text className="font-bold text-xs text-gray-800">
            {product.name}
          </Text>
          <StatusBadge status={product.status}></StatusBadge>
        </View>
        <View className="border w-full   border-red-600">
          <Text>ver subasta</Text>
        </View>
      </Card>
      {product.status === "revision" && (
        <View className="bg-[#6F889B] h-5 self-center items-center w-[85%] rounded-b-lg drop-shadow-2xl/6 z-10">
          <Text className="text-gray-50 text-xs font-bold">
            En caso de aprobado enviaremos su propuesta
          </Text>
        </View>
      )}
    </View>
  );
}
