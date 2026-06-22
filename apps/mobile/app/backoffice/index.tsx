import { useState } from "react";
import { ScrollView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";

import { CatalogosSection } from "./_/catalogos";
import { CotizacionesSection } from "./_/cotizaciones";
import { InfraccionesSection } from "./_/infracciones";
import { PagosSection } from "./_/pagos";
import { PostoresSection } from "./_/postores";
import { SubastasSection } from "./_/subastas";

// Pantalla interna de la empresa (no forma parte de la app del usuario). Sirve
// para disparar a mano los procesos que el enunciado describe como manuales o
// asíncronos. Cada proceso vive en su propio componente bajo `_/`; acá solo está
// el shell de tabs que los conmuta.

const TABS = [
  { value: "postores", label: "Postores", Section: PostoresSection },
  { value: "pagos", label: "Pagos", Section: PagosSection },
  {
    value: "cotizaciones",
    label: "Cotizaciones",
    Section: CotizacionesSection,
  },
  { value: "catalogos", label: "Catálogos", Section: CatalogosSection },
  { value: "subastas", label: "Subastas", Section: SubastasSection },
  {
    value: "infracciones",
    label: "Infracciones",
    Section: InfraccionesSection,
  },
] as const;

export default function BackofficeScreen() {
  const [tab, setTab] = useState<string>(TABS[0].value);
  const Active = TABS.find(t => t.value === tab)?.Section ?? PostoresSection;

  return (
    <View className="flex-1 bg-white">
      <View className="gap-3 p-4 pb-2">
        <Text variant="h1" className="font-bold">
          Backoffice
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-0"
        >
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              {TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value}>
                  <Text>{t.label}</Text>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </ScrollView>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="p-4 pt-2 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <Active />
      </KeyboardAwareScrollView>
    </View>
  );
}
