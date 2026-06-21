import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

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
import { safeRedirect } from "@/lib/auth-redirect";

export default function SetPasswordScreen() {
  const { token, redirect } = useLocalSearchParams<{
    token: string;
    redirect?: string;
  }>();

  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const setPassword = api.auth.setPassword.useMutation({
    onSuccess: tokens => {
      authStore.set(tokens);
      router.replace(safeRedirect(redirect));
    },
  });

  const onSubmit = (data: NewPasswordInput) =>
    setPassword.mutate({
      token,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });

  const submit = form.handleSubmit(onSubmit);

  if (!token) {
    return (
      <View className="flex-1 justify-center gap-3 bg-white p-6">
        <Text variant="h2" className="text-center font-bold">
          Link inválido
        </Text>
        <Text className="text-muted-foreground text-center text-sm">
          El enlace para crear tu contraseña no es válido o está incompleto.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      bottomOffset={20}
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-white"
      contentContainerClassName="flex-grow justify-center gap-5 p-6"
    >
      <Text variant="h2" className="text-center font-bold">
        Crear contraseña
      </Text>
      <Text className="text-muted-foreground text-center text-sm">
        Generá tu clave personal para activar tu cuenta.
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
              returnKeyType="next"
              onSubmitEditing={submit}
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
              returnKeyType="go"
              onSubmitEditing={submit}
              className="bg-secondary border-none"
            />
          </FormField>
        )}
      />

      {setPassword.error ? (
        <Text className="text-destructive text-center text-sm">
          {setPassword.error.message}
        </Text>
      ) : null}

      <Button
        size="lg"
        disabled={!form.formState.isValid || setPassword.isPending}
        onPress={submit}
        className="bg-accent-foreground rounded-2xl border-0 py-4 shadow-none"
      >
        <Text className="text-base font-bold text-white">
          {setPassword.isPending ? "Activando..." : "Crear contraseña"}
        </Text>
      </Button>
    </KeyboardAwareScrollView>
  );
}
