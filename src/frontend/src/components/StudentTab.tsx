import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CheckCircle2, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useMoodHistory, useRecordMood } from "../hooks/useQueries";

const MOOD_OPTIONS = [
  {
    score: 1,
    emoji: "😢",
    label: "Very Bad",
    color:
      "bg-[oklch(0.95_0.04_25)] border-[oklch(0.60_0.19_25/0.4)] text-[oklch(0.45_0.15_25)]",
    activeColor:
      "bg-[oklch(0.60_0.19_25)] border-[oklch(0.60_0.19_25)] text-white",
  },
  {
    score: 2,
    emoji: "😕",
    label: "Bad",
    color:
      "bg-[oklch(0.96_0.04_55)] border-[oklch(0.77_0.13_55/0.4)] text-[oklch(0.55_0.12_55)]",
    activeColor:
      "bg-[oklch(0.77_0.13_55)] border-[oklch(0.77_0.13_55)] text-white",
  },
  {
    score: 3,
    emoji: "😐",
    label: "Okay",
    color:
      "bg-[oklch(0.97_0.02_72)] border-[oklch(0.77_0.13_72/0.4)] text-[oklch(0.55_0.10_72)]",
    activeColor:
      "bg-[oklch(0.77_0.13_72)] border-[oklch(0.77_0.13_72)] text-white",
  },
  {
    score: 4,
    emoji: "🙂",
    label: "Good",
    color: "bg-secondary border-primary/20 text-primary",
    activeColor:
      "bg-[oklch(0.66_0.13_152)] border-[oklch(0.66_0.13_152)] text-white",
  },
  {
    score: 5,
    emoji: "😄",
    label: "Very Good",
    color: "bg-secondary border-primary/30 text-primary",
    activeColor: "bg-primary border-primary text-white",
  },
];

function moodEmoji(score: number | bigint) {
  const s = Number(score);
  return MOOD_OPTIONS.find((m) => m.score === s)?.emoji ?? "❓";
}

function moodLabel(score: number | bigint) {
  const s = Number(score);
  return MOOD_OPTIONS.find((m) => m.score === s)?.label ?? "Unknown";
}

interface Props {
  studentId: string;
  studentName: string;
}

export function StudentTab({ studentId, studentName }: Props) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const recordMood = useRecordMood();
  const { data: history = [], isLoading: histLoading } =
    useMoodHistory(studentId);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async () => {
    if (selectedMood === null) return;
    await recordMood.mutateAsync({
      studentId,
      moodScore: BigInt(selectedMood),
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedMood(null);
    }, 3000);
  };

  const recentHistory = [...history]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 7);

  return (
    <div className="space-y-5 animate-fade-in" data-ocid="student.section">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-[oklch(0.34_0.09_152)] rounded-2xl p-5 text-primary-foreground">
        <p className="text-sm text-primary-foreground/70 font-medium">Hello,</p>
        <h2 className="text-xl font-bold">{studentName}</h2>
        <div className="flex items-center gap-1.5 mt-2 text-primary-foreground/70 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
        </div>
      </div>

      {/* Mood Picker */}
      <Card className="shadow-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            How are you feeling today?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-2" data-ocid="student.panel">
            {MOOD_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.score}
                onClick={() => setSelectedMood(option.score)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                  selectedMood === option.score
                    ? `${option.activeColor} scale-105 shadow-card`
                    : `${option.color} hover:scale-102`
                }`}
                data-ocid="student.mood.toggle"
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-xs font-medium leading-tight text-center">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 bg-secondary text-primary p-3 rounded-xl"
                data-ocid="student.success_state"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                  Mood recorded! Keep going 🌱
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleSubmit}
            disabled={selectedMood === null || recordMood.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 rounded-xl disabled:opacity-40"
            data-ocid="student.submit_button"
          >
            {recordMood.isPending ? "Saving..." : "Submit Today's Mood"}
          </Button>
        </CardContent>
      </Card>

      {/* Mood History */}
      <Card className="shadow-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Recent Mood History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {histLoading ? (
            <div className="space-y-2" data-ocid="student.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : recentHistory.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="student.empty_state"
            >
              <p className="text-sm">No mood entries yet.</p>
              <p className="text-xs mt-1">Submit your first check-in above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentHistory.map((entry, idx) => (
                <div
                  key={entry.entryId.toString()}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/60"
                  data-ocid={`student.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {moodEmoji(entry.moodScore)}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {moodLabel(entry.moodScore)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.date}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {Number(entry.moodScore)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
