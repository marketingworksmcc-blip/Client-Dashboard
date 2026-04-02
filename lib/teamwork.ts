/**
 * Server-only Teamwork API client (v1).
 *
 * Required environment variable:
 *   TEAMWORK_API_KEY  — Personal Access Token (starts with twp_)
 *
 * Per-client config (stored in TeamworkConfig):
 *   domain    — e.g. "yourcompany.teamwork.com"
 *   projectId — Teamwork project ID
 *
 * Auth: HTTP Basic with token as username, "x" as password.
 * v1 base URL: https://{domain}/
 */

// ── Types ──────────────────────────────────────────────────────

export interface TWProject {
  id: string;
  name: string;
  description: string;
  status: string;
  completedTaskCount: number;
  totalTaskCount: number;
  percentComplete: number;
  startDate: string | null;
  endDate: string | null;
}

export interface TWTaskList {
  id: string;
  name: string;
  totalCount: number;
  completedCount: number;
  percentComplete: number;
  isComplete: boolean;
}

export interface TWTask {
  id: string;
  name: string;
  dueDate: string | null; // "YYYYMMDD"
  priority: string;       // "none" | "low" | "medium" | "high" | "urgent"
  assigneeNames: string;  // comma-separated
  completed: boolean;
}

export interface TWTimeEntry {
  id: string;
  description: string;
  hours: number;
  minutes: number;
  date: string; // "YYYYMMDD"
  personName: string;
}

// ── Internal helpers ───────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.TEAMWORK_API_KEY;
  if (!key) throw new Error("TEAMWORK_API_KEY is not set in environment variables.");
  return key;
}

async function twFetch<T>(domain: string, path: string): Promise<T> {
  const apiKey = getApiKey();
  const url = `https://${domain}${path}`;
  const credentials = Buffer.from(`${apiKey}:x`).toString("base64");

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
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
  const completed = Number(p["completed-count"] ?? p["completedCount"] ?? 0);
  const active    = Number(p["tasks-count"]    ?? p["tasksCount"]    ?? 0);
  const total     = completed + active;

  return {
    id: String(p.id ?? ""),
    name: String(p.name ?? ""),
    description: String(p.description ?? ""),
    status: String(p.status ?? "active"),
    completedTaskCount: completed,
    totalTaskCount: total,
    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    startDate: (p["start-date"] as string) ?? (p.startDate as string) ?? null,
    endDate:   (p["end-date"]   as string) ?? (p.endDate   as string) ?? null,
  };
}

/** Fetch task lists for a project with accurate completion counts.
 *  Fetches each task list's tasks individually — the per-list endpoint
 *  returns all tasks (complete + incomplete) by default in the v1 API. */
export async function fetchTaskLists(domain: string, projectId: string): Promise<TWTaskList[]> {
  const listsData = await twFetch<{ tasklists?: Record<string, unknown>[] }>(
    domain,
    `/projects/${projectId}/tasklists.json`
  );

  const lists = listsData.tasklists ?? [];

  // Fetch all tasks for every task list in parallel
  const taskCounts = await Promise.all(
    lists.map(async (tl) => {
      const id = String(tl.id ?? "");
      const data = await twFetch<{ "todo-items"?: Record<string, unknown>[] }>(
        domain,
        `/tasklists/${id}/tasks.json?includeCompletedTasks=true`
      );
      const items     = data["todo-items"] ?? [];
      const total     = items.length;
      const completed = items.filter((t) => Boolean(t.completed)).length;
      return { id, total, completed };
    })
  );

  const countById = Object.fromEntries(taskCounts.map((c) => [c.id, c]));

  return lists.map((tl) => {
    const id         = String(tl.id ?? "");
    const c          = countById[id] ?? { total: 0, completed: 0 };
    const isComplete = Boolean(tl.complete);
    const pct        = c.total > 0
      ? Math.round((c.completed / c.total) * 100)
      : isComplete ? 100 : 0;

    return {
      id,
      name: String(tl.name ?? ""),
      totalCount: c.total,
      completedCount: c.completed,
      percentComplete: pct,
      isComplete,
    };
  });
}

/** Fetch incomplete tasks for a project (up to 50). */
export async function fetchTasks(domain: string, projectId: string): Promise<TWTask[]> {
  const data = await twFetch<{ "todo-items"?: Record<string, unknown>[] }>(
    domain,
    `/projects/${projectId}/tasks.json?status=incomplete`
  );

  return (data["todo-items"] ?? []).map((t) => ({
    id: String(t.id ?? ""),
    name: String(t.content ?? t.name ?? ""),
    dueDate: (t["due-date"] as string) || (t.dueDate as string) || null,
    priority: String(t.priority ?? "none"),
    assigneeNames: String(t["responsible-party-names"] ?? t.assigneeNames ?? ""),
    completed: t.completed === true || t.completed === "1",
  }));
}

/** Fetch recent time entries for a project (up to 25). */
export async function fetchTimeEntries(domain: string, projectId: string): Promise<TWTimeEntry[]> {
  const data = await twFetch<{ "time-entries"?: Record<string, unknown>[] }>(
    domain,
    `/projects/${projectId}/time_entries.json`
  );

  return (data["time-entries"] ?? []).map((t) => ({
    id: String(t.id ?? ""),
    description: String(t.description ?? ""),
    hours: Number(t.hours ?? 0),
    minutes: Number(t.minutes ?? 0),
    date: String(t.date ?? ""),
    personName: [t["person-first-name"], t["person-last-name"]].filter(Boolean).join(" ") ||
                String(t.personName ?? ""),
  }));
}

/** Confirm the API key env var is present. */
export function isTeamworkConfigured(): boolean {
  return Boolean(process.env.TEAMWORK_API_KEY);
}
