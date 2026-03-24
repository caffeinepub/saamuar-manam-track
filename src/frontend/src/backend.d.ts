import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MoodEntry {
    studentId: string;
    date: string;
    entryId: bigint;
    moodScore: bigint;
}
export interface StudentSummary {
    id: string;
    latestBehavior?: BehaviorType;
    name: string;
    latestMood?: bigint;
    section: string;
    grade: string;
    riskLevel: RiskLevel;
}
export type AppRole = {
    __kind__: "Teacher";
    Teacher: null;
} | {
    __kind__: "Student";
    Student: string;
} | {
    __kind__: "Admin";
    Admin: null;
};
export interface ActivityItem {
    activityType: ActivityType;
    studentId: string;
    studentName: string;
    value: string;
    date: string;
}
export interface BehaviorEntry {
    behavior: BehaviorType;
    studentId: string;
    date: string;
    entryId: bigint;
}
export interface UserProfile {
    name: string;
    role: AppRole;
}
export interface Student {
    id: string;
    name: string;
    section: string;
    grade: string;
}
export enum ActivityType {
    Mood = "Mood",
    Behavior = "Behavior"
}
export enum BehaviorType {
    LowParticipation = "LowParticipation",
    Aggressive = "Aggressive",
    Active = "Active",
    Silent = "Silent"
}
export enum RiskLevel {
    Low = "Low",
    High = "High",
    Medium = "Medium"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStudent(student: Student): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    exportDataAsCSV(): Promise<string>;
    getAllStudentSummaries(): Promise<Array<StudentSummary>>;
    getBehaviorHistory(studentId: string): Promise<Array<BehaviorEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMoodHistory(studentId: string): Promise<Array<MoodEntry>>;
    getRecentActivityFeed(): Promise<Array<ActivityItem>>;
    getStudentsByGrade(grade: string): Promise<Array<Student>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listStudents(): Promise<Array<Student>>;
    recordBehaviorEntry(studentId: string, behavior: string): Promise<void>;
    recordMoodEntry(studentId: string, moodScore: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
