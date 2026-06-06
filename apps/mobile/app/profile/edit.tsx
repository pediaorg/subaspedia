import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { CameraIcon } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import type { UpdateProfileInput, User } from "@subaspedia/types/user";
import EditData from "@/components/profile/edit/edit-data";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_AVATAR_URI } from "@/lib/constants";

const MOCK_CURRENT_USER: User = {
  id: 1,
  email: "JuanCasablanca@jamon.com",
  name: "Juan",
  surname: "Casablanca",
  documentId: "12345678",
  address: "...",
  country: { id: 1, name: "Argentina" },
  category: "common",
  avatarUrl: null,
  admitted: true,
  createdAt: new Date().toISOString(),
};

export default function EditProfile() {
  const { data: user } = useQuery({
    queryKey: ["users", "me"],
    queryFn: async () => {
      // TODO: reemplazar por la llamada real al back (GET /users/me)
      await new Promise(r => setTimeout(r, 300));
      return MOCK_CURRENT_USER;
    },
  });
  if (!user) return <Text>Cargando…</Text>;
  return <EditProfileForm user={user} />;
}

function EditProfileForm({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (patch: UpdateProfileInput) => {
      // TODO: reemplazar por la llamada real al back (PATCH /users/me)
      await new Promise(r => setTimeout(r, 300));
      return { ...user, ...patch } as User;
    },
    onSuccess: updated => {
      // mantenemos en sync la cache ["users","me"] que comparte con profile/index
      queryClient.setQueryData(["users", "me"], updated);
    },
  });
  const [form, setForm] = useState({
    name: user.name ?? "",
    surname: user.surname ?? "",
    address: user.address ?? "",
    country: user.country?.name ?? "",
    email: user.email,
  });
  const [avatarUri, setAvatarUri] = useState(
    user.avatarUrl ?? DEFAULT_AVATAR_URI,
  );

  const handleSave = () => {
    const nextAvatarUrl = avatarUri === DEFAULT_AVATAR_URI ? null : avatarUri;

    // El back acepta partial: solo mandamos lo que cambió respecto al user actual.
    const patch: UpdateProfileInput = {};
    if (form.name !== (user.name ?? "")) patch.name = form.name;
    if (form.surname !== (user.surname ?? "")) patch.surname = form.surname;
    if (form.address !== (user.address ?? "")) patch.address = form.address;
    // country es { id, name } | null en el schema. Sin un selector de países
    // (con id real del back) no podemos crear uno desde texto libre: solo
    // renombramos preservando el id existente. Si el user no tenía país, queda
    // pendiente el picker.
    if (user.country && form.country !== user.country.name)
      patch.country = { id: user.country.id, name: form.country };
    if (form.email !== user.email) patch.email = form.email;
    if (nextAvatarUrl !== user.avatarUrl) patch.avatarUrl = nextAvatarUrl;

    if (Object.keys(patch).length === 0) {
      router.back();
      return;
    }

    updateProfile(patch, {
      onSuccess: () => {
        router.back();
      },
      onError: error => {
        Alert.alert("Error", error.message);
      },
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos acceso a la cámara para sacar una foto.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos acceso a tus fotos para elegir una imagen.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handlePickAvatar = () => {
    Alert.alert("Cambiar foto de perfil", "Elegí una opción", [
      { text: "Sacar foto", onPress: takePhoto },
      { text: "Elegir de galería", onPress: pickFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
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
            <Pressable
              onPress={handlePickAvatar}
              className="active:opacity-60 border border-white absolute size-6 bg-primary justify-center items-center rounded-xl bottom-0 right-0   z-10"
            >
              <CameraIcon className="size-4 color-white" />
            </Pressable>
            <Avatar
              alt="@mrzachnugent"
              className=" self-center border border-border size-full"
            >
              <AvatarImage key={avatarUri} source={{ uri: avatarUri }} />
            </Avatar>
          </View>
          <Separator className="bg-primary" />

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
                {/* TODO: el conutry no es un string, cambiar */}
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
                <Text className="text-primary text-center">
                  Cambiar Contraseña
                </Text>
              </Pressable>
            </View>
          </View>
          <Button
            disabled={isPending}
            className="w-33 rounded-xl h-8"
            onPress={handleSave}
          >
            <Text className="font-bold color-white text-lg">
              {isPending ? "Guardando..." : "Guardar"}
            </Text>
          </Button>
        </Card>
      </View>
    </View>
  );
}
