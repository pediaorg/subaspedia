import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";

import { type LoginInput, loginSchema } from "@subaspedia/types/forms/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { safeRedirect } from "@/lib/auth-redirect";
import { authStore } from "@/lib/auth";

export default function LoginScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "", remember: true },
  });

  const login = api.auth.login.useMutation({
    onSuccess: tokens => {
      authStore.set(tokens);
      router.replace(safeRedirect(redirect));
    },
  });

  const onSubmit = (data: LoginInput) =>
    login.mutate({ email: data.email, password: data.password });

  const submit = form.handleSubmit(onSubmit);

  // Si no hay historial (entraste directo a /login) igual podés salir a home.
  const close = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  // Arrastramos el `redirect` al registro para no perder el destino si el
  // usuario completa el alta en vez de loguearse.
  const registerHref = {
    pathname: "/register" as const,
    params: redirect ? { redirect } : {},
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#1f8edd", "#0e3f8e"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1">
          {/* Header sobre la imagen con el título y la X de cerrar. */}
          <View
            className="flex-row items-center justify-between px-6"
            style={{ minHeight: 140, paddingTop: 32 }}
          >
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

          {/* Drawer blanco con el formulario centrado. Crece con flex
              para que el teclado no empuje los inputs fuera del viewport. */}
          <View className="flex-1 rounded-t-3xl bg-white px-6">
            <KeyboardAwareScrollView
              bottomOffset={20}
              showsVerticalScrollIndicator={false}
              contentContainerClassName="flex-grow justify-center gap-5"
            >
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
                      returnKeyType="next"
                      onSubmitEditing={submit}
                      className="bg-secondary border-none"
                    />
                  </FormField>
                )}
              />

              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Contraseña"
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
                <Pressable onPress={() => router.push(registerHref)}>
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
                onPress={submit}
                className="bg-accent-foreground mt-2 h-12 self-center rounded-full border-0 px-12 shadow-none"
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
                  href={registerHref}
                  className="text-accent-foreground text-sm font-semibold"
                >
                  Registrate
                </Link>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </LinearGradient>
    </>
  );
}
