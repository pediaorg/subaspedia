import { CameraIcon } from "lucide-react-native";
import { Text, View } from "react-native";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function EditProfile() {
  return (
    <View className="flex-1 px-4 gap-6 py-16">
      {/* Header */}
      <View>
        <Text>HEADER</Text>
      </View>

      {/* Editar perfil */}
      <View className="gap-5">
        <Text className="font-bold text-3xl">Editar perfil</Text>
        <Separator className="bg-gray-500" />
        {/* Card con cosas */}
        <Card className="flex-col items-center p-4 gap-3">
          <View className="size-28">
            <View className="absolute size-6 bg-blue-500 justify-center items-center rounded-xl bottom-0 right-0   z-10">
              <CameraIcon className="size-4 color-white" />
            </View>
            <Avatar alt="@mrzachnugent" className=" self-center size-full">
              <AvatarImage
                source={{
                  uri: "https://avatars.githubusercontent.com/u/66040481?v=4",
                }}
              ></AvatarImage>
            </Avatar>
          </View>
          <Separator className="bg-gray-500" />

          {/* Campos para completar */}
          <View className="flex-col w-full gap-6 items-start">
            {/* Datos personales */}
            <View className="">
              <Text className="font-bold text-lg">Personal</Text>
              <View className="grid grid-cols-2 gap-10 w-full">
                <View className="flex-col items-start">
                  <Label
                    nativeID="name"
                    className="font-bold color-gray-400 text-xs"
                  >
                    Nombre
                  </Label>
                  <input
                    aria-labelledby="name"
                    type="text"
                    placeholder="Juan"
                    className="bg-blue-200 w-32 rounded-lg px-2"
                  />
                </View>
                <View className="flex-col items-start">
                  <Label
                    nativeID="surname"
                    className="font-bold color-gray-400 text-xs"
                  >
                    Apellido
                  </Label>
                  <input
                    aria-labelledby="surname"
                    type="text"
                    placeholder="Casareski"
                    className="bg-blue-200 w-32 rounded-lg px-2"
                  />
                </View>
              </View>
            </View>

            {/* Correo y contraseña */}
            <View></View>
          </View>
        </Card>
      </View>
    </View>
  );
}
