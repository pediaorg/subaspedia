import { type NewProductFormInput } from "@subaspedia/types/forms/new-product";
import { type Control, Controller } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";

import { CheckRow } from "./check-row";

export function TermsSection({
  control,
}: {
  control: Control<NewProductFormInput>;
}) {
  return (
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
            <CheckRow checked={!!field.value} onChange={field.onChange}>
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
            <CheckRow checked={!!field.value} onChange={field.onChange}>
              Declaro que el bien a subastar es de mi propiedad y que no posee
              ningún impedimento legal, judicial o administrativo para ser
              subastado
            </CheckRow>
          )}
        />
        <Separator className="my-1 bg-white" />
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <CheckRow checked={!!field.value} onChange={field.onChange}>
              Acepto los términos y condiciones.
            </CheckRow>
          )}
        />
      </CardContent>
    </Card>
  );
}
