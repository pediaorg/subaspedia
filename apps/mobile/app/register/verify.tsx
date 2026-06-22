import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { VERIFICATION_CODE_LENGTH } from "@subaspedia/types/forms/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

export default function VerifyScreen() {
  // `code` llega cuando se entra desde el botón del mail: viene pre-cargado y se
  // confirma solo (ver el efecto de abajo).
  const { email, code: codeParam } = useLocalSearchParams<{
    email: string;
    code?: string;
  }>();
  const [code, setCode] = useState(codeParam ?? "");

  const verify = api.auth.verifyCode.useMutation({
    onSuccess: () => router.replace("/register/pending"),
  });

  const submit = () => {
    if (code.length === VERIFICATION_CODE_LENGTH && !verify.isPending)
      verify.mutate({ email, code });
  };

  // Llegó desde el link del mail con el código: confirmar automáticamente una
  // sola vez. `verify.mutate` es estable; sin código válido o sin email no hace
  // nada.
  // biome-ignore lint/correctness/useExhaustiveDependencies: disparo único al montar con el code del link
  useEffect(() => {
    if (
      codeParam &&
      email &&
      codeParam.length === VERIFICATION_CODE_LENGTH &&
      !verify.isPending
    )
      verify.mutate({ email, code: codeParam });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardAwareScrollView
      bottomOffset={20}
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-white"
      contentContainerClassName="flex-grow justify-center gap-5 p-6"
    >
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
    </KeyboardAwareScrollView>
  );
}
