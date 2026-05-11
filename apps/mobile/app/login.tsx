import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const login = api.auth.login.useMutation({
    onSuccess: tokens => {
      authStore.set(tokens);
      router.replace("/");
    },
  });
  const register = api.auth.register.useMutation({
    onSuccess: tokens => {
      authStore.set(tokens);
      router.replace("/");
    },
  });

  const active = mode === "login" ? login : register;
  const submit = () => active.mutate({ email, password });

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <Text className="text-3xl font-bold mb-6 text-center">
        {mode === "login" ? "Iniciar sesión" : "Registrarse"}
      </Text>

      <TextInput
        className="border border-gray-300 rounded-md px-3 py-2 mb-3"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="border border-gray-300 rounded-md px-3 py-2 mb-3"
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {active.error && (
        <Text className="text-red-500 mb-3">{active.error.message}</Text>
      )}

      <Pressable
        className="bg-blue-600 rounded-md py-3 mb-3"
        disabled={active.isPending}
        onPress={submit}
      >
        <Text className="text-white text-center font-semibold">
          {active.isPending
            ? "Cargando..."
            : mode === "login"
              ? "Entrar"
              : "Crear cuenta"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setMode(mode === "login" ? "register" : "login")}
      >
        <Text className="text-blue-600 text-center">
          {mode === "login"
            ? "¿No tenés cuenta? Registrate"
            : "¿Ya tenés cuenta? Iniciá sesión"}
        </Text>
      </Pressable>
    </View>
  );
}
