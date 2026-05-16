import { Text, View } from "react-native";

import { Label } from "@/components/ui/label";

type editprops = {
  label: string;
  placeholder: string;
  nativeID: string;
  type: string;
};

export default function EditData({
  label,
  placeholder,
  nativeID,
  type,
}: editprops) {
  return (
    <View className="flex-col items-start">
      <Label nativeID={nativeID} className="font-bold color-gray-600 text-xs">
        {label}
      </Label>
      <input
        aria-labelledby={nativeID}
        type={type}
        placeholder={placeholder}
        className="bg-blue-200 w-full rounded-lg px-2"
      />
    </View>
  );
}
