import { Stack } from "expo-router";
import { ChevronUp, ListFilter, Menu } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const IMAGES = [
  "https://placehold.co/24x24",
  "https://placehold.co/24x24",
  "https://placehold.co/24x24",
];

const RANKS = [
  "Todas",
  "Común",
  "Especial",
  "Plata",
  "Oro",
  "Platino",
] as const;
type Ranks = (typeof RANKS)[number];

type Auction = {
  id: string;
  name: string;
  rank: Ranks;
  images: string[];
};

const AUCTIONS: Auction[] = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  name: `Subasta #${i + 1}`,
  rank: RANKS[(i % (RANKS.length - 1)) + 1],
  images: IMAGES,
}));

export default function AuctionsScreen() {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFilterOpen] = useState(false);
  const [rank, setRank] = useState<Ranks>("Todas");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AUCTIONS.filter(a => {
      const matchesText = !q || a.name.toLowerCase().includes(q);
      const matchesRank = rank === "Todas" || a.rank === rank;
      return matchesText && matchesRank;
    });
  }, [search, rank]);

  const openCatalog = (auction: Auction) => {
    console.log("Open catalog for", auction.id);
  }; // TODO: Implement navigation to catalog screen

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName=" p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold">Subastas</Text>
          <Pressable
            hitSlop={8}
            onPress={() => {
              /* TODO: open Menu*/
            }}
          >
            <Menu size={26} className="text-foreground" />
          </Pressable>
        </View>
        <Input
          placeholder="Buscar subastas..."
          className="border-none bg-primary mb-4"
          value={search}
          onChangeText={setSearch}
        />
        <Collapsible open={filtersOpen} onOpenChange={setFilterOpen}>
          <CollapsibleTrigger asChild>
            <Pressable className="flex flex-row justify-between items-center mb-2">
              <Text className="font-semibold text-md text-muted-foreground">
                Encontrá lo que buscas
              </Text>
              {filtersOpen ? (
                <ChevronUp size={20} className="text-muted-foreground" />
              ) : (
                <ListFilter size={20} className="text-muted-foreground" />
              )}
            </Pressable>
          </CollapsibleTrigger>
          <Separator className="bg-gray-300" />

          <CollapsibleContent>
            <View className="flex flex-row flex-wrap gap-2 py-3">
              {RANKS.map(c => {
                const active = c === rank;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setRank(c)}
                    className={`px-3 py-1.5 rounded-full border ${
                      active
                        ? "bg-primary border-primary"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={
                        active ? "text-white font-semibold" : "text-foreground"
                      }
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </CollapsibleContent>
        </Collapsible>

        <Separator className="bg-gray-300" />

        <View className="justify-center items-center w-full mt-2">
          {filtered.length === 0 && (
            <Text className="text-muted-foreground py-8">
              No se encontraron subastas
            </Text>
          )}

          {filtered.map(auction => (
            <View
              key={auction.id}
              className="w-full mt-3 mb-5 drop-shadow-xl/50 rounded-lg bg-white transition delay-150 duration-300 ease-in-out hover:-translate-y-1 active:-translate-y-1"
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
