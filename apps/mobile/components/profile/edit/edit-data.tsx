import { TextInput, View } from "react-native";

import { Label } from "@/components/ui/label";

type editprops = {
  classname?: string;
  label: string;
  placeholder: string;
  nativeID: string;
  type: "text" | "email";
  value: string;
  onChangeText: (text: string) => void;
};

export default function EditData({
  classname,
  label,
  placeholder,
  nativeID,
  type,
  value,
  onChangeText,
}: editprops) {
  return (
    <View
      className={`flex-col flex-1 py-2 gap-1 items-start ${classname ?? ""}`}
    >
      <Label nativeID={nativeID} className="font-bold text-gray-600 text-xs">
        {label}
      </Label>
      <TextInput
        nativeID={nativeID}
        // Si es email, agrega estas props
        {...(type === "email" && {
          keyboardType: "email-address",
          autoCapitalize: "none",
        })}
        placeholder={placeholder}
        className="bg-secondary w-full rounded-lg py-1 px-2"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
