import type { ReactNode } from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Text } from "@/components/ui/text";

interface FaqItemProps {
  value: string;
  question: string;
  answer: ReactNode;
}

export function FaqItem({ value, question, answer }: FaqItemProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <Text className="font-bold">
          {value}. {question}
        </Text>
      </AccordionTrigger>
      <AccordionContent>
        <Text className="text-muted-foreground">{answer}</Text>
      </AccordionContent>
    </AccordionItem>
  );
}
