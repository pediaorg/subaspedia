import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { VERIFICATION_CODE_LENGTH } from "@subaspedia/types/forms/auth";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");

  const verify = api.auth.verifyCode.useMutation({
    onSuccess: () => router.replace("/register/pending"),
  });

  const submit = () => {
    if (code.length === VERIFICATION_CODE_LENGTH && !verify.isPending)
      verify.mutate({ email, code });
  };

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
          // El centrado va por `style` y NO por className: `text-center` en un
          // TextInput crashea en native (bug de react-native-css@3.0.7 / NativeWind
          // 5 preview: `path.split is not a function`). Ver memoria
          // react-native-css-textalign-crash.
          style={{ textAlign: "center" }}
          className="bg-secondary border-none text-lg tracking-[8px]"
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
