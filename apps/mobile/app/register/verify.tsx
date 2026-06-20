import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { VERIFICATION_CODE_LENGTH } from "@subaspedia/types/forms/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

export default function VerifyScreen() {
  const { email, redirect } = useLocalSearchParams<{
    email: string;
    redirect?: string;
  }>();
  const [code, setCode] = useState("");

  const verify = api.auth.verifyCode.useMutation({
    onSuccess: () =>
      router.push({
        pathname: "/register/password",
        params: { email, code, ...(redirect ? { redirect } : {}) },
      }),
  });

  const submit = () => {
    if (code.length === VERIFICATION_CODE_LENGTH && !verify.isPending)
      verify.mutate({ email, code });
  };

  return (
    <View className="flex-1 justify-center gap-5 bg-white p-6">
      <Text variant="h2" className="text-center font-bold">
        Verificar
      </Text>
      <Text className="text-muted-foreground text-center text-sm">
        Ingresá el código de {VERIFICATION_CODE_LENGTH} dígitos que enviamos a{" "}
        {email}.
      </Text>

      <FormField label="Código de verificación" error={verify.error?.message}>
        <Input
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={VERIFICATION_CODE_LENGTH}
          placeholder="000000"
          returnKeyType="go"
          onSubmitEditing={submit}
          className="bg-secondary border-none text-center text-lg tracking-[8px]"
        />
      </FormField>

      <Button
        size="lg"
        disabled={code.length !== VERIFICATION_CODE_LENGTH || verify.isPending}
        onPress={submit}
        className="bg-accent-foreground rounded-2xl border-0 py-4 shadow-none"
      >
        <Text className="text-base font-bold text-white">
          {verify.isPending ? "Verificando..." : "Verificar"}
        </Text>
      </Button>
    </View>
  );
}
