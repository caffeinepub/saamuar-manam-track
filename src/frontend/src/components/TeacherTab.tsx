import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActivitySquare,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Loader2,
  TrendingDown,
  VolumeX,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ActivityType, BehaviorType } from "../backend.d";
import {
  useListStudents,
  useRecentActivity,
  useRecordBehavior,
  useStudentsByGrade,
} from "../hooks/useQueries";

const BEHAVIORS = [
  {
    id: BehaviorType.Active,
    label: "Active",
    desc: "Engaged and participatory",
    icon: ActivitySquare,
    color: "text-[oklch(0.66_0.13_152)]",
    bg: "bg-secondary",
    activeBg: "bg-[oklch(0.66_0.13_152)] text-white",
    border: "border-[oklch(0.66_0.13_152/0.3)]",
  },
  {
    id: BehaviorType.Silent,
    label: "Silent",
    desc: "Quiet, not participating",
    icon: VolumeX,
    color: "text-[oklch(0.55_0.10_220)]",
    bg: "bg-[oklch(0.97_0.015_220)]",
    activeBg: "bg-[oklch(0.55_0.10_220)] text-white",
    border: "border-[oklch(0.55_0.10_220/0.3)]",
  },
  {
    id: BehaviorType.LowParticipation,
    label: "Low Participation",
    desc: "Disengaged from activities",
    icon: TrendingDown,
    color: "text-[oklch(0.60_0.13_72)]",
    bg: "bg-[oklch(0.97_0.02_72)]",
    activeBg: "bg-[oklch(0.77_0.13_72)] text-white",
    border: "border-[oklch(0.77_0.13_72/0.3)]",
  },
  {
    id: BehaviorType.Aggressive,
    label: "Aggressive",
    desc: "Disruptive or confrontational",
    icon: AlertTriangle,
    color: "text-[oklch(0.60_0.19_25)]",
    bg: "bg-[oklch(0.97_0.02_25)]",
    activeBg: "bg-[oklch(0.60_0.19_25)] text-white",
    border: "border-[oklch(0.60_0.19_25/0.3)]",
  },
];

export function TeacherTab() {
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBehavior, setSelectedBehavior] = useState<BehaviorType | null>(
    null,
  );

  const { data: allStudents = [], isLoading: studentsLoading } =
    useListStudents();
  const { data: filteredStudents = [] } = useStudentsByGrade(gradeFilter);
  const displayStudents =
    gradeFilter === "all" ? allStudents : filteredStudents;
  const recordBehavior = useRecordBehavior();
  const { data: activity = [], isLoading: actLoading } = useRecentActivity();

  const recentBehaviorActivity = activity
    .filter((a) => a.activityType === ActivityType.Behavior)
    .slice(0, 5);

  const grades = [...new Set(allStudents.map((s) => s.grade))].sort(
    (a, b) => Number.parseInt(a) - Number.parseInt(b),
  );

  const handleSubmit = async () => {
    if (!selectedStudentId || !selectedBehavior) return;
    await recordBehavior.mutateAsync({
      studentId: selectedStudentId,
      behavior: selectedBehavior,
    });
    setSelectedStudentId("");
    setSelectedBehavior(null);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-5 animate-fade-in" data-ocid="teacher.section">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-[oklch(0.34_0.09_152)] rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5" />
          <h2 className="text-xl font-bold">Record Observation</h2>
        </div>
        <div className="flex items-center gap-1.5 text-primary-foreground/70 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
        </div>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-5 space-y-4">
          {/* Grade Filter */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Filter by Grade</Label>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="rounded-xl" data-ocid="teacher.select">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Selector */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Select Student</Label>
            {studentsLoading ? (
              <Skeleton className="h-10 rounded-xl" />
            ) : (
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger
                  className="rounded-xl"
                  data-ocid="teacher.student_select"
                >
                  <SelectValue placeholder="Choose a student..." />
                </SelectTrigger>
                <SelectContent>
                  {displayStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — Gr {s.grade}, Sec {s.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Behavior Options */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Behavior Observation</Label>
            <div className="grid grid-cols-2 gap-2">
              {BEHAVIORS.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => setSelectedBehavior(b.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all ${
                    selectedBehavior === b.id
                      ? `${b.activeBg} border-transparent shadow-card`
                      : `${b.bg} ${b.border} hover:shadow-xs`
                  }`}
                  data-ocid="teacher.behavior.toggle"
                >
                  <b.icon
                    className={`w-5 h-5 ${selectedBehavior === b.id ? "" : b.color}`}
                  />
                  <span className="text-sm font-semibold leading-tight">
                    {b.label}
                  </span>
                  <span
                    className={`text-xs leading-tight ${selectedBehavior === b.id ? "opacity-80" : "text-muted-foreground"}`}
                  >
                    {b.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              !selectedStudentId ||
              !selectedBehavior ||
              recordBehavior.isPending
            }
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 rounded-xl disabled:opacity-40"
            data-ocid="teacher.submit_button"
          >
            {recordBehavior.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Observation"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card className="shadow-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actLoading ? (
            <div className="space-y-2" data-ocid="teacher.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : recentBehaviorActivity.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-4"
              data-ocid="teacher.empty_state"
            >
              No recent observations yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentBehaviorActivity.map((item, idx) => (
                <motion.div
                  key={`${item.studentId}-${item.date}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                  data-ocid={`teacher.item.${idx + 1}`}
                >
                  <div>
                    <p className="text-sm font-semibold">{item.studentName}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {item.value}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
