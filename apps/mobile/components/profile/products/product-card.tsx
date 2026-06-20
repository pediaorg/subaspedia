import { Link } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";

import type { Product } from "@subaspedia/types/product";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

import StatusBadge from "./status-badge";

type ProductProps = { product: Product };

type Action = { label: string; href: string; ready: boolean };

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function getActionForStatus(product: Product): Action | null {
  switch (product.status) {
    case "approved":
    case "auctioned":
      return product.auctionId
        ? {
            label: "Ver subasta",
            href: `/auctions/${product.auctionId}`,
            ready: false,
          }
        : null;
    case "appraised":
      return {
        label: "Ver propuesta",
        href: `/profile/products/${product.id}/proposal`,
        ready: true,
      };
    case "under_review":
    case "rejected":
      return null;
  }
}

function ActionElement({ action }: { action: Action }) {
  const pressable = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      className="active:opacity-60 pr-2"
      onPress={
        action.ready
          ? undefined
          : () => Alert.alert("TODO", `Ruta no implementada: ${action.href}`)
      }
    >
      <Text className="text-xs text-gray-700 underline">{action.label}</Text>
    </Pressable>
  );

  if (action.ready) {
    return (
      <Link href={action.href} asChild>
        {pressable}
      </Link>
    );
  }
  return pressable;
}

export default function ProductCard({ product }: ProductProps) {
  const action = getActionForStatus(product);

  return (
    <View className="flex-col">
      <Card className="flex-row items-center border-0 h-24 gap-3 p-2 drop-shadow-2xl/10 z-20">
        <Avatar alt={product.name} className="size-20 rounded-full">
          <AvatarImage source={{ uri: product.img }} />
        </Avatar>
        <View className="flex-1 flex-col gap-0.5">
          <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>
            {product.name}
          </Text>
          <StatusBadge status={product.status} />
          {product.status === "auctioned" &&
            product.salePrice !== null &&
            product.saleDate !== null && (
              <Text className="text-xs text-gray-600">
                {currencyFormatter.format(product.salePrice)} ·{" "}
                {dateFormatter.format(new Date(product.saleDate))}
              </Text>
            )}
        </View>
        {action && <ActionElement action={action} />}
      </Card>
      {product.status === "under_review" && (
        <View className="bg-[#6F889B] h-5 self-center items-center w-[85%] rounded-b-lg drop-shadow-2xl/6 z-10">
          <Text className="text-gray-50 text-xs font-bold">
            En caso de aprobado enviaremos su propuesta
          </Text>
        </View>
      )}
    </View>
  );
}
