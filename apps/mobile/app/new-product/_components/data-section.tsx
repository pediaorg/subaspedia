import { PRODUCT_CATEGORIES } from "@subaspedia/types";
import { type NewProductFormInput } from "@subaspedia/types/forms/new-product";
import { type Control, Controller } from "react-hook-form";
import { View } from "react-native";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Field } from "./field";

export function DataSection({
  control,
}: {
  control: Control<NewProductFormInput>;
}) {
  return (
    <Card className="bg-white drop-shadow-md/40 border-none">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Datos</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field label="Nombre del objeto" error={fieldState.error?.message}>
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
                      <SelectItem key={c.value} value={c.value} label={c.label}>
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
  );
}
