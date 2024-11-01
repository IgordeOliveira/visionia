import {CameraView, CameraType, useCameraPermissions} from 'expo-camera';
import {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Button, Pressable, StyleSheet, Text, ToastAndroid, View} from 'react-native';
import axios from "axios";
import * as Speech from 'expo-speech';
import {HelloWave} from "@/components/HelloWave";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import {Colors} from "@/constants/Colors";
import {Image} from 'expo-image';
import {useKeepAwake} from "expo-keep-awake";
import {MaterialIcons} from "@expo/vector-icons";

export default function Index() {
    useKeepAwake();
    const [processing, setProcessing] = useState<boolean>(false);
    const [init, setInit] = useState<boolean>(false);
    const [enableTorch, setEnableTorch] = useState<boolean>(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraReady, setIsCameraReady] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const initRef = useRef(init); // Cria uma ref para armazenar o valor atual de init

    const controller = new AbortController();


    useEffect(() => {
        console.log({init: init, isCameraReady: isCameraReady})
        initRef.current = init; // Atualiza a ref sempre que init muda
        if (init && isCameraReady) {
            takeAndSpeak()
        } else {
            console.log('cancelando request')
            controller.abort()
        }

    }, [init, isCameraReady]);

    if (!permission) {
        // Camera permissions are still loading.
        return <View/>;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <LinearGradient
                // Background Linear Gradient
                colors={[Colors.argentinian_blue.DEFAULT, Colors.argentinian_blue["800"]]}
                style={styles.background}
            >
                <View style={[styles.container, {alignItems: 'center'}]}>
                    <Image
                        style={styles.image}
                        source={require("../assets/images/logoname.png")}
                        contentFit="contain"
                        transition={1000}
                    />
                    <BlurView intensity={60} style={styles.permission}>
                        <HelloWave/>
                        <Text style={[styles.text, {
                            fontSize: 18,
                            textAlign: 'center',
                            color: Colors.cobalt_blue.DEFAULT
                        }]}>Precisamos
                            da permissão da camera para continuar</Text>
                        <Button onPress={requestPermission} color={Colors.cobalt_blue.DEFAULT}
                                title="Conceder permissão"/>
                    </BlurView>
                </View>
            </LinearGradient>
        );
    }

    async function readImage(base64Image: string) {
        axios.post('https://apivision.carlosp.dev/imagem',
            {imagem_base64: base64Image},
            {
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ***REMOVED***`,
                }
            }).then(function (response) {
            // handle success
            const data: string = response?.data.data
            console.log(data);
            Speech.speak(data, {
                language: 'pt', onDone: () => {
                    console.log('terminou de falar', {init: init})

                    if (initRef.current) {
                        takeAndSpeak();
                    }
                }
            });

        }).catch(function (error) {
            console.log(error);
            ToastAndroid.show('Erro ao conectar na API!', ToastAndroid.SHORT);
            setInit(false)
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
        const image = await cameraRef.current?.takePictureAsync({base64: true, quality: 0.5, shutterSound: false});
        return image?.base64
    }

    const btnBgColor = init ? 'red' : 'green';

    function toggleFlash() {
        setEnableTorch(current => (!current));
    }
    //Camera view
    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} animateShutter={false} ref={cameraRef} enableTorch={enableTorch} onCameraReady={() => setIsCameraReady(true)}>
                <View style={styles.overlayTop}>
                    <Image
                        style={styles.image}
                        source={require("../assets/images/logoname.png")}
                        contentFit="contain"
                        transition={500}
                    />
                </View>
                <BlurView intensity={100} style={styles.overlayBottom}>
                    <View style={{
                        flexDirection: 'row',
                    }}>
                        <View style={styles.box} />
                        <View style={styles.box}>
                            <Pressable style={[styles.button, {backgroundColor: btnBgColor}]} onPress={() => setInit(!init)}>
                                <Text style={styles.text}>{init ? "Parar" : "Iniciar"}</Text>
                            </Pressable>
                            {processing && <View style={{flexDirection: 'row', gap: 8}}>
                                <Text style={[styles.text, {color: Colors.cobalt_blue.DEFAULT}]}>Processando</Text>
                                <ActivityIndicator color={Colors.cobalt_blue.DEFAULT}/>
                            </View>}
                        </View>
                        <View style={styles.box}>
                            <Pressable
                                style={styles.buttonRounded}
                                onPress={toggleFlash}>
                                <MaterialIcons name={enableTorch ? 'flashlight-off' : 'flashlight-on' } size={24} color="black" />
                            </Pressable>
                        </View>
                    </View>
                </BlurView>

            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        flex: 1, // Each box takes up equal space
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
    },
    image: {
        flex: 1,
        width: '45%'
    },
    permission: {
        flex: 0,
        gap: 40,
        padding: 25,
        margin: 40,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: 25
    },
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: "space-around",
        backgroundColor: "transparent",
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 4,
        elevation: 1,
        backgroundColor: 'green',
    },
    buttonRounded: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 100,
        elevation: 1,
        backgroundColor: 'white'
    },
    text: {
        fontFamily: 'Roboto',
        fontSize: 16,
        color: 'white',
    },
    background: {
        flex: 1

    },
    ///
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlayTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '15%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '15%', // Ajuste a altura conforme necessário
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        overflow: 'hidden',
        backgroundColor: 'rgba(4, 67, 175, 0.4)',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
    },
});
