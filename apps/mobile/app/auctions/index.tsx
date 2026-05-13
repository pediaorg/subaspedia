import { Stack } from "expo-router";
import { ListFilter } from "lucide-react-native";
import { Image, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const IMAGES = [
  "https://placehold.co/24x24",
  "https://placehold.co/24x24",
  "https://placehold.co/24x24",
];

const auction = {
  id: "1",
  rank: "ORO",
  images: IMAGES,
};

const AUCTIONS = Array.from({ length: 6 }, (_, i) => ({
  ...auction,
  id: String(i + 1),
}));

export default function AuctionsScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName=" p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold mb-4">Subastas</Text>
        <Input
          placeholder="Buscar subastas..."
          className="border-none bg-primary mb-4"
        />
        <View className="flex flex-row justify-between mb-2">
          <Text className="font-semibold text-md text-muted-foreground">
            Encontrá lo que buscas
          </Text>
          <ListFilter className="text-muted-foreground" size={20} />
        </View>
        <Separator className="bg-gray-300" />
        <View className="justify-center items-center w-full mt-2">
          {AUCTIONS.map(auction => (
            <View
              key={auction.id}
              className="w-full mt-3 mb-5 drop-shadow-xl/50 hover: duration-300 focus:drop-shadow-xl/80 active:drop-shadow-xl/80 rounded-lg bg-white transition delay-150 duration-300 ease-in-out hover:-translate-y-1 focus:-translate-y-1 active:-translate-y-1"
            >
              <Image
                source={{ uri: "https://placehold.co/800x600" }}
                className="w-full h-40 rounded-t-lg"
              />
              <View className="h-12 bg-primary flex flex-row justify-between items-center rounded-b-lg px-4 drop-shadow-top-lg/50">
                <View className="p-1">
                  <Text className="text-white font-bold">Catálogo</Text>
                  <View className="flex flex-row">
                    {auction.images.map((uri, index) => (
                      <Image
                        key={uri}
                        source={{ uri }}
                        className={`w-6 h-6 rounded-full border border-primary drop-shadow-lg ${
                          index === 0 ? "" : "-ml-2"
                        }`}
                      />
                    ))}
                  </View>
                </View>
                <Button
                  className="border-border h-8 bg-white rounded-full drop-shadow-lg hover:bg-white/90 active:bg-white/90 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary/80"
                  size="sm"
                >
                  Entrar
                </Button>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}
