import { type Control, Controller } from "react-hook-form";
import { View } from "react-native";

import type { NewProductFormInput } from "@subaspedia/types/forms/new-product";
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
