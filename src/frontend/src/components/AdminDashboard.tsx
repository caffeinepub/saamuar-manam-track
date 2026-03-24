import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Download,
  LayoutDashboard,
  Loader2,
  Minus,
  Plus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ActivityType, BehaviorType, RiskLevel } from "../backend.d";
import {
  useAddStudent,
  useAllStudentSummaries,
  useExportCSV,
  useRecentActivity,
} from "../hooks/useQueries";
import type { Student } from "../hooks/useQueries";

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    [RiskLevel.High]:
      "bg-[oklch(0.95_0.04_25)] text-[oklch(0.45_0.17_25)] border-[oklch(0.60_0.19_25/0.3)]",
    [RiskLevel.Medium]:
      "bg-[oklch(0.97_0.03_72)] text-[oklch(0.50_0.12_72)] border-[oklch(0.77_0.13_72/0.3)]",
    [RiskLevel.Low]:
      "bg-secondary text-[oklch(0.33_0.085_152)] border-primary/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[risk]}`}
    >
      {risk}
    </span>
  );
}

function moodEmoji(score?: bigint) {
  if (score === undefined) return "—";
  const s = Number(score);
  const map: Record<number, string> = {
    1: "😢",
    2: "😕",
    3: "😐",
    4: "🙂",
    5: "😄",
  };
  return `${map[s] ?? "❓"} ${s}`;
}

const SECTIONS = ["A", "B", "C", "D"];
const GRADES = Array.from({ length: 12 }, (_, i) => String(i + 1));

function AddStudentModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Student>({
    id: "",
    name: "",
    grade: "",
    section: "",
  });
  const addStudent = useAddStudent();

  const handleAdd = async () => {
    if (!form.id || !form.name || !form.grade || !form.section) return;
    await addStudent.mutateAsync(form);
    setOpen(false);
    setForm({ id: "", name: "", grade: "", section: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-1.5"
          data-ocid="admin.open_modal_button"
        >
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-sm" data-ocid="admin.dialog">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Student ID</Label>
            <Input
              placeholder="e.g. STU-001"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="rounded-xl"
              data-ocid="admin.student_id.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              placeholder="Student full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl"
              data-ocid="admin.student_name.input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Grade</Label>
              <Select
                value={form.grade}
                onValueChange={(v) => setForm({ ...form, grade: v })}
              >
                <SelectTrigger
                  className="rounded-xl"
                  data-ocid="admin.grade.select"
                >
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select
                value={form.section}
                onValueChange={(v) => setForm({ ...form, section: v })}
              >
                <SelectTrigger
                  className="rounded-xl"
                  data-ocid="admin.section.select"
                >
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      Section {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpen(false)}
              data-ocid="admin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground rounded-xl"
              onClick={handleAdd}
              disabled={
                !form.id ||
                !form.name ||
                !form.grade ||
                !form.section ||
                addStudent.isPending
              }
              data-ocid="admin.confirm_button"
            >
              {addStudent.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add Student"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminDashboard() {
  const [gradeFilter, setGradeFilter] = useState("all");
  const { data: summaries = [], isLoading } = useAllStudentSummaries();
  const { data: activity = [], isLoading: actLoading } = useRecentActivity();
  const exportCSV = useExportCSV();

  const filtered =
    gradeFilter === "all"
      ? summaries
      : summaries.filter((s) => s.grade === gradeFilter);

  const grades = [...new Set(summaries.map((s) => s.grade))].sort(
    (a, b) => Number.parseInt(a) - Number.parseInt(b),
  );

  const highRisk = summaries.filter(
    (s) => s.riskLevel === RiskLevel.High,
  ).length;
  const mediumRisk = summaries.filter(
    (s) => s.riskLevel === RiskLevel.Medium,
  ).length;

  const formatBehavior = (b?: BehaviorType) => {
    if (!b) return "—";
    const map: Record<BehaviorType, string> = {
      [BehaviorType.Active]: "Active",
      [BehaviorType.Silent]: "Silent",
      [BehaviorType.LowParticipation]: "Low Participation",
      [BehaviorType.Aggressive]: "Aggressive",
    };
    return map[b];
  };

  return (
    <div className="space-y-5 animate-fade-in" data-ocid="admin.section">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-[oklch(0.34_0.09_152)] rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            <h2 className="text-xl font-bold">Dashboard</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl gap-1.5"
            onClick={() => exportCSV.mutate()}
            disabled={exportCSV.isPending}
            data-ocid="admin.export.button"
          >
            {exportCSV.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export
          </Button>
        </div>
        <p className="text-sm text-primary-foreground/70 mt-1">
          Student Mental Health Overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {summaries.length}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 border-l-2 border-l-[oklch(0.60_0.19_25)]">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-5 h-5 text-[oklch(0.60_0.19_25)] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[oklch(0.60_0.19_25)]">
              {highRisk}
            </p>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 border-l-2 border-l-[oklch(0.77_0.13_72)]">
          <CardContent className="p-4 text-center">
            <Minus className="w-5 h-5 text-[oklch(0.60_0.13_72)] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[oklch(0.60_0.13_72)]">
              {mediumRisk}
            </p>
            <p className="text-xs text-muted-foreground">Medium Risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger
            className="flex-1 rounded-xl"
            data-ocid="admin.grade_filter.select"
          >
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
        <AddStudentModal />
      </div>

      {/* Student Table */}
      <Card className="shadow-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Students</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3" data-ocid="admin.loading_state">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="admin.empty_state"
            >
              <p className="text-sm">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="admin.table">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold pl-4">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Grade
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Mood
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Behavior
                    </TableHead>
                    <TableHead className="text-xs font-semibold pr-4">
                      Risk
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student, idx) => (
                    <TableRow
                      key={student.id}
                      className={`${
                        student.riskLevel === RiskLevel.High
                          ? "bg-[oklch(0.97_0.02_25)] hover:bg-[oklch(0.95_0.03_25)]"
                          : "hover:bg-secondary/50"
                      }`}
                      data-ocid={`admin.row.${idx + 1}`}
                    >
                      <TableCell className="pl-4">
                        <div>
                          <p className="text-sm font-semibold">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sec {student.section}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full font-medium">
                          Gr {student.grade}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {moodEmoji(student.latestMood)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatBehavior(student.latestBehavior)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4">
                        <RiskBadge risk={student.riskLevel} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actLoading ? (
            <div className="space-y-2" data-ocid="admin.activity.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-4"
              data-ocid="admin.activity.empty_state"
            >
              No recent activity
            </p>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 8).map((item, idx) => (
                <motion.div
                  key={`${item.studentId}-${item.date}-${item.activityType}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                  data-ocid={`admin.activity.item.${idx + 1}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {item.activityType === ActivityType.Mood ? "💭" : "📋"}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.date}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {item.activityType === ActivityType.Mood
                      ? `Mood: ${item.value}`
                      : item.value}
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
