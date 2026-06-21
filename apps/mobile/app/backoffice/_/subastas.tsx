import { useState } from "react";
import { View } from "react-native";

import { type AuctionCategory, PRODUCT_CATEGORIES } from "@subaspedia/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

import { QueryState, SectionHeader, SelectableRow } from "./shared";

// Feature 3: creación de subastas con uno o más catálogos.
export function SubastasSection() {
  const catalogs = api.backoffice.listDraftCatalogs.useQuery();
  const auctioneers = api.backoffice.listAuctioneers.useQuery();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<AuctionCategory | null>(null);
  const [auctioneerId, setAuctioneerId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);

  const create = api.backoffice.createAuction.useMutation({
    onSuccess: () => {
      setDate("");
      setTime("");
      setLocation("");
      setCategory(null);
      setAuctioneerId(null);
      setSelected([]);
      catalogs.refetch();
    },
  });

  const toggle = (id: number) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );

  const valid =
    date.trim().length > 0 &&
    time.trim().length > 0 &&
    category !== null &&
    selected.length > 0;

  const categoryLabel = PRODUCT_CATEGORIES.find(
    c => c.value === category,
  )?.label;
  const auctioneerName = auctioneers.data?.find(
    a => a.id === auctioneerId,
  )?.name;

  return (
    <View className="gap-3">
      <SectionHeader
        title="Nueva subasta"
        hint="Creá una subasta y asignale uno o más catálogos. La fecha debe ser posterior a 10 días desde hoy."
      />

      <View className="flex-row gap-2">
        <Input
          value={date}
          onChangeText={setDate}
          placeholder="Fecha (YYYY-MM-DD)"
          className="bg-secondary flex-1 border-none"
        />
        <Input
          value={time}
          onChangeText={setTime}
          placeholder="Hora (HH:MM)"
          className="bg-secondary flex-1 border-none"
        />
      </View>

      <Input
        value={location}
        onChangeText={setLocation}
        placeholder="Ubicación (opcional)"
        className="bg-secondary border-none"
      />

      <Select
        value={
          category
            ? { value: category, label: categoryLabel ?? category }
            : undefined
        }
        onValueChange={opt =>
          setCategory(opt ? (opt.value as AuctionCategory) : null)
        }
      >
        <SelectTrigger className="bg-secondary w-full rounded-lg border-none">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent className="border-none bg-white drop-shadow-lg">
          {PRODUCT_CATEGORIES.map(c => (
            <SelectItem key={c.value} value={c.value} label={c.label}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={
          auctioneerId
            ? { value: String(auctioneerId), label: auctioneerName ?? "" }
            : undefined
        }
        onValueChange={opt => setAuctioneerId(opt ? Number(opt.value) : null)}
      >
        <SelectTrigger className="bg-secondary w-full rounded-lg border-none">
          <SelectValue placeholder="Subastador (opcional)" />
        </SelectTrigger>
        <SelectContent className="border-none bg-white drop-shadow-lg">
          {(auctioneers.data ?? []).map(a => (
            <SelectItem key={a.id} value={String(a.id)} label={a.name}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Text className="text-muted-foreground mt-1 text-sm">
        Catálogos a incluir
      </Text>
      <QueryState
        isLoading={catalogs.isLoading}
        error={catalogs.error}
        empty={catalogs.data?.length === 0}
        emptyText="No hay catálogos disponibles. Armá uno primero."
      />
      {catalogs.data?.map(c => (
        <SelectableRow
          key={c.id}
          selected={selected.includes(c.id)}
          onPress={() => toggle(c.id)}
          title={c.description}
          subtitle={`${c.itemCount} ${c.itemCount === 1 ? "bien" : "bienes"}`}
        />
      ))}

      <Button
        disabled={!valid || create.isPending}
        onPress={() =>
          category &&
          create.mutate({
            date: date.trim(),
            time: time.trim(),
            category,
            location: location.trim() || undefined,
            auctioneerId: auctioneerId ?? undefined,
            catalogIds: selected,
          })
        }
      >
        <Text className="font-semibold text-white">
          {create.isPending
            ? "Creando..."
            : `Crear subasta (${selected.length})`}
        </Text>
      </Button>
      {create.error && (
        <Text className="text-red-500 text-sm">{create.error.message}</Text>
      )}
    </View>
  );
}
