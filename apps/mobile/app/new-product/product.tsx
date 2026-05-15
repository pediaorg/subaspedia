import { Stack } from "expo-router";
import { Info, Plus, Terminal } from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

const MIN_IMAGES = 6;

const CATEGORIES = [
  { value: "common", label: "Común" },
  { value: "special", label: "Especial" },
  { value: "silver", label: "Plata" },
  { value: "gold", label: "Oro" },
  { value: "platinum", label: "Platino" },
];

export default function PostProduct() {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<{
    value: string;
    label: string;
  }>();
  const [stock, setStock] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [interest, setInterest] = React.useState("");
  const [images, setImages] = React.useState<
    { id: string; uri: string | null }[]
  >(() =>
    Array.from({ length: MIN_IMAGES }, (_, i) => ({
      id: `slot-${i}`,
      uri: null,
    })),
  );
  const [acceptConditions, setAcceptConditions] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [acceptLegally, setAcceptLegally] = React.useState(false);

  const filledImages = images.filter(img => img.uri).length;
  const canSubmit =
    !!name.trim() &&
    !!category &&
    !!price.trim() &&
    acceptConditions &&
    acceptTerms &&
    acceptLegally;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="h3" className="font-bold text-center">
          Subastar un producto
        </Text>

        <Separator className="bg-gray-300" />

        <View className="bg-warning drop-shadow-md/40 flex-row items-center gap-2 rounded-lg p-3">
          <Alert
            icon={Info}
            iconClassName="text-white"
            className="border-none items-center bg-transparent"
          >
            <AlertTitle className="text-white">
              La empresa puede designar una colección cuando el lote tiene
              numerosos artículos
            </AlertTitle>
          </Alert>
        </View>

        <Card className="bg-white drop-shadow-md/40 border-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Datos</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <Field label="Nombre del objeto">
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Ej. Cuadro firmado"
                className="bg-secundary border-none"
              />
            </Field>

            <Field label="Categoría">
              <Select
                value={category}
                onValueChange={option => setCategory(option ?? undefined)}
              >
                <SelectTrigger className="w-full bg-secundary border-none">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent className="bg-white border-none drop-shadow-lg">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value} label={c.label}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <View className="flex-row gap-3">
              <Field label="Número" className="flex-1">
                <Input
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="number-pad"
                  placeholder="0"
                  className="bg-secundary border-none"
                />
              </Field>
              <Field label="Precio" className="flex-1">
                <Input
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  className="bg-secundary border-none"
                />
              </Field>
            </View>

            <Field label="Descripción">
              <Textarea
                value={description}
                onChangeText={setDescription}
                placeholder="Detalles del objeto"
                className="bg-secundary border-none"
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="bg-primary drop-shadow-md/40 border-none">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-white text-2xl font-bold">
              Imágenes
            </CardTitle>
            <Text className="text-white text-sm">mín. {MIN_IMAGES}</Text>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row flex-wrap gap-3">
              {images.map(slot => (
                <ImageSlot
                  key={slot.id}
                  uri={slot.uri}
                  onPress={() => {
                    setImages(prev =>
                      prev.map(s =>
                        s.id === slot.id
                          ? { ...s, uri: s.uri ? null : "placeholder" }
                          : s,
                      ),
                    );
                  }}
                />
              ))}
            </View>
            <Text className="text-white text-xs">
              Seleccioná hasta {MIN_IMAGES} imágenes del producto. (
              {filledImages}/{MIN_IMAGES})
            </Text>
          </CardContent>
        </Card>

        <Card className="bg-white border-none drop-shadow-md/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Dato de interés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Field label="Ingresá un dato importante sobre el objeto">
              <Input
                value={interest}
                onChangeText={setInterest}
                placeholder="Ej. firmado por el autor"
                className="bg-secundary border-none"
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="bg-primary drop-shadow-md/40 border-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              Términos y condiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <CheckRow checked={acceptConditions} onChange={setAcceptConditions}>
              Acepto las{" "}
              <Text className="text-white text-sm underline">
                condiciones operativas
              </Text>{" "}
              de proceso de subasta.
            </CheckRow>
            <CheckRow checked={acceptLegally} onChange={setAcceptLegally}>
              Declaro que el bien a subastar es de mi propiedad y que no posee
              ningún impedimento legal, judicial o administrativo para ser
              subastado
            </CheckRow>
            <Separator className="my-1 bg-white" />
            <CheckRow checked={acceptTerms} onChange={setAcceptTerms}>
              Acepto los términos y condiciones.
            </CheckRow>
          </CardContent>
        </Card>

        <Button
          disabled={!canSubmit}
          onPress={() => {
            // submit
          }}
          size="lg"
          className="bg-accent-foreground border-0 rounded-2xl py-4 shadow-none focus:outline-none focus-visible:ring-0 focus-visible:border-transparent"
        >
          <Text className="text-white font-bold text-base">
            Enviar a revisión
          </Text>
        </Button>

        <Text className="text-accent-foreground text-center text-xs">
          La publicación quedará pendiente hasta que un agente de la plataforma
          la revise.
        </Text>
      </ScrollView>
    </>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </View>
  );
}

function ImageSlot({
  uri,
  onPress,
}: {
  uri: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="border-white bg-muted/40 active:bg-muted aspect-square w-[30%] items-center justify-center rounded-md border border-dashed"
    >
      {uri ? (
        <Text className="text-muted-foreground text-xs">Imagen</Text>
      ) : (
        <Icon as={Plus} size={20} className="text-white" />
      )}
    </Pressable>
  );
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-start gap-3"
    >
      <View className="pt-0.5">
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          className="border-white"
          checkedClassName="border-white"
          indicatorClassName="bg-white"
          iconClassName="text-black"
        />
      </View>
      <Text className="flex-1 text-white text-sm">{children}</Text>
    </Pressable>
  );
}
