import { type Control, Controller } from "react-hook-form";

import type { NewProductFormInput } from "@subaspedia/types/forms/new-product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Field } from "./field";

export function InterestSection({
  control,
}: {
  control: Control<NewProductFormInput>;
}) {
  return (
    <Card className="bg-white border-none drop-shadow-md/40">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Dato de interés</CardTitle>
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
  );
}
