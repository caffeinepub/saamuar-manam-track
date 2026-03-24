import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ActivityItem,
  AppRole,
  BehaviorEntry,
  MoodEntry,
  Student,
  StudentSummary,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

export type {
  Student,
  StudentSummary,
  MoodEntry,
  BehaviorEntry,
  ActivityItem,
  UserProfile,
  AppRole,
};

export function useListStudents() {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStudentsByGrade(grade: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["students", "grade", grade],
    queryFn: async () => {
      if (!actor) return [];
      if (!grade || grade === "all") return actor.listStudents();
      return actor.getStudentsByGrade(grade);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllStudentSummaries() {
  const { actor, isFetching } = useActor();
  return useQuery<StudentSummary[]>({
    queryKey: ["student-summaries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStudentSummaries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMoodHistory(studentId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<MoodEntry[]>({
    queryKey: ["mood-history", studentId],
    queryFn: async () => {
      if (!actor || !studentId) return [];
      return actor.getMoodHistory(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

export function useBehaviorHistory(studentId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<BehaviorEntry[]>({
    queryKey: ["behavior-history", studentId],
    queryFn: async () => {
      if (!actor || !studentId) return [];
      return actor.getBehaviorHistory(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

export function useRecentActivity() {
  const { actor, isFetching } = useActor();
  return useQuery<ActivityItem[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentActivityFeed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save profile");
    },
  });
}

export function useRecordMood() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      moodScore,
    }: { studentId: string; moodScore: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.recordMoodEntry(studentId, moodScore);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["mood-history", vars.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["student-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      toast.success("Mood recorded successfully! 🌱");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record mood");
    },
  });
}

export function useRecordBehavior() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      behavior,
    }: { studentId: string; behavior: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.recordBehaviorEntry(studentId, behavior);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["behavior-history", vars.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["student-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      toast.success("Observation saved successfully! ✓");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save observation");
    },
  });
}

export function useAddStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: Student) => {
      if (!actor) throw new Error("Not connected");
      return actor.addStudent(student);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-summaries"] });
      toast.success("Student added successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add student");
    },
  });
}

export function useExportCSV() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.exportDataAsCSV();
    },
    onSuccess: (csv: string) => {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saamuar-manam-track-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to export");
    },
  });
}
