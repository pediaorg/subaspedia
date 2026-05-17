import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import { Info, Plus } from "lucide-react-native";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, View } from "react-native";

import {
  MIN_PRODUCT_IMAGES,
  type NewProductFormInput,
  type NewProductFormOutput,
  newProductSchema,
  PRODUCT_CATEGORIES,
} from "@subaspedia/types";
import { Alert, AlertTitle } from "@/components/ui/alert";
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

export default function PostProduct() {
  const { control, handleSubmit, watch, setValue, formState } = useForm<
    NewProductFormInput,
    unknown,
    NewProductFormOutput
  >({
    resolver: zodResolver(newProductSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      stock: "",
      price: "",
      description: "",
      interest: "",
      images: [],
      acceptConditions: false,
      acceptLegally: false,
      acceptTerms: false,
    },
  });

  const images = watch("images") ?? [];
  const slots = React.useMemo(
    () =>
      Array.from({ length: MIN_PRODUCT_IMAGES }, (_, i) => ({
        id: `slot-${i}`,
        uri: images[i] ?? null,
      })),
    [images],
  );

  const toggleSlot = (index: number) => {
    const next = [...images];
    if (next[index]) {
      next.splice(index, 1);
    } else {
      next[index] = "placeholder";
    }
    setValue("images", next.filter(Boolean), { shouldValidate: true });
  };

  const onSubmit = (data: NewProductFormOutput) => {
    console.log("submit", data);
  };

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
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field
                  label="Nombre del objeto"
                  error={fieldState.error?.message}
                >
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Ej. Cuadro firmado"
                    className="bg-secundary border-none"
                  />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="category"
              render={({ field, fieldState }) => {
                const selected = PRODUCT_CATEGORIES.find(
                  c => c.value === field.value,
                );
                return (
                  <Field label="Categoría" error={fieldState.error?.message}>
                    <Select
                      value={selected}
                      onValueChange={option =>
                        field.onChange(option?.value ?? undefined)
                      }
                    >
                      <SelectTrigger className="w-full bg-secundary border-none">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-none drop-shadow-lg">
                        {PRODUCT_CATEGORIES.map(c => (
                          <SelectItem
                            key={c.value}
                            value={c.value}
                            label={c.label}
                          >
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                );
              }}
            />

            <View className="flex-row gap-3">
              <Controller
                control={control}
                name="stock"
                render={({ field, fieldState }) => (
                  <Field
                    label="Número"
                    className="flex-1"
                    error={fieldState.error?.message}
                  >
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="number-pad"
                      placeholder="0"
                      className="bg-secundary border-none"
                    />
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="price"
                render={({ field, fieldState }) => (
                  <Field
                    label="Precio"
                    className="flex-1"
                    error={fieldState.error?.message}
                  >
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="decimal-pad"
                      placeholder="0,00"
                      className="bg-secundary border-none"
                    />
                  </Field>
                )}
              />
            </View>

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <Field label="Descripción" error={fieldState.error?.message}>
                  <Textarea
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Detalles del objeto"
                    className="bg-secundary border-none"
                  />
                </Field>
              )}
            />
          </CardContent>
        </Card>

        <Card className="bg-primary drop-shadow-md/40 border-none">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-white text-2xl font-bold">
              Imágenes
            </CardTitle>
            <Text className="text-white text-sm">
              mín. {MIN_PRODUCT_IMAGES}
            </Text>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row flex-wrap gap-3">
              {slots.map((slot, i) => (
                <ImageSlot
                  key={slot.id}
                  uri={slot.uri}
                  onPress={() => toggleSlot(i)}
                />
              ))}
            </View>
            <Text className="text-white text-xs">
              Seleccioná hasta {MIN_PRODUCT_IMAGES} imágenes del producto. (
              {images.length}/{MIN_PRODUCT_IMAGES})
            </Text>
            {formState.errors.images && (
              <Text className="text-white text-xs">
                {formState.errors.images.message}
              </Text>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-none drop-shadow-md/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Dato de interés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="interest"
              render={({ field, fieldState }) => (
                <Field
                  label="Ingresá un dato importante sobre el objeto"
                  error={fieldState.error?.message}
                >
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Ej. firmado por el autor"
                    className="bg-secundary border-none"
                  />
                </Field>
              )}
            />
          </CardContent>
        </Card>

        <Card className="bg-primary drop-shadow-md/40 border-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              Términos y condiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Controller
              control={control}
              name="acceptConditions"
              render={({ field }) => (
                <CheckRow
                  checked={!!field.value}
                  onChange={v => field.onChange(v as true)}
                >
                  Acepto las{" "}
                  <Text className="text-white text-sm underline">
                    condiciones operativas
                  </Text>{" "}
                  de proceso de subasta.
                </CheckRow>
              )}
            />
            <Controller
              control={control}
              name="acceptLegally"
              render={({ field }) => (
                <CheckRow
                  checked={!!field.value}
                  onChange={v => field.onChange(v as true)}
                >
                  Declaro que el bien a subastar es de mi propiedad y que no
                  posee ningún impedimento legal, judicial o administrativo para
                  ser subastado
                </CheckRow>
              )}
            />
            <Separator className="my-1 bg-white" />
            <Controller
              control={control}
              name="acceptTerms"
              render={({ field }) => (
                <CheckRow
                  checked={!!field.value}
                  onChange={v => field.onChange(v as true)}
                >
                  Acepto los términos y condiciones.
                </CheckRow>
              )}
            />
          </CardContent>
        </Card>

        <Button
          disabled={!formState.isValid || formState.isSubmitting}
          onPress={handleSubmit(onSubmit)}
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
  error,
  children,
}: {
  label: string;
  className?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <Text className="text-destructive text-xs">{error}</Text>}
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
