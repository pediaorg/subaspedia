import { useState } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

import { Card, QueryState, SectionHeader, SelectableRow } from "./shared";

// Feature 2: armado de catálogos con bienes ya cotizados y confirmados.
export function CatalogosSection() {
  const items = api.backoffice.confirmedItems.useQuery();
  const drafts = api.backoffice.listDraftCatalogs.useQuery();
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const create = api.backoffice.createCatalog.useMutation({
    onSuccess: () => {
      setDescription("");
      setSelected([]);
      items.refetch();
      drafts.refetch();
    },
  });

  const toggle = (id: number) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );

  const valid = description.trim().length > 0 && selected.length > 0;

  return (
    <View className="gap-6">
      <View className="gap-3">
        <SectionHeader
          title="Nuevo catálogo"
          hint="Agrupá bienes ya cotizados y confirmados en un catálogo. Después lo asignás a una subasta."
        />
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="Descripción del catálogo"
          className="bg-secondary border-none"
        />

        <QueryState
          isLoading={items.isLoading}
          error={items.error}
          empty={items.data?.length === 0}
          emptyText="No hay bienes confirmados disponibles"
        />
        {items.data?.map(it => (
          <SelectableRow
            key={it.id}
            selected={selected.includes(it.id)}
            onPress={() => toggle(it.id)}
            title={it.productName}
            subtitle={`Base $${it.basePrice} · Comisión $${it.commission}`}
          />
        ))}

        <Button
          disabled={!valid || create.isPending}
          onPress={() =>
            create.mutate({
              description: description.trim(),
              itemIds: selected,
            })
          }
        >
          <Text className="font-semibold text-white">
            {create.isPending
              ? "Creando..."
              : `Crear catálogo (${selected.length})`}
          </Text>
        </Button>
        {create.error && (
          <Text className="text-red-500 text-sm">{create.error.message}</Text>
        )}
      </View>

      <View className="gap-3">
        <SectionHeader
          title="Catálogos sin subasta"
          hint="Catálogos ya armados, listos para asignar a una subasta."
        />
        <QueryState
          isLoading={drafts.isLoading}
          error={drafts.error}
          empty={drafts.data?.length === 0}
          emptyText="No hay catálogos sin subasta"
        />
        {drafts.data?.map(c => (
          <Card key={c.id}>
            <Text className="font-semibold">{c.description}</Text>
            <Text className="text-muted-foreground text-sm">
              {c.itemCount} {c.itemCount === 1 ? "bien" : "bienes"}
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );
}
