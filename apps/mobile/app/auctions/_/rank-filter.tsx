import { ListFilter } from "lucide-react-native";
import { Pressable, Text } from "react-native";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RANKS, type Ranks } from "./auctions-mock";

type RankFilterProps = {
  selected: Ranks[];
  onToggle: (rank: Ranks) => void;
};

export function RankFilter({ selected, onToggle }: RankFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable className="flex flex-row justify-between items-center mb-2">
          <Text className="font-semibold text-md text-muted-foreground">
            Encontrá lo que buscas
          </Text>
          <ListFilter size={20} className="text-muted-foreground" />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-bold tracking-wide">
          RANGOS
        </DropdownMenuLabel>
        {RANKS.map(rank => (
          <DropdownMenuCheckboxItem
            key={rank}
            checked={selected.includes(rank)}
            onCheckedChange={() => onToggle(rank)}
            closeOnPress={false}
          >
            {rank}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
