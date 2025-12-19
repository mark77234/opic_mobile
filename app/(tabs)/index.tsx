import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  LEVEL_OPTIONS,
  LevelId,
  TARGET_LEVEL_STORAGE_KEY,
} from "@/constants/opic";

export default function PracticeScreen() {
  const [targetLevel, setTargetLevel] = useState<LevelId | null>(null);
  const [loading, setLoading] = useState(true);
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadLevel = async () => {
        try {
          const storedLevel = await AsyncStorage.getItem(
            TARGET_LEVEL_STORAGE_KEY
          );
          const isValidLevel = LEVEL_OPTIONS.some(
            (option) => option.id === storedLevel
          );

          if (isMounted) {
            setTargetLevel(isValidLevel ? (storedLevel as LevelId) : null);
          }
        } catch (error) {
          console.error("Failed to load target level", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadLevel();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const result =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();

        setPermissionGranted(result.granted);

        if (!result.granted) {
          setErrorMessage("음성 인식 권한을 허용해 주세요.");
        }
      } catch (error) {
        console.error("Failed to request speech permissions", error);
        setErrorMessage("권한을 확인하는 중 문제가 발생했습니다.");
      }
    };

    requestPermissions();
  }, []);

  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));
  useSpeechRecognitionEvent("result", (event) => {
    const latestTranscript = event.results
      .map((item) => item.transcript)
      .join(" ")
      .trim();

    setTranscript(latestTranscript);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setRecognizing(false);
    setErrorMessage(event.message);
  });

  const targetLevelLabel = loading
    ? "불러오는 중..."
    : (targetLevel ?? "미설정");

  const handleToggleRecognition = async () => {
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      setErrorMessage(null);
      setTranscript("");

      const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();

      if (!permission.granted) {
        const requested =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setPermissionGranted(requested.granted);

        if (!requested.granted) {
          setErrorMessage("음성 인식과 마이크 접근을 허용해야 합니다.");
          return;
        }
      } else {
        setPermissionGranted(true);
      }

      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.error("Failed to start speech recognition", error);
      setErrorMessage("음성 인식을 시작할 수 없습니다.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5 pb-10 pt-4">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-2xl font-semibold text-gray-900">
              Practice Mode
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-base text-gray-600">Targeting:</Text>
              <Text className="text-base font-semibold text-primary-600">
                {targetLevelLabel}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {}}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 "
          >
            <Text className="text-base font-semibold text-gray-700">
              Skip Question
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/onboarding")}
          className="mt-3 self-start rounded-full border border-primary-200 bg-primary-50 px-3 py-2"
        >
          <Text className="text-base font-semibold text-primary-600">
            목표 등급 다시 선택하기
          </Text>
        </TouchableOpacity>

        <View className="mt-6 rounded-2xl border border-gray-300 bg-white p-5 ">
          <Text className="self-start rounded-full bg-primary-100 px-3 py-1 text-base font-semibold uppercase tracking-wide text-primary-600">
            Random
          </Text>
          <Text className="mt-3 text-2xl font-semibold text-gray-900">
            Tell me a little bit about yourself.
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleToggleRecognition}
            className="h-20 w-20 items-center justify-center rounded-full bg-primary-600 shadow-lg"
          >
            <IconSymbol name="mic.fill" size={32} color="#fff" />
          </TouchableOpacity>
          <Text className="mt-3 text-sm text-gray-700">
            {recognizing ? "Listening..." : "Tap to Answer"}
          </Text>

          <View className="mt-6 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <Text className="text-base font-semibold text-gray-900">
              인식된 텍스트
            </Text>
            <Text className="mt-2 text-sm text-gray-700">
              {transcript ||
                (permissionGranted
                  ? "마이크 버튼을 누르고 말해보세요."
                  : "권한을 허용해 주세요.")}
            </Text>
            {errorMessage ? (
              <Text className="mt-2 text-xs text-red-500">{errorMessage}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
