import { zodResolver } from "@hookform/resolvers/zod";
import { router, Stack } from "expo-router";
import { Info } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import {
  type NewProductFormInput,
  type NewProductFormOutput,
  newProductSchema,
} from "@subaspedia/types/forms/new-product";
import { MenuButton } from "@/components/app-header/menu-button";
import { LoginPrompt } from "@/components/login-prompt";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

import { DataSection } from "./_/data-section";
import { ImagesSection } from "./_/images-section";
import { InterestSection } from "./_/interest-section";
import { TermsSection } from "./_/terms-section";

export default function PostProduct() {
  const { isAuthed } = useAuth();

  const { control, handleSubmit, watch, setValue, formState } = useForm<
    NewProductFormInput,
    unknown,
    NewProductFormOutput
  >({
    resolver: zodResolver(newProductSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      interest: "",
      images: [],
      acceptConditions: false,
      acceptLegally: false,
      acceptTerms: false,
    },
  });

  const createProduct = api.products.create.useMutation({
    onSuccess: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    },
  });

  const onSubmit = (data: NewProductFormInput) => {
    createProduct.mutate(data);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-32"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between">
          <Text variant="h3" className="font-bold">
            Subastar un producto
          </Text>
          <MenuButton />
        </View>

        <Separator className="bg-border" />
        {isAuthed ? (
          <>
            <View className="bg-warning flex-row items-center gap-3 rounded-lg p-3">
              <Info size={20} color="#ffffff" />
              <Text className="text-white flex-1 text-sm">
                La empresa puede designar una colección cuando el lote tiene
                numerosos artículos
              </Text>
            </View>

            <DataSection control={control} />
            <ImagesSection control={control} />
            <InterestSection control={control} />
            <TermsSection control={control} />

            <Button
              disabled={
                !formState.isValid || createProduct.status === "pending"
              }
              onPress={handleSubmit(onSubmit)}
              size="lg"
              className="bg-accent-foreground h-12 border-0 rounded-2xl shadow-none focus:outline-none focus-visible:ring-0 focus-visible:border-transparent"
            >
              <Text className="text-white font-bold text-base">
                Enviar a revisión
              </Text>
            </Button>

            <Text className="text-accent-foreground text-center text-xs">
              La publicación quedará pendiente hasta que un agente de la
              plataforma la revise.
            </Text>
          </>
        ) : (
          <LoginPrompt
            message={
              <>
                Para poder ver su rango, por favor{" "}
                <Text className="text-foreground text-lg font-bold">
                  inicie sesión
                </Text>
              </>
            }
          />
        )}
      </KeyboardAwareScrollView>
    </>
  );
}
