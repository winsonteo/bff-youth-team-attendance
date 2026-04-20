# BFF Youth Attendance

Small Next.js + Convex app for coaches to take attendance by class.

## Features in v1
- Coach PIN login
- 4 class dashboard
- Fixed roster per class
- Students can belong to multiple classes
- Present / Absent attendance per class per day
- Edit same-day attendance

## Stack
- Next.js 14
- Convex

## Setup

### 1. Install deps
```bash
cd /home/winsont/openclaw-workspaces/rogers/bff-youth-attendance
npm install
```

### 2. Start Convex
```bash
npx convex dev
```

Copy the deployment URL into `.env.local`:
```bash
NEXT_PUBLIC_CONVEX_URL=...
```

### 3. Seed demo data
In the Convex dashboard or via generated functions, run:
- `seed:seedDemo`

Demo coach PINs:
- `1234` → Winson
- `2456` → Esther

### 4. Start app
```bash
npm run dev
```

## Data model
- `coaches`
- `classes`
- `students`
- `studentClasses`
- `attendanceSessions`
- `attendanceRecords`

## Notes
- Attendance is per class session per day.
- A student can be enrolled in multiple classes.
- Current v1 keeps PINs plain in Convex for speed. Before production, hash them.
