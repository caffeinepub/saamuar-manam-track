import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Int "mo:core/Int";
import Char "mo:core/Char";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  type Student = {
    id : Text;
    name : Text;
    grade : Text;
    section : Text;
  };

  type MoodEntry = {
    entryId : Nat;
    studentId : Text;
    moodScore : Nat; // 1-5
    date : Text;
  };

  type BehaviorType = {
    #Active;
    #Silent;
    #LowParticipation;
    #Aggressive;
  };

  type BehaviorEntry = {
    entryId : Nat;
    studentId : Text;
    behavior : BehaviorType;
    date : Text;
  };

  type RiskLevel = {
    #Low;
    #Medium;
    #High;
  };

  type StudentSummary = {
    id : Text;
    name : Text;
    grade : Text;
    section : Text;
    latestMood : ?Nat;
    latestBehavior : ?BehaviorType;
    riskLevel : RiskLevel;
  };

  type ActivityType = { #Mood; #Behavior };

  type ActivityItem = {
    studentId : Text;
    studentName : Text;
    activityType : ActivityType;
    value : Text;
    date : Text;
  };

  // Custom role types for the application
  type AppRole = {
    #Student : Text; // studentId
    #Teacher;
    #Admin;
  };

  public type UserProfile = {
    name : Text;
    role : AppRole;
  };

  // Student module
  module Student {
    public func compare(s1 : Student, s2 : Student) : Order.Order {
      Text.compare(s1.id, s2.id);
    };
  };

  // Behavior module
  module Behavior {
    public func toText(behavior : BehaviorType) : Text {
      switch (behavior) {
        case (#Active) { "Active" };
        case (#Silent) { "Silent" };
        case (#LowParticipation) { "LowParticipation" };
        case (#Aggressive) { "Aggressive" };
      };
    };
  };

  // ActivityItem module
  module ActivityItem {
    public func compareByDateDesc(a1 : ActivityItem, a2 : ActivityItem) : Order.Order {
      switch (Text.compare(a2.date, a1.date)) {
        case (#equal) { Int.compare(a2.date.size(), a1.date.size()) };
        case (order) { order };
      };
    };
  };

  // State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let students = Map.empty<Text, Student>();
  let moodEntries = Map.empty<Text, List.List<MoodEntry>>();
  let behaviorEntries = Map.empty<Text, List.List<BehaviorEntry>>();
  var moodEntryCounter = 0;
  var behaviorEntryCounter = 0;

  // User profiles mapping principals to app roles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper function to get user's app role
  func getUserAppRole(caller : Principal) : ?AppRole {
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile.role };
    };
  };

  // Helper function to check if user is admin
  func isAppAdmin(caller : Principal) : Bool {
    switch (getUserAppRole(caller)) {
      case (?#Admin) { true };
      case (_) { false };
    };
  };

  // Helper function to check if user is teacher
  func isTeacher(caller : Principal) : Bool {
    switch (getUserAppRole(caller)) {
      case (?#Teacher) { true };
      case (_) { false };
    };
  };

  // Helper function to check if user is student and get their ID
  func getStudentId(caller : Principal) : ?Text {
    switch (getUserAppRole(caller)) {
      case (?#Student(id)) { ?id };
      case (_) { null };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    // Validate that student ID exists if role is Student
    switch (profile.role) {
      case (#Student(studentId)) {
        if (not students.containsKey(studentId)) {
          Runtime.trap("Invalid student ID");
        };
      };
      case (_) {};
    };
    userProfiles.add(caller, profile);
  };

  // Student Management (Admin only)
  public shared ({ caller }) func addStudent(student : Student) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admin can add students");
    };
    if (students.containsKey(student.id)) { 
      Runtime.trap("Student with this ID already exists") 
    };
    students.add(student.id, student);
  };

  public query ({ caller }) func listStudents() : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    if (not isAppAdmin(caller) and not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only admin and teachers can list students");
    };
    students.values().toArray();
  };

  public query ({ caller }) func getStudentsByGrade(grade : Text) : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    if (not isAppAdmin(caller) and not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only admin and teachers can view students");
    };
    students.values().toArray().filter(func(s) { s.grade == grade });
  };

  // Mood Entries (Student role only)
  public shared ({ caller }) func recordMoodEntry(studentId : Text, moodScore : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    
    // Check if caller is a student
    let callerStudentId = switch (getStudentId(caller)) {
      case (null) { Runtime.trap("Unauthorized: Only students can record mood entries") };
      case (?id) { id };
    };
    
    // Students can only record their own mood
    if (callerStudentId != studentId) {
      Runtime.trap("Unauthorized: Students can only record their own mood entries");
    };
    
    if (moodScore < 1 or moodScore > 5) { 
      Runtime.trap("Mood score must be between 1 and 5") 
    };
    if (not students.containsKey(studentId)) { 
      Runtime.trap("Student not found") 
    };
    
    let entry : MoodEntry = {
      entryId = moodEntryCounter;
      studentId;
      moodScore;
      date = Time.now().toText();
    };
    let existingEntries = switch (moodEntries.get(studentId)) {
      case (null) { List.empty<MoodEntry>() };
      case (?list) { list };
    };
    existingEntries.add(entry);
    moodEntries.add(studentId, existingEntries);
    moodEntryCounter += 1;
  };

  // Behavior Entries (Teacher role only)
  public shared ({ caller }) func recordBehaviorEntry(studentId : Text, behavior : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    
    // Check if caller is a teacher
    if (not isTeacher(caller)) {
      Runtime.trap("Unauthorized: Only teachers can record behavior entries");
    };
    
    let behaviorEnum = switch (behavior.toLower()) {
      case ("active") { #Active };
      case ("silent") { #Silent };
      case ("low participation") { #LowParticipation };
      case ("aggressive") { #Aggressive };
      case (_) { Runtime.trap("Invalid behavior type") };
    };
    
    if (not students.containsKey(studentId)) { 
      Runtime.trap("Student not found") 
    };
    
    let entry : BehaviorEntry = {
      entryId = behaviorEntryCounter;
      studentId;
      behavior = behaviorEnum;
      date = Time.now().toText();
    };
    let existingEntries = switch (behaviorEntries.get(studentId)) {
      case (null) { List.empty<BehaviorEntry>() };
      case (?list) { list };
    };
    existingEntries.add(entry);
    behaviorEntries.add(studentId, existingEntries);
    behaviorEntryCounter += 1;
  };

  // Get Mood History (Students can view own, teachers and admins can view any)
  public query ({ caller }) func getMoodHistory(studentId : Text) : async [MoodEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    
    // Check authorization
    let authorized = switch (getUserAppRole(caller)) {
      case (?#Admin) { true };
      case (?#Teacher) { true };
      case (?#Student(id)) { id == studentId };
      case (_) { false };
    };
    
    if (not authorized) {
      Runtime.trap("Unauthorized: Students can only view their own mood history");
    };
    
    switch (moodEntries.get(studentId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // Get Behavior History (Students can view own, teachers and admins can view any)
  public query ({ caller }) func getBehaviorHistory(studentId : Text) : async [BehaviorEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    
    // Check authorization
    let authorized = switch (getUserAppRole(caller)) {
      case (?#Admin) { true };
      case (?#Teacher) { true };
      case (?#Student(id)) { id == studentId };
      case (_) { false };
    };
    
    if (not authorized) {
      Runtime.trap("Unauthorized: Students can only view their own behavior history");
    };
    
    switch (behaviorEntries.get(studentId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // Get All Student Summaries (Admin only)
  public query ({ caller }) func getAllStudentSummaries() : async [StudentSummary] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admin can view summaries");
    };
    
    students.values().toArray().map(
      func(student) {
        {
          id = student.id;
          name = student.name;
          grade = student.grade;
          section = student.section;
          latestMood = getLatestMood(student.id);
          latestBehavior = getLatestBehavior(student.id);
          riskLevel = calculateRiskLevel(student.id);
        };
      }
    );
  };

  // Get Activity Feed (Admin only)
  public query ({ caller }) func getRecentActivityFeed() : async [ActivityItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admin can view activity feed");
    };

    let moodActivities = moodEntries.entries().flatMap(
      func((studentId, entries)) {
        entries.values().map(
          func(entry) {
            {
              studentId;
              studentName = getStudentName(studentId);
              activityType = #Mood;
              value = entry.moodScore.toText();
              date = entry.date;
            };
          }
        );
      }
    );

    let behaviorActivities = behaviorEntries.entries().flatMap(
      func((studentId, entries)) {
        entries.values().map(
          func(entry) {
            {
              studentId;
              studentName = getStudentName(studentId);
              activityType = #Behavior;
              value = Behavior.toText(entry.behavior);
              date = entry.date;
            };
          }
        );
      }
    );

    let activityArray = (
      moodActivities.concat(behaviorActivities)
    );

    let sorted = activityArray.toArray().sort(ActivityItem.compareByDateDesc);

    let size = Nat.min(20, sorted.size());
    sorted.sliceToArray(0, size);
  };

  // Export Data as CSV (Admin only)
  public query ({ caller }) func exportDataAsCSV() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admin can export data");
    };

    var csv = "Type,StudentID,StudentName,Grade,Section,Value,Date\n";
    
    // Export students
    for ((id, student) in students.entries()) {
      csv #= "Student," # student.id # "," # student.name # "," # student.grade # "," # student.section # ",,\n";
    };
    
    // Export mood entries
    for ((studentId, entries) in moodEntries.entries()) {
      let studentName = getStudentName(studentId);
      for (entry in entries.values()) {
        csv #= "Mood," # studentId # "," # studentName # ",,," # entry.moodScore.toText() # "," # entry.date # "\n";
      };
    };
    
    // Export behavior entries
    for ((studentId, entries) in behaviorEntries.entries()) {
      let studentName = getStudentName(studentId);
      for (entry in entries.values()) {
        csv #= "Behavior," # studentId # "," # studentName # ",,," # Behavior.toText(entry.behavior) # "," # entry.date # "\n";
      };
    };
    
    csv;
  };

  // Helper Functions
  func getLatestMood(studentId : Text) : ?Nat {
    switch (moodEntries.get(studentId)) {
      case (null) { null };
      case (?list) {
        if (list.isEmpty()) {
          return null;
        };
        list.first().map(func(e) { e.moodScore });
      };
    };
  };

  func getLatestBehavior(studentId : Text) : ?BehaviorType {
    switch (behaviorEntries.get(studentId)) {
      case (null) { null };
      case (?list) {
        if (list.isEmpty()) {
          return null;
        };
        list.first().map(func(e) { e.behavior });
      };
    };
  };

  func getLastThreeMoods(studentId : Text) : [Nat] {
    switch (moodEntries.get(studentId)) {
      case (null) { [] };
      case (?list) {
        let arr = list.toArray();
        let size = Nat.min(3, arr.size());
        arr.sliceToArray(0, size).map(func(e : MoodEntry) : Nat { e.moodScore });
      };
    };
  };

  func calculateRiskLevel(studentId : Text) : RiskLevel {
    let lastThreeMoods = getLastThreeMoods(studentId);
    let latestBehavior = getLatestBehavior(studentId);
    
    // High if last 3 mood entries all ≤ 2 AND latest behavior is "Low Participation" or "Aggressive"
    if (lastThreeMoods.size() >= 3) {
      let allLowMood = lastThreeMoods.all(func(score : Nat) : Bool { score <= 2 });
      let dangerousBehavior = switch (latestBehavior) {
        case (?#LowParticipation) { true };
        case (?#Aggressive) { true };
        case (_) { false };
      };
      if (allLowMood and dangerousBehavior) {
        return #High;
      };
    };
    
    // Medium if latest mood = 3 OR latest behavior = "Silent"
    let latestMood = getLatestMood(studentId);
    let isMediumMood = switch (latestMood) {
      case (?3) { true };
      case (_) { false };
    };
    let isSilent = switch (latestBehavior) {
      case (?#Silent) { true };
      case (_) { false };
    };
    if (isMediumMood or isSilent) {
      return #Medium;
    };
    
    // Low otherwise
    #Low;
  };

  func getStudentName(studentId : Text) : Text {
    switch (students.get(studentId)) {
      case (null) { "Unknown" };
      case (?student) { student.name };
    };
  };
};
