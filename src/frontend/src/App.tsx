import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Leaf, Loader2, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { LoginScreen } from "./components/LoginScreen";
import { StudentTab } from "./components/StudentTab";
import { TeacherTab } from "./components/TeacherTab";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile } from "./hooks/useQueries";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

type TabId = "student" | "teacher" | "admin";

function AppContent() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState<TabId>("student");

  const role = profile?.role?.__kind__;

  // Determine available tabs based on role
  const tabs: { id: TabId; label: string; emoji: string }[] = [];
  if (role === "Admin") {
    tabs.push(
      { id: "student", label: "Check-in", emoji: "💚" },
      { id: "teacher", label: "Teacher", emoji: "📋" },
      { id: "admin", label: "Dashboard", emoji: "📊" },
    );
  } else if (role === "Teacher") {
    tabs.push({ id: "teacher", label: "Observations", emoji: "📋" });
  } else if (role === "Student") {
    tabs.push({ id: "student", label: "My Check-in", emoji: "💚" });
  }

  // Show loading while auth or profile loads
  if (isInitializing || (identity && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in or no profile → show login/setup
  if (!identity || !profile) {
    return <LoginScreen />;
  }

  // Ensure active tab is valid for this role
  const validTab = tabs.find((t) => t.id === activeTab)
    ? activeTab
    : (tabs[0]?.id ?? "student");

  // Get student ID from role if student
  const studentId =
    profile.role.__kind__ === "Student" ? profile.role.Student : "";

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary-foreground leading-none">
                SAAMUAR Manam Track
              </h1>
              <p className="text-xs text-primary-foreground/60 leading-none mt-0.5">
                {profile.name} · {role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground text-xs py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            data-ocid="app.logout.button"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-5 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={validTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {validTab === "student" && (
              <StudentTab studentId={studentId} studentName={profile.name} />
            )}
            {validTab === "teacher" && <TeacherTab />}
            {validTab === "admin" && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      {tabs.length > 1 && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-border shadow-lg z-40">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  validTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`app.${tab.id}.tab`}
              >
                <span className="text-lg leading-none">{tab.emoji}</span>
                <span className="text-xs font-medium">{tab.label}</span>
                {validTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 h-0.5 w-12 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-4 pb-24 hidden md:block">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <AppContent />
        <Toaster richColors position="top-center" />
      </InternetIdentityProvider>
    </QueryClientProvider>
  );
}
