import { Menu } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";

import { Sidebar } from "./sidebar";

type Props = {
  className?: string;
};

export function MenuButton({ className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="Abrir menú"
        hitSlop={8}
        className={className}
      >
        <Icon as={Menu} size={28} className="text-foreground" />
      </Pressable>

      <Sidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}
