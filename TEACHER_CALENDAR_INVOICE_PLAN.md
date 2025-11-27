# Teacher Calendar & Invoice Automation Plan

## Overview
We are implementing a system where teachers have their own login and calendar to manage lessons. These lessons automatically feed into the invoice manager. Invoices are generated on the last day of the month based on attended (and billable cancelled) lessons.

## Core Requirements
1.  **Teacher Role & Login:** Teachers have restricted access (own calendar only).
2.  **Lesson Management:**
    *   Calendar and List views.
    *   Status tracking: Scheduled, Attended, Cancelled (On Time/Late).
    *   Cancellation Policy enforcement (24h Online / 48h Offline).
    *   **Substitution:** Teachers can re-assign lessons or groups to other teachers (e.g., for holidays).
3.  **Student Management:**
    *   **Student Database:** Distinct from "Customers" (who pay). Students attend the lessons.
    *   **Email Notifications:** Students receive emails when lessons are created or changed.
4.  **Admin Overview:**
    *   View all lessons by Teacher, Customer, or All.
    *   Override cancellation restrictions.
    *   Allocate teachers to Customers or Groups.
5.  **Client Groups:** Business clients can have multiple groups (e.g., "Marketing Team", "Sales Team") with different teachers.
6.  **Automated Invoicing:**
    *   Monthly generation (last day of month).
    *   Aggregates billable lessons per customer.

## 1. Database Schema Changes

### New Tables

#### `students`
Represents the individual attending the class.
```typescript
students: defineTable({
  workspaceId: v.id("workspaces"),
  customerId: v.id("customers"), // The paying entity (Company or Individual)
  groupId: v.optional(v.id("studentGroups")), // Optional group affiliation
  
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(), // For notifications
  phone: v.optional(v.string()),
  
  notes: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_customer", ["customerId"])
  .index("by_group", ["groupId"])
  .index("by_email", ["email"])
```

#### `studentGroups`
Represents a sub-group of a corporate customer (e.g., "Advanced English").
```typescript
studentGroups: defineTable({
  workspaceId: v.id("workspaces"),
  customerId: v.id("customers"), // Parent Company
  name: v.string(), // e.g., "Marketing Team"
  defaultTeacherId: v.optional(v.id("users")),
  notes: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_customer", ["customerId"])
```

#### `lessons`
Represents a single class/session.
```typescript
lessons: defineTable({
  workspaceId: v.id("workspaces"),
  teacherId: v.id("users"), // Can be changed for substitution
  customerId: v.id("customers"),
  
  // Target Audience (One of these must be set)
  groupId: v.optional(v.id("studentGroups")), 
  studentId: v.optional(v.id("students")),
  
  title: v.string(),
  start: v.number(), // Timestamp
  end: v.number(),   // Timestamp
  
  type: v.union(
    v.literal("online"),
    v.literal("in_person_office"),
    v.literal("in_person_company")
  ),
  
  status: v.union(
    v.literal("scheduled"),
    v.literal("attended"),
    v.literal("cancelled_on_time"), // Not billable
    v.literal("cancelled_late"),    // Billable
    v.literal("missed")             // Billable? (Policy dependent)
  ),
  
  // Cancellation details
  cancelledAt: v.optional(v.number()),
  cancelledBy: v.optional(v.id("users")),
  cancellationReason: v.optional(v.string()),
  
  // Invoicing
  isBillable: v.boolean(),
  invoiceId: v.optional(v.id("invoices")), // Linked when invoiced
  rate: v.optional(v.number()), // Override default rate if needed
  
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_teacher", ["teacherId", "start"])
.index("by_customer", ["customerId", "start"])
.index("by_status", ["status"])
.index("by_invoice", ["invoiceId"])
```

### Updates to Existing Tables

#### `users`
*   Add `role` field: `admin` | `teacher`.
*   Teachers see only their own calendar.
*   Admins see everything.

#### `customers`
*   Add `defaultTeacherId` (v.id("users")) for individual clients.

## 2. Business Logic & Rules

### Cancellation Policy
*   **Online:** 24 hours notice required.
*   **In-Person (Office/Company):** 48 hours notice required.
*   **Logic:**
    *   If `(LessonStart - Now) < PolicyThreshold`:
        *   Teacher cannot cancel (UI disabled / Backend throws error).
        *   Admin CAN cancel (Override).
        *   If cancelled late, status = `cancelled_late` (Billable).
    *   If `(LessonStart - Now) >= PolicyThreshold`:
        *   Status = `cancelled_on_time` (Not Billable).

### Teacher Workflow
1.  **Login:** Redirect to Calendar.
2.  **Substitution:** Teacher can select a lesson (or series) and "Reassign" to another teacher from a dropdown.
3.  **Lesson Management:** Mark Attended / Cancel.

### Student Notifications
*   **Trigger:** `lessons` creation or update (time change).
*   **Action:** Send email to:
    *   If `studentId` is set: that student's email.
    *   If `groupId` is set: all active students in that group.
*   **Content:** "New Lesson Scheduled: [Title] at [Time] with [Teacher]".

## 3. Invoice Automation

### Trigger
*   **Cron Job:** Runs on the last day of the month (e.g., 23:00).
*   **Manual Trigger:** "Generate Invoices" button for Admin.

### Process
1.  Identify billing period (e.g., 1st to Last day of current month).
2.  Query all `lessons` where:
    *   `status` is `attended` OR `cancelled_late`.
    *   `invoiceId` is NOT set (prevent double billing).
    *   `start` is within billing period.
3.  Group lessons by `customerId`.
4.  For each Customer:
    *   Create `invoices` entry (Draft status).
    *   Create `invoiceItems` for each lesson (or grouped by lesson type).
    *   Update `lessons` with new `invoiceId`.
5.  Notify Admin (Email/Notification) that drafts are ready for review.

## 4. UI Implementation Plan

### Calendar Module (`src/apps/calendar`)
*   **Views:**
    *   `TeacherCalendar`: Only shows `my` lessons.
    *   `AdminCalendar`: Dropdown to select Teacher/Customer/All.
*   **Components:**
    *   `LessonModal`: Create/Edit lesson details, assign Teacher/Group/Student.
    *   `LessonStatusControl`: Buttons for "Attended", "Cancel" (with policy check).
    *   `ReassignModal`: For substitution.

### Student Management
*   **Student List:** CRUD for students, linked to Customers/Groups.

### Invoice Module (`src/apps/invoices`)
*   **Automation Settings:** Configure "Auto-generate on last day" option.
*   **Review Queue:** "Pending Lessons" view to see what will be invoiced.

## 5. Implementation Steps

1.  **Schema Update:** Add `lessons`, `students`, `studentGroups` tables. Update `users`.
2.  **Backend Logic:**
    *   Create `convex/lessons.ts` (CRUD, Status changes, Policy checks, Email trigger).
    *   Create `convex/students.ts` (CRUD).
    *   Create `convex/groups.ts` (CRUD).
    *   Update `convex/invoices.ts` to implement `generateMonthlyInvoices`.
3.  **Frontend - Admin:**
    *   Add Student & Group management to Customer details.
    *   Update Calendar to support "Lesson" events.
4.  **Frontend - Teacher:**
    *   Create restricted view logic.
    *   Implement "Mark Attended" / "Cancel" / "Reassign" flows.
5.  **Automation:**
    *   Set up Convex Cron for end-of-month.
    *   Implement Email sending (using `convex/email.ts` or similar).
