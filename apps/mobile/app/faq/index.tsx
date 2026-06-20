import { Stack } from "expo-router";
import { ScrollView } from "react-native";

import { Accordion } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";

import { FaqItem } from "./_/faq-item";

const FAQS = [
  {
    question: "¿Cómo me registro como postor?",
    answer:
      "El registro tiene dos etapas. Primero cargás tus datos (nombre, apellido, foto del documento de frente y dorso, domicilio legal y país de origen). La empresa los verifica. Después recibís un mail para ingresar a la app, generar tu clave y registrar un medio de pago.",
  },
  {
    question: "¿Qué son las categorías y para qué sirven?",
    answer:
      "Las categorías son común, especial, plata, oro y platino. Se asignan según la investigación de tus datos y determinan en qué subastas podés participar: solo podés entrar a subastas cuya categoría sea menor o igual a la tuya. Tu diversidad de medios de pago y tu actividad ayudan a mejorarla.",
  },
  {
    question: "¿Necesito un medio de pago para pujar?",
    answer:
      "Sí. Para pujar necesitás al menos un medio de pago verificado por la empresa. Sin él podés ver la subasta pero no ofertar. Podés registrar cuentas bancarias (incluso del exterior), tarjetas de crédito nacionales o internacionales, o cheques certificados verificados antes del inicio de la subasta.",
  },
  {
    question: "¿Cuánto puedo ofertar en una puja?",
    answer:
      "Tu oferta debe superar la mejor oferta actual por al menos el 1% del valor base del bien, y no puede excederla en más del 20% de ese valor base. Por ejemplo, con un valor base de 10.000 y una última oferta de 15.000, podés pujar entre 15.100 y 17.000. Estos límites no aplican a las subastas de categoría oro y platino.",
  },
  {
    question: "¿Cómo sé si gané una subasta?",
    answer:
      "Ganás cuando nadie puja un valor más alto que el tuyo y la subasta cierra. La pieza pasa a tu nombre y recibís un mensaje privado con el importe a pagar, detallando lo pujado, las comisiones y el costo de envío a la dirección declarada.",
  },
  {
    question: "¿Qué pasa si no puedo pagar lo que gané?",
    answer:
      "Si al momento de pagar no contás con los fondos, recibís una multa equivalente al 10% del valor ofertado, que deberás abonar antes de volver a participar. Además, tenés 72 horas para presentar los fondos necesarios. Si no cumplís, el caso se deriva a la justicia y perdés acceso a los servicios de la app.",
  },
  {
    question: "¿Puedo vender un artículo propio en una subasta?",
    answer:
      "Sí. Cargás los datos del bien, al menos 6 fotos y cualquier dato histórico relevante, y declarás que te pertenece y no tiene impedimentos. Si la empresa se interesa, lo enviás para inspección. Si lo acepta, te informa fecha, lugar, valor base y comisiones; si lo rechaza, te lo devuelve con cargo y podés ver los motivos en la app.",
  },
  {
    question: "¿Puedo seguir varias subastas a la vez?",
    answer:
      "No podés estar conectado a más de una al mismo tiempo. Cada subasta opera en una sola moneda (pesos o dólares) y no admite pagos bimonetarios.",
  },
];

export default function FAQ() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="h1" className="text-left font-bold">
          Preguntas Frecuentes
        </Text>
        <Separator className="bg-border" />
        <Card className="drop-shadow-xl/40 border-0 p-4">
          <Accordion type="single" collapsible>
            {FAQS.map((faq, index) => (
              <FaqItem
                key={index}
                value={String(index + 1)}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </Accordion>
        </Card>
      </ScrollView>
    </>
  );
}
