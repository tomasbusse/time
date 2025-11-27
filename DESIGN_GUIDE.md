# Design Guide: Time App

This guide provides step-by-step instructions for generating and implementing the Time app UI using the Magic Web Design MCP server.

## Design Philosophy

**Aesthetic**: Calm, minimal, productivity-focused  
**Color Palette**: Soft neutrals with subtle accent colors  
**Typography**: Clean, readable fonts with clear hierarchy  
**Layout**: Spacious, breathing room between elements  

### Reference Design

See `/designs/iloveimg-converted/time.jpg` for the visual reference showing:
- Welcome section with clock widget
- "Today's Focus" task list with radio buttons
- Module cards grid (Ideas, Time, Finance, Flow, Food, Calendar)
- Clean, minimal aesthetic with soft colors

## Design System

### Colors

```css
Primary Background: #F5F5F4 (neutral-100 to neutral-200 gradient)
Card Background: #FFFFFF (white)
Text Primary: #292524 (neutral-800)
Text Secondary: #78716C (neutral-600)
Border: #E7E5E4 (neutral-200)
Active Timer Background: #B6B2B5 (gray)

Module Colors:
- Ideas: #D1FAE5 (green-100) with #047857 (green-700)
- Time: #DBEAFE (blue-100) with #1D4ED8 (blue-700)
- Finance: #EDE9FE (purple-100) with #7C3AED (purple-700)
- Flow: #FEF3C7 (amber-100) with #D97706 (amber-700)
- Food: #FEE2E2 (red-100) with #DC2626 (red-700)
- Calendar: #E0E7FF (indigo-100) with #4F46E5 (indigo-700)
```

### Typography

- **Headings**: 2xl-5xl, font-bold
- **Body**: base, text-neutral-600/700
- **Small text**: sm, text-neutral-500

### Spacing

- **Card padding**: 6 (24px)
- **Grid gap**: 6 (24px)
- **Section spacing**: 8-12 (32-48px)

## Time App Components to Generate

### Step 1: Time Allocation Card Component

**Magic Web Design Prompt:**

```
Create a React TypeScript component for a time allocation card.

Design specifications:
- White background with shadow-md and rounded-lg borders
- Displays task name as a heading (text-lg, font-semibold)
- Shows allocated time duration (e.g., "2 hours") in neutral-600
- Progress bar showing time spent vs allocated (blue accent)
- "Start Timer" button in blue-600 with hover effect
- Clean, minimal aesthetic matching the reference design

Component should accept props:
- taskName: string
- allocatedDuration: number (in minutes)
- timeSpent: number (in minutes)
- onStartTimer: () => void

Use Tailwind CSS for styling.
Generate both the component code and usage example.
```

**Expected Output Location**: `src/apps/time/components/TimeAllocationCard.tsx`

**Integration Steps**:
1. Save generated component to the file path above
2. Import into `src/apps/time/TimeApp.tsx`
3. Test with sample data

---

### Step 2: Real-Time Timer Component

**Magic Web Design Prompt:**

```
Create a React TypeScript real-time timer component with countdown and elapsed time display.

Design specifications:
- Large circular timer display (similar to clock design in reference)
- Shows elapsed time in MM:SS format
- Countdown display showing time remaining
- Play/Pause button (toggle between states)
- Stop button (stops and prompts to log time)
- Alarm notification when countdown reaches zero
- Soft blue accent colors (#DBEAFE background, #1D4ED8 text)
- Minimal, clean design with ample spacing

Component should:
- Accept allocatedDuration in minutes
- Track elapsed time in real-time
- Trigger alarm on completion
- Provide callbacks: onPause, onStop, onComplete

Use Tailwind CSS and lucide-react icons.
Include session-based state (no persistence until "Log Time" is clicked).
```

**Expected Output Location**: `src/apps/time/components/TimerWidget.tsx`

**Integration Steps**:
1. Save component to file path above
2. Add timer state management
3. Integrate alarm sound/notification
4. Connect "Log Time" button to Convex mutation

---

### Step 3: Weekly Time Overview Component

**Magic Web Design Prompt:**

```
Create a React TypeScript weekly time overview component showing time allocations across the week.

Design specifications:
- Table or grid layout showing Mon-Sun
- Each day shows allocated time blocks
- Color-coded by task category
- Displays total hours per day
- Minimal, calendar-style design
- Neutral colors with soft accents
- Responsive: stacks vertically on mobile

Component should accept:
- weekAllocations: array of { date, taskName, duration, category }
- onDayClick: (date: string) => void

Use Tailwind CSS for styling.
```

**Expected Output Location**: `src/apps/time/components/WeeklyOverview.tsx`

**Integration Steps**:
1. Save component to file path
2. Connect to Convex query for weekly data
3. Add date navigation (prev/next week)
4. Integrate click handler to drill into daily view

---

### Step 4: Task Selector Component

**Magic Web Design Prompt:**

```
Create a React TypeScript task selector component for choosing tasks to allocate time.

Design specifications:
- Dropdown or modal interface
- Displays list of available tasks from Flow module
- Search/filter functionality
- Shows task name and category
- "Add Time Allocation" button
- Clean, minimal design with white background
- Soft shadows and rounded corners

Component should accept:
- tasks: array of { id, name, category }
- onSelectTask: (taskId: string, taskName: string) => void
- onClose: () => void

Use Tailwind CSS and lucide-react icons (Search, Plus).
```

**Expected Output Location**: `src/apps/time/components/TaskSelector.tsx`

**Integration Steps**:
1. Save component to file path
2. Connect to Flow module tasks query
3. Add to Time allocation creation flow
4. Handle task selection and duration input

