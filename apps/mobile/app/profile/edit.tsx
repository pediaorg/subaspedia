import { CameraIcon } from "lucide-react-native";
import { Text, View } from "react-native";

import EditData from "@/components/profile/edit/edit-data";
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
              <View className="grid grid-cols-2 gap-6 w-full">
                <EditData
                  label={"Nombre"}
                  placeholder={"Juan"}
                  nativeID={"name"}
                  type={"text"}
                />
                <EditData
                  label={"Apellido"}
                  placeholder={"Casareski"}
                  nativeID={"surname"}
                  type={"text"}
                />
                <EditData
                  label={"Dirección Legal"}
                  placeholder={"Lima 970"}
                  nativeID={"dir"}
                  type={"text"}
                />
                <EditData
                  label={"País"}
                  placeholder={"Mendoza"}
                  nativeID={"country"}
                  type={"text"}
                />
              </View>
            </View>

            {/* Correo y contraseña */}
            <View>
              <Text className="font-bold text-lg">
                Correo electrónico y contraseña
              </Text>
              <EditData
                label={"Correo electrónico"}
                placeholder={"Juan@casablanca"}
                nativeID={"email"}
                type={"email"}
              />
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}
