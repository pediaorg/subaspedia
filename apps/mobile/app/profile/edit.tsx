import { CameraIcon } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import EditData from "@/components/profile/edit/edit-data";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type UserProps = {
  name: string;
  surname: string;
  address: string;
  country: string;
  email: string;
  img: string;
};

export default function EditProfile() {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    address: "",
    country: "",
    email: "",
  });
  const handleSave = () => {
    // TODO: Cambiar por funcionamiento real del back
    console.log(form);
    Alert.alert("Guardado", "Los datos se imprimieron en cosola");
  };
  return (
    <View className="flex-1 px-4 gap-6">
      {/* Editar perfil */}
      <View className="gap-4">
        <Text className="font-bold text-3xl">Editar perfil</Text>
        <Separator className="bg-gray-500" />
        {/* Card con cosas */}
        <Card className="flex-col items-center border-0 p-4 drop-shadow-2xl/10 gap-3">
          <View className="size-28">
            <Pressable className="active:opacity-60 absolute size-6 bg-blue-500 justify-center items-center rounded-xl bottom-0 right-0   z-10">
              <CameraIcon className="size-4 color-white" />
            </Pressable>
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
          <View className="flex-col w-full gap-4 pb-5 items-start">
            {/* Datos personales */}
            <View className="">
              <Text className="font-bold text-lg">Personal</Text>
              <View className="flex-row gap-4">
                <EditData
                  label={"Nombre"}
                  placeholder={"Juan"}
                  nativeID={"name"}
                  type={"text"}
                  value={form.name}
                  onChangeText={text => setForm({ ...form, name: text })}
                />
                <EditData
                  label={"Apellido"}
                  placeholder={"Casareski"}
                  nativeID={"surname"}
                  type={"text"}
                  value={form.surname}
                  onChangeText={text => setForm({ ...form, surname: text })}
                />
              </View>
              <View className="flex-row gap-4">
                <EditData
                  label={"Dirección Legal"}
                  placeholder={"Lima 970"}
                  nativeID={"dir"}
                  type={"text"}
                  value={form.address}
                  onChangeText={text => setForm({ ...form, address: text })}
                />
                <EditData
                  label={"País"}
                  placeholder={"Mendoza"}
                  nativeID={"country"}
                  type={"text"}
                  value={form.country}
                  onChangeText={text => setForm({ ...form, country: text })}
                />
              </View>
            </View>

            {/* Correo y contraseña */}
            <View className="w-full">
              <Text className="font-bold text-lg">
                Correo electrónico y contraseña
              </Text>
              <EditData
                label={"Correo electrónico"}
                placeholder={"Juan@casablanca"}
                nativeID={"email"}
                type={"email"}
                value={form.email}
                onChangeText={text => setForm({ ...form, email: text })}
              />
              <Pressable>
                <Text className="text-blue-600 text-center">
                  Cambiar Contraseña
                </Text>
              </Pressable>
            </View>
          </View>
          <Button className="w-33 rounded-xl h-8" onPress={handleSave}>
            <Text className="font-bold color-white text-lg">Guardar</Text>
          </Button>
        </Card>
      </View>
    </View>
  );
}
