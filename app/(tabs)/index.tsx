import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  const [transcript, setTranscript] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "listening" | "analyzing" | "completed"
  >("idle");

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (phase === "listening") {
      pulseAnimationRef.current?.stop();
      pulseAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimationRef.current.start();
    } else {
      pulseAnimationRef.current?.stop();
      pulseAnim.setValue(0);
    }

    return () => {
      pulseAnimationRef.current?.stop();
    };
  }, [phase, pulseAnim]);

  useEffect(() => {
    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
      }
      pulseAnimationRef.current?.stop();
    };
  }, []);

  useSpeechRecognitionEvent("start", () => {
    setPhase("listening");
  });
  useSpeechRecognitionEvent("end", () => {
    setPhase((prev) => (prev === "listening" ? "idle" : prev));
  });
  useSpeechRecognitionEvent("result", (event) => {
    const latestTranscript = event.results
      .map((item) => item.transcript)
      .join(" ")
      .trim();

    setTranscript(latestTranscript);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setPhase("idle");
    setErrorMessage(event.message);
  });

  const targetLevelLabel = loading
    ? "불러오는 중..."
    : (targetLevel ?? "미설정");

  const startAnalysisCountdown = () => {
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
    }
    setPhase("analyzing");
    analysisTimerRef.current = setTimeout(() => {
      setPhase("completed");
      analysisTimerRef.current = null;
    }, 5000);
  };

  const handleToggleRecognition = async () => {
    if (phase === "analyzing") {
      return;
    }

    if (phase === "listening") {
      ExpoSpeechRecognitionModule.stop();
      startAnalysisCountdown();
      return;
    }

    try {
      setErrorMessage(null);
      setTranscript("");
      setPhase("listening");

      const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      setPermissionGranted(permission.granted);

      if (!permission.granted) {
        const requested =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setPermissionGranted(requested.granted);

        if (!requested.granted) {
          setErrorMessage("음성 인식과 마이크 접근을 허용해야 합니다.");
          setPhase("idle");
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
      setPhase("idle");
      setErrorMessage("음성 인식을 시작할 수 없습니다.");
    }
  };

  const handleNextQuestion = () => {
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
    setPhase("idle");
    setTranscript("");
    setErrorMessage(null);
  };

  const isListening = phase === "listening";
  const estimatedGrade = (targetLevel ?? "IM2") as LevelId;
  const displayedTranscript =
    transcript ||
    "Oh, I really enjoy traveling. Recently, I went to Busan with my family and we had a great time by the beach.";

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

        {phase === "completed" ? (
          <View className="mt-6 flex-1">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              <View className="rounded-3xl bg-slate-900 p-5 shadow-lg">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-semibold text-slate-200">
                      Estimated Grade
                    </Text>
                    <Text className="mt-1 text-4xl font-extrabold text-amber-300">
                      {estimatedGrade}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleNextQuestion}
                    className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2"
                  >
                    <Text className="text-base font-semibold text-slate-100">
                      Next Question
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <Text className="text-lg font-semibold text-gray-900">
                  You said:
                </Text>
                <Text className="mt-3 text-base leading-6 text-gray-700">
                  {`"${displayedTranscript}"`}
                </Text>
              </View>

              <View className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                <View className="flex-row items-center gap-2">
                  <View className="h-3 w-3 rounded-full bg-indigo-500" />
                  <Text className="text-xl font-semibold text-indigo-900">
                    Feedback
                  </Text>
                </View>
                <Text className="mt-3 text-base leading-6 text-indigo-900">
                  The speaker addresses all parts of the prompt and shows steady
                  pace with clear intent. Watch for basic grammatical slips
                  (articles and past tense) and aim for fuller sentences to
                  reach {estimatedGrade}.
                </Text>
                <Text className="mt-4 text-xs font-bold uppercase text-indigo-600">
                  Pronunciation Check
                </Text>
                <View className="mt-2">
                  <View className="rounded-xl bg-white/80 px-3 py-2">
                    <Text className="text-sm font-semibold text-indigo-800">
                      {"Emphasize the correct stress in \"famous\" (FAY-mus)."}
                    </Text>
                  </View>
                  <View className="mt-2 rounded-xl bg-white/80 px-3 py-2">
                    <Text className="text-sm font-semibold text-indigo-800">
                      {"Use the past tense \"ate\" instead of \"eat.\""}
                    </Text>
                  </View>
                  <View className="mt-2 rounded-xl bg-white/80 px-3 py-2">
                    <Text className="text-sm font-semibold text-indigo-800">
                      {"Stretch the long \"ee\" in \"beach\" and shorten the \"i\" in \"trip.\""}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                <Text className="text-xl font-semibold text-emerald-900">
                  Sample Answer ({estimatedGrade})
                </Text>
                <Text className="mt-3 text-base leading-6 text-emerald-900">
                  {"That's a great question. I recently took a wonderful trip to Busan with my family. We stayed near the beach, enjoyed fresh seafood, and even rode a cable car for an amazing view. It was relaxing, beautiful, and a perfect short getaway."}
                </Text>
              </View>
            </ScrollView>
          </View>
        ) : phase === "analyzing" ? (
          <View className="mt-10 flex-1 items-center justify-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-indigo-50">
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
            <Text className="mt-6 text-xl font-semibold text-gray-900">
              Analyzing your response...
            </Text>
            <Text className="mt-2 text-base text-gray-600">
              Checking pronunciation and grammar (약 5초)
            </Text>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <View className="relative mt-6 h-32 w-32 items-center justify-center">
              {isListening && (
                <>
                  <Animated.View
                    className="absolute h-32 w-32 rounded-full bg-red-400"
                    style={{
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.8],
                          }),
                        },
                      ],
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.35, 0],
                      }),
                    }}
                  />
                  <Animated.View
                    className="absolute h-28 w-28 rounded-full bg-red-500"
                    style={{
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.6],
                          }),
                        },
                      ],
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.25, 0],
                      }),
                    }}
                  />
                </>
              )}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleToggleRecognition}
                className={`h-20 w-20 items-center justify-center rounded-full shadow-xl ${
                  isListening ? "bg-red-500" : "bg-primary-600"
                }`}
              >
                <IconSymbol
                  name={isListening ? "stop.fill" : "mic.fill"}
                  size={32}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <Text className="mt-3 text-sm font-semibold text-gray-800">
              {isListening ? "Tap to Stop" : "Tap to Answer"}
            </Text>
            <Text className="mt-1 text-xs text-gray-500">
              {isListening ? "Listening..." : "녹음을 시작하려면 탭하세요."}
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
                <Text className="mt-2 text-xs text-red-500">
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
