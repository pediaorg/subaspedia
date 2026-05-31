import { Hand } from "lucide-react-native";
import { View } from "react-native";

import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

export function LoginPrompt() {
  return (
    <Card className="bg-card drop-shadow-md/40 border-none">
      <CardContent className="items-center gap-4 py-8">
        <View className="bg-primary h-20 w-20 items-center justify-center rounded-full">
          <Hand size={36} className="text-primary-foreground" />
        </View>
        <Text className="text-muted-foreground text-center text-lg">
          Para poder ver su rango, por favor{" "}
          <Text className="text-foreground text-lg font-bold">
            inicie sesión
          </Text>
        </Text>
      </CardContent>
    </Card>
  );
}
