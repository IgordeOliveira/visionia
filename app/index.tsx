import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {useEffect, useRef, useState} from 'react';
import {Button, Pressable, StyleSheet, Text, View} from 'react-native';
import axios from "axios";
import * as Speech from 'expo-speech';

export default function Index() {
  const [processing, setProcessing] = useState<boolean>(false);
  const [init, setInit] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const initRef = useRef(init); // Cria uma ref para armazenar o valor atual de init

  useEffect(() => {
    console.log(init)
    initRef.current = init; // Atualiza a ref sempre que init muda
    if (init) {
      takeAndSpeak()
    }

  }, [init]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
        <View style={styles.container}>
          <Text style={styles.text}>Precisamos da permissão da camera para continuar</Text>
          <Button onPress={requestPermission} title="Conceder permissão" />
        </View>
    );
  }

  async function readImage(base64Image: string) {
    axios.post('https://apivision.carlosp.dev/imagem',
    { imagem_base64: base64Image },
    {
      headers: {
        Authorization: `Bearer `,
      }
    }).then(function (response) {
      // handle success
      const data: string = response?.data.data
      console.log(data);
      Speech.speak(data, {language: 'pt', onDone: () => {
        console.log('terminou de falar', {init: init})

        if (initRef.current) {
          takeAndSpeak();
        }
      }});

    }).catch(function (error) {
      console.log(error);
    }).finally(() => {
      setProcessing(false);
    })
  }

  async function takeAndSpeak() {
    setProcessing(true);
    const image = await takePhoto();
    if (!image) {
      console.log('image cant be found')
      return;
    }
    await readImage(image);
  }

  async function takePhoto() {
    console.log('take photo');
    const image = await cameraRef.current?.takePictureAsync({base64: true, quality: 0.5});
    return image?.base64
  }

  const btnBgColor = init ? 'red' : 'green';

  return (
      <View style={styles.container}>
        <CameraView style={{ flex: 5}} animateShutter={false} ref={cameraRef}>
        </CameraView>
        <View style={styles.controller}>
          <Pressable style={[styles.button, {backgroundColor: btnBgColor}]} onPress={() => setInit(!init)}>
            <Text style={styles.text}>{init ? "Parar" : "Iniciar"}</Text>
          </Pressable>
          {processing && <Text style={styles.text}>Processando...</Text>}
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flexDirection: 'column',
    flex: 1
  },
  controller: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "black"

  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'green',
  },
  text: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0.25,
    color: 'white',
  },
});
