import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { photoUri } from "@/lib/photo";

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canBid } = useAuth();

  // 1. Estados locales
  const [bidAmount, setBidAmount] = useState("");

  // 2. Parseo seguro del ID (Evita llamadas a la API con NaN)
  const auctionId = Number(id);
  const isValidId = !isNaN(auctionId) && auctionId > 0;

  // 3. Queries (Mismo patrón que index.tsx)
  const { data: rawAuction, isLoading: auctionLoading } =
    api.auctions.getDetail.useQuery(
      { auctionId: isValidId ? auctionId : 0 },
      { enabled: isValidId },
    );

  const { data: rawBids } = api.auctions.getBids.useQuery(
    { auctionId: isValidId ? auctionId : 0 },
    { enabled: isValidId },
  );

  // 4. Transformación / Memorización de datos
  const auction = useMemo(() => rawAuction ?? null, [rawAuction]);
  const bids = useMemo(() => rawBids ?? [], [rawBids]);

  // 5. Mutación
  const { mutate: placeBid, isPending: isBidding } =
    api.auctions.placeBid.useMutation({
      onSuccess: () => {
        console.log("¡ÉXITO! La mutación terminó bien");
        setBidAmount("");
        queryClient.invalidateQueries({
          queryKey: api.auctions.getDetail.queryKey({ input: { auctionId } }),
        });
        queryClient.invalidateQueries({
          queryKey: api.auctions.getBids.queryKey({ input: { auctionId } }),
        });
        alert("✓ Puja realizada"); // Usamos alert() nativo de web por si acaso
      },
      onError: error => {
        console.log("ERROR EN LA MUTACIÓN:", error);
        alert("Error: " + (error.message || "No se pudo registrar"));
      },
    });

  // 6. Handlers
  const handlePlaceBid = () => {
    console.log("1. Botón clickeado. Monto escrito:", bidAmount);
    console.log("2. Permiso para pujar (canBid):", canBid);

    // if (!canBid) {
    //   console.log("-> DETENIDO: canBid es falso. El usuario no tiene permiso.");
    //   alert("No puedes pujar. Necesitas verificar un medio de pago");
    //   return;
    // }

    const amount = parseFloat(bidAmount);
    console.log("3. Monto convertido a número:", amount);

    if (isNaN(amount) || amount <= 0) {
      console.log("-> DETENIDO: El monto es inválido o menor a 0.");
      alert("Monto inválido. Ingresa un monto mayor a 0");
      return;
    }

    console.log(
      "4. Todo en orden, enviando al backend... auctionId:",
      auctionId,
    );
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
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Contenedor de la Imagen Superior */}
              <View className="relative w-full h-80">
                <Image
                  source={{
                    uri:
                      (auction.photoId ? photoUri(auction.photoId) : null) ||
                      "https://images.unsplash.com/photo-1590483864073-2b28c5a93df6?q=80&w=800&auto=format&fit=crop",
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Botones superpuestos a la imagen */}
                <View className="absolute top-14 w-full flex-row justify-between px-6 z-10">
                  <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-white/90 rounded-full p-2 shadow-sm"
                  >
                    <Ionicons name="arrow-back" size={24} color="black" />
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-white/90 rounded-full p-2 shadow-sm">
                    <Ionicons name="menu" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Contenedor Principal */}
              <View className="flex-1 bg-[#F8F9FA] rounded-t-3xl -mt-6 px-6 pt-8 pb-8">
                {/* Título, Fecha y Etiqueta LIVE */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-4">
                    <Text className="text-3xl font-black text-gray-900 leading-tight">
                      {/* Uso de ?. para evitar crasheos si la base de datos no trae catálogos */}
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
                  <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <Text className="text-blue-500 font-bold text-lg mb-1">
                      Catálogo
                    </Text>
                    <Text className="text-gray-600 font-medium">
                      {auction.catalogs?.length || 0} items
                    </Text>
                  </View>

                  {/* Card: Categoría */}
                  <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <Text className="text-blue-500 font-bold text-lg mb-1">
                      Categoría
                    </Text>
                    <Text className="text-gray-600 font-medium">
                      {auction.category || "Sin categoría"}
                    </Text>
                  </View>

                  {/* Card: Ubicación */}
                  <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <Text className="text-blue-500 font-bold text-lg mb-1">
                      Ubicación
                    </Text>
                    <Text className="text-gray-600 font-medium">
                      {auction.location || "No especificada"}
                    </Text>
                  </View>

                  {/* Card: Precio Actual */}
                  <View className="w-[48%] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 justify-center items-center flex-row">
                    <Ionicons
                      name="pricetag"
                      size={16}
                      color="#EAB308"
                      className="mr-2"
                    />
                    <Text className="text-blue-900 font-black text-2xl">
                      ${auction.currentBid || 0}
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
                          ${bid.amount}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Área de Input Fija al fondo */}
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
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
