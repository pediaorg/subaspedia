import { zodResolver } from "@hookform/resolvers/zod";
import * as Burnt from "burnt";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, View } from "react-native";

import {
  type RegisterStep1Input,
  registerStep1Schema,
} from "@subaspedia/types/forms/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

import { DniField } from "./_/dni-field";
import { RegisterHeader } from "./_/header";

const INPUT = "bg-secondary border-none";

export default function RegisterScreen() {
  const { data: countries } = api.countries.list.useQuery();

  const form = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      lastName: "",
      legalAddress: "",
      country: "",
      email: "",
      dniFront: "",
      dniBack: "",
    },
  });

  const register = api.auth.register.useMutation({
    onSuccess: ({ email }) =>
      router.push({ pathname: "/register/verify", params: { email } }),
  });

  const onSubmit = (data: RegisterStep1Input) => register.mutate(data);

  // Un picker por cara del documento (frente y dorso).
  const dniFront = form.watch("dniFront");
  const dniBack = form.watch("dniBack");

  const pickDni = async (field: "dniFront" | "dniBack") => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Burnt.toast({
        title: "Permiso denegado",
        message: "Necesitamos acceso a tus fotos para subir el DNI.",
        preset: "error",
      });
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.4,
      base64: true,
    });
    if (res.canceled || res.assets.length === 0) return;
    const asset = res.assets[0];
    // Guardamos la imagen como data URI base64 para que viaje al backend y se
    // persista en la DB (no la URI local, que no sirve del lado del server).
    const value = asset.base64
      ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
      : asset.uri;
    form.setValue(field, value, { shouldValidate: true });
  };

  return (
    <View className="flex-1 bg-white">
      <RegisterHeader />
      <ScrollView
        contentContainerClassName="grow justify-center gap-4 px-6 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-2">
          <Text variant="h3" className="font-bold">
            Registro
          </Text>
          <Separator className="w-24 bg-gray-300" />
        </View>

        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormField label="Nombre" error={fieldState.error?.message}>
              <Input
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Tu nombre"
                className={INPUT}
              />
            </FormField>
          )}
        />

        <Controller
          control={form.control}
          name="lastName"
          render={({ field, fieldState }) => (
            <FormField label="Apellido" error={fieldState.error?.message}>
              <Input
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Tu apellido"
                className={INPUT}
              />
            </FormField>
          )}
        />

        <View className="flex-row gap-3">
          <Controller
            control={form.control}
            name="legalAddress"
            render={({ field, fieldState }) => (
              <FormField
                label="Dirección"
                className="flex-1"
                error={fieldState.error?.message}
              >
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Domicilio legal"
                  className={INPUT}
                />
              </FormField>
            )}
          />
          <Controller
            control={form.control}
            name="country"
            render={({ field, fieldState }) => {
              const selected = field.value
                ? { value: field.value, label: field.value }
                : undefined;
              return (
                <FormField
                  label="País"
                  className="flex-1"
                  error={fieldState.error?.message}
                >
                  <Select
                    value={selected}
                    onValueChange={opt => field.onChange(opt?.value ?? "")}
                  >
                    <SelectTrigger className="w-full bg-secondary border-none">
                      <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-none drop-shadow-lg">
                      {(countries ?? []).map(c => (
                        <SelectItem key={c.id} value={c.name} label={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              );
            }}
          />
        </View>

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField label="Mail" error={fieldState.error?.message}>
              <Input
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="tu@email.com"
                className={INPUT}
              />
            </FormField>
          )}
        />

        <FormField
          label="DNI (Frente/Dorso)"
          error={
            form.formState.errors.dniFront?.message ??
            form.formState.errors.dniBack?.message
          }
        >
          <View className="flex-row gap-3">
            <DniField
              label="Frente"
              loaded={!!dniFront}
              onPress={() => pickDni("dniFront")}
            />
            <DniField
              label="Dorso"
              loaded={!!dniBack}
              onPress={() => pickDni("dniBack")}
            />
          </View>
        </FormField>

        {register.error ? (
          <Text className="text-destructive text-center text-sm">
            {register.error.message}
          </Text>
        ) : null}

        <Button
          size="lg"
          disabled={!form.formState.isValid || register.isPending}
          onPress={form.handleSubmit(onSubmit)}
          className="bg-accent-foreground mt-2 self-center rounded-full border-0 px-12 py-4 shadow-none"
        >
          <Text className="text-base font-bold text-white">
            {register.isPending ? "Enviando..." : "Registrarse"}
          </Text>
        </Button>

        <Text className="text-accent-foreground text-center text-xs">
          Te enviaremos un código de verificación a tu email para completar el
          registro.
        </Text>
      </ScrollView>
    </View>
  );
}
