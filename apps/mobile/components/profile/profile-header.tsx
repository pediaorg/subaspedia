import { router } from "expo-router";
import { ArrowLeft, ArrowLeftCircle, Menu } from "lucide-react-native";
import { Pressable, View } from "react-native";

export default function ProfileHeader() {
  return (
    <View className="flex-row justify-between items-center py-14 px-6">
      <Pressable onPress={() => router.back()}>
        <View
          className="items-center justify-center size-10 rounded-full bg-white"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <ArrowLeft className="" />
        </View>
      </Pressable>
      {/* TODO: Remplazar por componente real */}
      <Menu />
    </View>
  );
}
