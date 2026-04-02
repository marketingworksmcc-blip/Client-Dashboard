/**
 * Server-only Teamwork API client (v3).
 *
 * Required environment variable:
 *   TEAMWORK_API_KEY  — Personal Access Token (starts with twp_)
 *
 * Per-client config (stored in TeamworkConfig):
 *   domain    — e.g. "yourcompany.teamwork.com"
 *   projectId — Teamwork project ID
 */

// ── Types ──────────────────────────────────────────────────────

export interface TWProject {
  id: string;
  name: string;
  description: string;
  status: string; // "active" | "completed" | "on-hold" etc.
  completedTaskCount: number;
  totalTaskCount: number;
  percentComplete: number;
  startDate: string | null;
  endDate: string | null;
}

export interface TWTask {
  id: string;
  name: string;
  status: string; // "new" | "completed" | "reopened"
  dueDate: string | null;
  priority: string; // "none" | "low" | "medium" | "high" | "urgent"
  assignees: { id: string; firstName: string; lastName: string }[];
  completed: boolean;
}

export interface TWTimeEntry {
  id: string;
  description: string;
  hours: number;
  minutes: number;
  date: string; // YYYYMMDD
  person: { id: string; firstName: string; lastName: string };
}

// ── Internal helpers ───────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.TEAMWORK_API_KEY;
  if (!key) throw new Error("TEAMWORK_API_KEY is not set in environment variables.");
  return key;
}

async function twFetch<T>(domain: string, path: string): Promise<T> {
  const apiKey = getApiKey();
  const url = `https://${domain}/projects/api/v3${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 }, // cache 5 minutes
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Teamwork API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Public API functions ───────────────────────────────────────

/** Fetch project details. */
export async function fetchProject(domain: string, projectId: string): Promise<TWProject> {
  const data = await twFetch<{ project: Record<string, unknown> }>(
    domain,
    `/projects/${projectId}.json`
  );

  const p = data.project;
  const completed = Number(p.tasksCompleted ?? p.numCompletedTasks ?? 0);
  const total = Number(p.tasksCount ?? p.numActiveTasks ?? 0) + completed;

  return {
    id: String(p.id),
    name: String(p.name ?? ""),
    description: String(p.description ?? ""),
    status: String(p.status ?? "active"),
    completedTaskCount: completed,
    totalTaskCount: total,
    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    startDate: (p.startDate as string) ?? null,
    endDate: (p.endDate as string) ?? null,
  };
}

/** Fetch incomplete tasks for a project (up to 50). */
export async function fetchTasks(domain: string, projectId: string): Promise<TWTask[]> {
  const data = await twFetch<{ tasks?: Record<string, unknown>[] }>(
    domain,
    `/projects/${projectId}/tasks.json?status=incomplete&page[size]=50&orderBy=dueDate&orderMode=asc`
  );

  return (data.tasks ?? []).map((t) => ({
    id: String(t.id),
    name: String(t.name ?? ""),
    status: String(t.status ?? "new"),
    dueDate: (t.dueDate as string) ?? null,
    priority: String(t.priority ?? "none"),
    assignees: ((t.assignees as Record<string, unknown>[]) ?? []).map((a) => ({
      id: String(a.id),
      firstName: String(a.firstName ?? ""),
      lastName: String(a.lastName ?? ""),
    })),
    completed: Boolean(t.completed),
  }));
}

/** Fetch recent time entries for a project (up to 25). */
export async function fetchTimeEntries(domain: string, projectId: string): Promise<TWTimeEntry[]> {
  const data = await twFetch<{ timeEntries?: Record<string, unknown>[] }>(
    domain,
    `/projects/${projectId}/time.json?page[size]=25&orderBy=date&orderMode=desc`
  );

  return (data.timeEntries ?? []).map((t) => ({
    id: String(t.id),
    description: String(t.description ?? ""),
    hours: Number(t.hours ?? 0),
    minutes: Number(t.minutes ?? 0),
    date: String(t.date ?? ""),
    person: {
      id: String((t.person as Record<string, unknown>)?.id ?? ""),
      firstName: String((t.person as Record<string, unknown>)?.firstName ?? ""),
      lastName: String((t.person as Record<string, unknown>)?.lastName ?? ""),
    },
  }));
}

/** Confirm the API key env var is present. */
export function isTeamworkConfigured(): boolean {
  return Boolean(process.env.TEAMWORK_API_KEY);
}
