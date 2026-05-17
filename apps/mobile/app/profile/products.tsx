import { Text, View } from "react-native";

import type { Product } from "@/components/profile/products/product-card";
import ProductCard from "@/components/profile/products/product-card";
import StatusBadge from "@/components/profile/products/status-badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const MOCK_Products: Product[] = [
  {
    id: 1,
    status: "aprobado",
    name: "taza de té China",
    img: "https://fastly.picsum.photos/id/1080/80/80.jpg?hmac=E94lZVPkK-ACkKPbJKkdX5GRkhV5dUuVJADHI9qMVi0",
  },
  {
    id: 2,
    status: "rechazado",
    name: "Piano de Cola Yamaha GB1K",
    img: "https://fastly.picsum.photos/id/1080/80/80.jpg?hmac=E94lZVPkK-ACkKPbJKkdX5GRkhV5dUuVJADHI9qMVi0",
  },
  {
    id: 3,
    status: "revision",
    name: "Tetera de porcelana",
    img: "https://fastly.picsum.photos/id/1080/80/80.jpg?hmac=E94lZVPkK-ACkKPbJKkdX5GRkhV5dUuVJADHI9qMVi0",
  },
  {
    id: 4,
    status: "tasado",
    name: "Florero antiguo",
    img: "https://fastly.picsum.photos/id/1080/80/80.jpg?hmac=E94lZVPkK-ACkKPbJKkdX5GRkhV5dUuVJADHI9qMVi0",
  },
  {
    id: 5,
    status: "subastado",
    name: "Reloj de bolsillo",
    img: "https://fastly.picsum.photos/id/1080/80/80.jpg?hmac=E94lZVPkK-ACkKPbJKkdX5GRkhV5dUuVJADHI9qMVi0",

    salePrice: 340000,
    saleDate: new Date("2026-04-12"),
  },
];

export default function UserProducts() {
  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Mis Productos</Text>
        <Separator className="bg-gray-500" />
      </View>
      <View className="flex-col w-full gap-8">
        {/* ACA VAN LAS CARDS */}
        <ProductCard product={MOCK_Products[2]} />
      </View>
    </View>
  );
}
