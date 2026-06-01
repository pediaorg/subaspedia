import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, Stack } from "expo-router";
import { X } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";

import { type LoginInput, loginSchema } from "@subaspedia/types/forms/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";

export default function LoginScreen() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "", remember: true },
  });

  const login = api.auth.login.useMutation({
    onSuccess: tokens => {
      authStore.set(tokens);
      router.replace("/");
    },
  });

  const onSubmit = (data: LoginInput) =>
    login.mutate({ email: data.email, password: data.password });

  const close = () => router.canGoBack() && router.back();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-neutral-500">
        {/* Header gris con el título (fuera del drawer) y la X de cerrar.
            Ocupa el espacio superior para que el drawer quede al ~70%. */}
        <View className="flex-1 flex-row items-center justify-between px-6">
          <Text variant="h1" className="font-bold text-white">
            Iniciar Sesión
          </Text>
          <Pressable
            hitSlop={12}
            onPress={close}
            className="bg-white h-9 w-9 items-center justify-center rounded-full"
          >
            <Icon as={X} size={20} className="text-foreground" />
          </Pressable>
        </View>

        {/* Drawer blanco (~70%) con el formulario centrado. */}
        <View className="h-[70%] rounded-t-3xl bg-white px-6">
          <View className="flex-1 justify-center gap-5">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormField label="Usuario" error={fieldState.error?.message}>
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="tu@email.com"
                    className="bg-secondary border-none"
                  />
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormField label="Contraseña" error={fieldState.error?.message}>
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

            <View className="flex-row items-center justify-between">
              <Controller
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <Pressable
                    className="flex-row items-center gap-2"
                    onPress={() => field.onChange(!field.value)}
                  >
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Text className="text-sm">Remember me</Text>
                  </Pressable>
                )}
              />
              <Pressable onPress={() => router.push("/register")}>
                <Text className="text-accent-foreground text-sm">
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>
            </View>

            {login.error ? (
              <Text className="text-destructive text-center text-sm">
                {login.error.message}
              </Text>
            ) : null}

            <Button
              size="lg"
              disabled={!form.formState.isValid || login.isPending}
              onPress={form.handleSubmit(onSubmit)}
              className="bg-accent-foreground mt-2 self-center rounded-full border-0 px-12 py-4 shadow-none"
            >
              <Text className="text-base font-bold text-white">
                {login.isPending ? "Ingresando..." : "Iniciar sesión"}
              </Text>
            </Button>

            <View className="flex-row justify-center gap-1">
              <Text className="text-muted-foreground text-sm">
                ¿No tenés cuenta?
              </Text>
              <Link
                href="/register"
                className="text-accent-foreground text-sm font-semibold"
              >
                Registrate
              </Link>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}
