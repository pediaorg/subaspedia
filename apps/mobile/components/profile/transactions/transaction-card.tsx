import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { Transaction } from "@subaspedia/types/transaction";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

import OrderStatusBadge from "./order-status-badge";

type TransactionProps = { transaction: Transaction };

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Calcada de ProductCard: avatar redondo con la foto del producto comprado +
// nombre + badge de estado del pedido + total pagado · fecha. Tappable: lleva
// al detalle (factura + elegir envío/retiro).
export default function TransactionCard({ transaction }: TransactionProps) {
  return (
    <Link href={`/profile/transactions/${transaction.id}`} asChild>
      <Pressable accessibilityRole="button" className="active:opacity-70">
        <Card className="flex-row items-center border-0 gap-3 p-3 drop-shadow-xl/2 z-20">
          <Avatar
            alt={transaction.productName}
            className="size-20 rounded-full"
          >
            <AvatarImage source={{ uri: transaction.img }} />
          </Avatar>
          <View className="flex-1 flex-col gap-0.5">
            <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>
              {transaction.productName}
            </Text>
            <OrderStatusBadge status={transaction.status} />
            <Text className="text-xs text-gray-600">
              {formatMoney(transaction.amount, transaction.currency)} ·{" "}
              {dateFormatter.format(new Date(transaction.date))}
            </Text>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
