import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import {
  type NewPasswordInput,
  newPasswordSchema,
} from "@subaspedia/types/forms/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";

export default function NewPasswordScreen() {
  const { email, code } = useLocalSearchParams<{
    email: string;
    code: string;
  }>();

  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const complete = api.auth.completeRegistration.useMutation({
    onSuccess: tokens => {
      authStore.set(tokens);
      router.replace("/");
    },
  });

  const onSubmit = (data: NewPasswordInput) =>
    complete.mutate({
      email,
      code,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });

  return (
    <View className="flex-1 justify-center gap-5 bg-white p-6">
      <Text variant="h2" className="text-center font-bold">
        Crear contraseña
      </Text>
      <Text className="text-muted-foreground text-center text-sm">
        Generá tu clave personal para terminar el registro.
      </Text>

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <FormField label="Nueva contraseña" error={fieldState.error?.message}>
            <Input
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              placeholder="••••••••"
              className="bg-secondary border-none"
            />
          </FormField>
        )}
      />

      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <FormField
            label="Confirmar contraseña"
            error={fieldState.error?.message}
          >
            <Input
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              placeholder="••••••••"
              className="bg-secondary border-none"
            />
          </FormField>
        )}
      />

      {complete.error ? (
        <Text className="text-destructive text-center text-sm">
          {complete.error.message}
        </Text>
      ) : null}

      <Button
        size="lg"
        disabled={!form.formState.isValid || complete.isPending}
        onPress={form.handleSubmit(onSubmit)}
        className="bg-accent-foreground rounded-2xl border-0 py-4 shadow-none"
      >
        <Text className="text-base font-bold text-white">
          {complete.isPending ? "Creando..." : "Completar registro"}
        </Text>
      </Button>
    </View>
  );
}
