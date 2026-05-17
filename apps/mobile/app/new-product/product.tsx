import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import { Info } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";

import {
  type NewProductFormInput,
  type NewProductFormOutput,
  newProductSchema,
} from "@subaspedia/types/forms/new-product";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";

import { DataSection } from "./_components/data-section";
import { ImagesSection } from "./_components/images-section";
import { InterestSection } from "./_components/interest-section";
import { TermsSection } from "./_components/terms-section";

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

        <DataSection control={control} />
        <ImagesSection
          watch={watch}
          setValue={setValue}
          errors={formState.errors}
        />
        <InterestSection control={control} />
        <TermsSection control={control} />

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