---

### Step 5: Time Log History Component

**Magic Web Design Prompt:**

```
Create a React TypeScript time log history component showing logged time entries.

Design specifications:
- List view with each entry as a card
- Displays: task name, date, time spent, session duration
- Filter by date range
- Soft neutral colors with subtle borders
- "View Details" button for each entry
- Minimal, clean aesthetic

Component should accept:
- loggedEntries: array of { taskName, date, elapsedTime, sessionStart, sessionEnd }
- onViewDetails: (logId: string) => void

Use Tailwind CSS for styling.
Include date-fns for date formatting.
```

**Expected Output Location**: `src/apps/time/components/TimeLogHistory.tsx`

**Integration Steps**:
1. Save component to file path
2. Connect to Convex timeLogged query
3. Add pagination for large datasets
4. Integrate date range filter

---

## Time App Layout Structure

### Main Time App Page

**File**: `src/apps/time/TimeApp.tsx`

**Layout**:
```
┌─────────────────────────────────────┐
│  Header: "Time" + Back Button       │
├─────────────────────────────────────┤
│  Tabs: Daily | Weekly | History     │
├─────────────────────────────────────┤
│                                     │
│  [Active Tab Content]               │
│                                     │
│  Daily: Time Allocations + Timer    │
│  Weekly: Week Overview              │
│  History: Time Log Entries          │
│                                     │
└─────────────────────────────────────┘
```

**Tab 1: Daily View**
- Date selector (prev/next day)
- List of time allocations for selected date
- "Add Allocation" button → TaskSelector
- Active timer (if running)

**Tab 2: Weekly View**
- Week selector (prev/next week)
- WeeklyOverview component
- Summary stats (total hours allocated, total logged)

**Tab 3: History**
- TimeLogHistory component
- Date range filter
- Export button (future enhancement)

---

## Using Magic Web Design MCP

### Prerequisites

1. Magic Web Design MCP server installed and configured
2. Design reference images in `/designs/` folder
3. Component specifications from this guide

### Step-by-Step Process

#### Step 1: Prepare Component Spec

For each component above:
1. Copy the **Magic Web Design Prompt**
2. Include reference to `/designs/iloveimg-converted/time.jpg`
3. Specify exact file path for output

#### Step 2: Invoke Magic Web Design MCP

Use the MCP tool with the prompt:

```typescript
mcp_21st-dev_magic_21st_magic_component_builder({
  message: "[Copy full prompt from above]",
  searchQuery: "timer component" // 2-4 words describing the component
  absolutePathToCurrentFile: "/Users/tomas/apps/time/src/apps/time/TimeApp.tsx",
  absolutePathToProjectDirectory: "/Users/tomas/apps/time",
  standaloneRequestQuery: "Create a real-time timer widget for time tracking with countdown and alarm"
})
```

#### Step 3: Review Generated Code

The tool returns:
- Component code (TSX)
- Styling (Tailwind CSS)
- Props interface
- Usage example

#### Step 4: Save and Integrate

1. Create the file at specified path
2. Import component into parent
3. Test with sample data
4. Refine styling/behavior as needed

#### Step 5: Connect to Convex

1. Import Convex hooks (`useQuery`, `useMutation`)
2. Connect component to database
3. Add real-time updates

---

## Implementation Checklist

### Phase 1: Core Components
- [ ] TimeAllocationCard component generated
- [ ] TimerWidget component generated
- [ ] TaskSelector component generated
- [ ] All components saved to correct paths
- [ ] Basic styling matches reference design

### Phase 2: Time App Layout
- [ ] TimeApp.tsx layout with tabs
- [ ] Daily view implemented
- [ ] Weekly view implemented
- [ ] History view implemented
- [ ] Navigation between views working

### Phase 3: Convex Integration
- [ ] Time allocations query connected
- [ ] Time logging mutation connected
- [ ] Real-time updates working
- [ ] Timer state persisting correctly

### Phase 4: Advanced Features
- [ ] WeeklyOverview component generated
- [ ] TimeLogHistory component generated
- [ ] Alarm notification on timer completion
- [ ] Export functionality (optional)

---

## Design Refinement

### Using Magic Web Design Refiner

If a component needs refinement:

```typescript
mcp_21st-dev_magic_21st_magic_component_refiner({
  userMessage: "Improve the timer widget to have better visual hierarchy and larger time display",
  absolutePathToRefiningFile: "/Users/tomas/apps/time/src/apps/time/components/TimerWidget.tsx",
  context: "The timer numbers should be more prominent and the controls more intuitive"
})
```

This will return an improved version of the component.

---

## Integration with Other Modules

### Flow Module (Tasks)

Time app needs to:
1. Query available tasks from Flow module
2. Display task names in allocation cards
3. Link time allocations back to tasks

**Convex query**:
```typescript
const tasks = useQuery(api.tasks.listForWorkspace, { workspaceId })
```

### Calendar Module

Optional integration:
- Show calendar events alongside time allocations
- Suggest time slots based on calendar availability

---

## Next Steps

1. **Generate Components**: Use Magic Web Design prompts above to create each component
2. **Build Layout**: Assemble components into TimeApp.tsx tabs
3. **Connect Database**: Link Convex queries/mutations
4. **Test**: Verify timer, logging, and data persistence
5. **Refine**: Use Magic Web Design Refiner for UI improvements

---

## Resources

- Design reference: `/designs/iloveimg-converted/time.jpg`
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/icons
- date-fns: https://date-fns.org/docs
- Convex React: https://docs.convex.dev/client/react
