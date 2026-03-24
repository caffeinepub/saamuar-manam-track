import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Leaf, Loader2, ShieldCheck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { AppRole } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useListStudents, useSaveUserProfile } from "../hooks/useQueries";

type RoleChoice = "Student" | "Teacher" | "Admin";

const roleCards = [
  {
    id: "Student" as RoleChoice,
    icon: GraduationCap,
    label: "Student",
    desc: "Check in your daily mood",
    color: "text-[oklch(0.66_0.13_152)]",
    bg: "bg-[oklch(0.96_0.025_145)]",
    border: "border-[oklch(0.66_0.13_152/0.3)]",
  },
  {
    id: "Teacher" as RoleChoice,
    icon: Users,
    label: "Teacher",
    desc: "Record student observations",
    color: "text-[oklch(0.77_0.13_72)]",
    bg: "bg-[oklch(0.97_0.02_72)]",
    border: "border-[oklch(0.77_0.13_72/0.3)]",
  },
  {
    id: "Admin" as RoleChoice,
    icon: ShieldCheck,
    label: "Admin",
    desc: "View full dashboard & reports",
    color: "text-primary",
    bg: "bg-secondary",
    border: "border-primary/20",
  },
];

export function LoginScreen() {
  const { login, isLoggingIn, isInitializing, identity } =
    useInternetIdentity();
  const [step, setStep] = useState<"welcome" | "role">("welcome");
  const [selectedRole, setSelectedRole] = useState<RoleChoice | null>(null);
  const [userName, setUserName] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const saveProfile = useSaveUserProfile();
  const { data: students = [] } = useListStudents();

  const handleContinue = async () => {
    if (!selectedRole || !userName.trim()) return;
    let role: AppRole;
    if (selectedRole === "Student") {
      if (!selectedStudentId) return;
      role = { __kind__: "Student", Student: selectedStudentId };
    } else if (selectedRole === "Teacher") {
      role = { __kind__: "Teacher", Teacher: null };
    } else {
      role = { __kind__: "Admin", Admin: null };
    }
    await saveProfile.mutateAsync({ name: userName.trim(), role });
  };

  const isFormValid =
    !!selectedRole &&
    !!userName.trim() &&
    (selectedRole !== "Student" || !!selectedStudentId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-mint-bg flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary leading-tight">
            SAAMUAR Manam Track
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Supporting student mental wellness
          </p>
        </div>

        {step === "welcome" && (
          <Card className="shadow-card border-0">
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Welcome
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sign in with your Internet Identity to get started
                </p>
              </div>

              {!identity ? (
                <Button
                  onClick={login}
                  disabled={isLoggingIn || isInitializing}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl text-base"
                  data-ocid="login.primary_button"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in to Continue"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setStep("role")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl text-base"
                  data-ocid="login.continue_button"
                >
                  Continue to Setup
                </Button>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                {roleCards.map((r) => (
                  <div key={r.id} className="text-center space-y-1">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${r.bg}`}
                    >
                      <r.icon className={`w-5 h-5 ${r.color}`} />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {r.label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === "role" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-card border-0">
              <CardContent className="p-6 space-y-5">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    Set Up Your Profile
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose your role to get started
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Your Name</Label>
                  <Input
                    placeholder="Enter your full name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="rounded-xl border-input"
                    data-ocid="login.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Role</Label>
                  <div className="grid gap-2">
                    {roleCards.map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setSelectedRole(r.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selectedRole === r.id
                            ? "border-primary bg-secondary"
                            : `border-border hover:border-primary/30 ${r.bg}`
                        }`}
                        data-ocid={`login.${r.id.toLowerCase()}_toggle`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${r.bg}`}
                        >
                          <r.icon className={`w-5 h-5 ${r.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {r.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedRole === "Student" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <Label className="text-sm font-medium">
                      Select Your Student Record
                    </Label>
                    <Select
                      value={selectedStudentId}
                      onValueChange={setSelectedStudentId}
                    >
                      <SelectTrigger
                        className="rounded-xl"
                        data-ocid="login.select"
                      >
                        <SelectValue placeholder="Choose your name..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} — Grade {s.grade}, Section {s.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

                <Button
                  onClick={handleContinue}
                  disabled={!isFormValid || saveProfile.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 rounded-xl"
                  data-ocid="login.submit_button"
                >
                  {saveProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Get Started →"
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
