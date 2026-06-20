import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Sidebar } from "@/components/app-header/sidebar";
import { CatalogDialog } from "@/components/auctions/catalog-dialog";
import { ProductDialog } from "@/components/auctions/product-dialog";
import { api } from "@/lib/api";
import type { Product } from "@/lib/auctions";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { photoUri } from "@/lib/photo";

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canBid } = useAuth();

  const CATEGORY_LABELS: Record<string, string> = {
    common: "Común",
    special: "Especial",
    silver: "Plata",
    gold: "Oro",
    platinum: "Platino",
  };

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // 1. Estados locales
  const [bidAmount, setBidAmount] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // 2. Parseo seguro del ID (Evita llamadas a la API con NaN)
  const auctionId = Number(id);
  const isValidId = !isNaN(auctionId) && auctionId > 0;

  // 3. Queries
  const { data: rawAuction, isLoading: auctionLoading } =
    api.auctions.getDetail.useQuery(
      { auctionId: isValidId ? auctionId : 0 },
      { enabled: isValidId },
    );

  const { data: rawBids } = api.auctions.getBids.useQuery(
    { auctionId: isValidId ? auctionId : 0 },
    { enabled: isValidId },
  );

  const auction = useMemo(() => rawAuction ?? null, [rawAuction]);
  const bids = useMemo(() => rawBids ?? [], [rawBids]);

  const catalogProducts = useMemo<Product[]>(() => {
    if (!auction?.catalogs?.[0]?.items) return [];

    return auction.catalogs[0].items.map(item => {
      const photos = item.product?.photos || [];
      const images = photos
        .map(ph => photoUri(ph.id))
        .filter((u): u is string => u !== null);
      const mainImage = photos.length > 0 ? photoUri(photos[0].id) : null;

      const base = {
        id: String(item.id),
        name: item.product?.name || "Sin nombre",
        category: "—",
        image: mainImage ?? "https://placehold.co/600x400",
        images: images,
        description: item.product?.fullDescription || "",
        currentOwner: "—",
        basePrice: item.basePrice,
        currency: auction.currency,
      };

      return { ...base, kind: "object" as const };
    });
  }, [auction]);

  // 5. Mutación
  const { mutate: placeBid, isPending: isBidding } =
    api.auctions.placeBid.useMutation({
      onSuccess: () => {
        setBidAmount("");
        queryClient.invalidateQueries();

        alert("Puja realizada");
      },
      onError: error => {
        alert("Error: " + (error.message || "No se pudo registrar"));
      },
    });

  // 6. Handlers
  const handlePlaceBid = () => {
    if (!canBid) {
      alert("No puedes pujar. Necesitas verificar un medio de pago");
      return;
    }

    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount <= 0) {
      alert("Monto inválido. Ingresa un monto mayor a 0");
      return;
    }

    placeBid({
      auctionId,
      amount,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 bg-[#F8F9FA]">
        <Stack.Screen options={{ headerShown: false }} />

        {auctionLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#1e40af" />
          </View>
        ) : !auction ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-800 text-lg">Subasta no encontrada</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-4 bg-blue-800 px-4 py-2 rounded-full"
            >
              <Text className="text-white font-semibold">Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* HEADER */}
            <View
              className="absolute w-full flex-row justify-between px-6 z-50"
              style={{ top: Math.max(insets.top, 20) }}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                onPress={() => router.navigate("/auctions")}
                className="bg-white/90 rounded-full p-3 shadow-sm"
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                className="bg-white/90 rounded-full p-3 shadow-sm"
              >
                <Ionicons name="menu" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* --- SCROLL --- */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View className="relative w-full h-80">
                <Image
                  source={{
                    uri:
                      (auction.photoId ? photoUri(auction.photoId) : null) ??
                      "https://images.unsplash.com/photo-1590483864073-2b28c5a93df6?q=80&w=800&auto=format&fit=crop",
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              {/* Contenedor Principal */}
              <View className="flex-1 bg-[#F8F9FA] rounded-t-3xl -mt-6 px-6 pt-8 pb-8">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-4">
                    <Text className="text-3xl font-black text-gray-900 leading-tight">
                      {auction.catalogs?.[0]?.items?.[0]?.product?.name ||
                        "Juego de té"}
                    </Text>
                    <Text className="text-gray-500 font-semibold mt-1">
                      {auction.date || "27/10/2026"}
                    </Text>
                  </View>
                  <View className="bg-blue-800 flex-row items-center px-3 py-1.5 rounded-full shadow-sm">
                    <Ionicons name="play" size={12} color="white" />
                    <Text className="text-white font-bold ml-1 text-xs">
                      LIVE
                    </Text>
                  </View>
                </View>

                {/* Descripción */}
                <Text className="text-gray-600 text-base leading-relaxed mb-6">
                  {auction.catalogs?.[0]?.items?.[0]?.product
                    ?.fullDescription ||
                    "Inspirado en la tradición británica, este juego de té combina detalles delicados con la nostalgia de las mejores sobremesas."}
                </Text>

                {/* Grid de Información */}
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  {/* Card: Catálogo */}
                  <TouchableOpacity
                    className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                    onPress={() => setIsCatalogOpen(true)}
                  >
                    <Text className="text-blue-500 font-bold text-lg mb-2">
                      Catálogo
                    </Text>
                    <View className="flex flex-row items-center">
                      {catalogProducts.slice(0, 4).map((product, index) => (
                        <Image
                          key={product.id}
                          source={{ uri: product.image }}
                          className={`w-8 h-8 rounded-full border-2 border-white shadow-sm ${
                            index === 0 ? "" : "-ml-3"
                          }`}
                        />
                      ))}

                      {catalogProducts.length > 4 && (
                        <View className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 -ml-3 items-center justify-center">
                          <Text className="text-xs font-bold text-gray-600">
                            +{catalogProducts.length - 4}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Card: Categoría */}
                  <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-around">
                    <Text className="text-blue-500 font-bold text-lg mb-1">
                      Categoría
                    </Text>
                    <Text className="text-gray-600 font-medium">
                      {auction.category
                        ? CATEGORY_LABELS[auction.category] || auction.category
                        : "Sin categoría"}
                    </Text>
                  </View>

                  {/* Card: Ubicación */}
                  <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-around">
                    <Text className="text-blue-500 font-bold text-lg mb-1">
                      Ubicación
                    </Text>
                    <Text className="text-gray-600 font-medium">
                      {auction.location || "No especificada"}
                    </Text>
                  </View>

                  {/* Card: Precio Actual */}
                  <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 justify-center items-center flex-row">
                    <Text className="text-blue-900 font-black text-2xl">
                      {formatMoney(
                        auction.currentBid ||
                          auction.catalogs[0].items[0].basePrice,
                        auction.currency,
                      )}
                    </Text>
                  </View>
                </View>

                {/* Lista de Pujas */}
                <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-6">
                  <Text className="text-blue-900 font-bold text-lg mb-4">
                    Pujas ({bids.length})
                  </Text>
                  {bids.length === 0 ? (
                    <Text className="text-gray-500 text-center py-4">
                      Sin pujas aún. ¡Sé el primero!
                    </Text>
                  ) : (
                    bids.map((bid, index) => (
                      <View
                        key={bid.id}
                        className="flex-row justify-between items-center mb-4 last:mb-0"
                      >
                        <View>
                          <Text
                            className={`text-base ${index === 0 ? "text-blue-900 font-bold text-lg" : "text-gray-500 font-medium"}`}
                          >
                            {bid.user}
                          </Text>
                          {index === 0 && (
                            <Text className="text-green-600 text-xs font-semibold">
                              Ganando
                            </Text>
                          )}
                        </View>
                        <Text
                          className={`text-base ${index === 0 ? "text-blue-900 font-black text-lg" : "text-gray-500 font-medium"}`}
                        >
                          {formatMoney(bid.amount, auction.currency)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </ScrollView>

            {/* --- INPUT --- */}
            {canBid ? (
              <View className="bg-white px-6 py-4 border-t border-gray-100 pb-8">
                <View className="flex-row items-center bg-[#F8F9FA] rounded-full border border-gray-200 p-2">
                  <TextInput
                    className="flex-1 px-4 text-base font-semibold text-gray-700 h-12 mr-2"
                    placeholder="Ingresa tu oferta..."
                    keyboardType="numeric"
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    editable={!isBidding}
                  />
                  <TouchableOpacity
                    disabled={isBidding}
                    onPress={handlePlaceBid}
                    className={`${isBidding ? "bg-gray-400" : "bg-blue-800"} w-12 h-12 rounded-full justify-center items-center shadow-sm`}
                  >
                    {isBidding ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="add" size={28} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="bg-[#F8F9FA] px-6 py-6 pb-12 items-center">
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  className="flex-row items-center justify-center bg-white rounded-full px-8 py-4 shadow-md border border-gray-200 w-[80%]"
                >
                  <Ionicons name="lock-closed" size={22} color="#F59E0B" />
                  <Text className="text-gray-600 font-bold text-lg underline ml-3">
                    Inicia sesión
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <CatalogDialog
        open={isCatalogOpen}
        onOpenChange={setIsCatalogOpen}
        products={catalogProducts}
        onSelectProduct={product => {
          setIsCatalogOpen(false);
          setDetailProduct(product);
        }}
      />

      <ProductDialog
        product={detailProduct}
        open={detailProduct !== null}
        onOpenChange={open => !open && setDetailProduct(null)}
      />
    </KeyboardAvoidingView>
  );
}
