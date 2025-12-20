import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { LevelId } from "@/constants/opic";

type CompletedSectionProps = {
  estimatedGrade: LevelId;
  displayedTranscript: string;
  feedbackTips: string[];
  sampleAnswer: string;
  onNextQuestion: () => void;
};

export function CompletedSection({
  estimatedGrade,
  displayedTranscript,
  feedbackTips,
  sampleAnswer,
  onNextQuestion,
}: CompletedSectionProps) {
  return (
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
              onPress={onNextQuestion}
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2"
            >
              <Text className="text-base font-semibold text-slate-100">
                Next Question
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900">You said:</Text>
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
            The speaker addresses all parts of the prompt and shows steady pace
            with clear intent. Watch for basic grammatical slips (articles and
            past tense) and aim for fuller sentences to reach {estimatedGrade}.
          </Text>
          <Text className="mt-4 text-xs font-bold uppercase text-indigo-600">
            Pronunciation Check
          </Text>
          <View className="mt-2">
            {feedbackTips.map((tip) => (
              <View
                key={tip}
                className="mt-2 rounded-xl bg-white/80 px-3 py-2 first:mt-0"
              >
                <Text className="text-sm font-semibold text-indigo-800">
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <Text className="text-xl font-semibold text-emerald-900">
            Sample Answer ({estimatedGrade})
          </Text>
          <Text className="mt-3 text-base leading-6 text-emerald-900">
            {sampleAnswer}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
