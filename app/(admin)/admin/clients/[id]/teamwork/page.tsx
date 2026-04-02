import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamworkConfigForm } from "@/components/admin/TeamworkConfigForm";
import { isTeamworkConfigured } from "@/lib/teamwork";
import { fetchProject, fetchTasks, fetchTimeEntries } from "@/lib/teamwork";
import { AlertCircle, CheckCircle2, Clock, ListChecks } from "lucide-react";

export default async function ClientTeamworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { teamworkConfig: true },
  });
  if (!client) notFound();

  const config = client.teamworkConfig;
  const apiConfigured = isTeamworkConfigured();

  // Fetch live preview if configured and enabled
  let project = null;
  let tasks: Awaited<ReturnType<typeof fetchTasks>> = [];
  let timeEntries: Awaited<ReturnType<typeof fetchTimeEntries>> = [];
  let fetchError: string | null = null;

  if (apiConfigured && config?.enabled && config.projectId && config.domain) {
    try {
      [project, tasks, timeEntries] = await Promise.all([
        fetchProject(config.domain, config.projectId),
        fetchTasks(config.domain, config.projectId),
        fetchTimeEntries(config.domain, config.projectId),
      ]);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : "Failed to fetch Teamwork data.";
    }
  }

  const totalMinutes = timeEntries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* API key warning */}
      {!apiConfigured && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>TEAMWORK_API_KEY</strong> is not set in your environment variables. Add it to{" "}
            <code className="font-mono text-xs bg-amber-100 px-1 rounded">.env.local</code> to
            enable live data fetching.
          </p>
        </div>
      )}

      {/* Configuration card */}
      <Card className="border-[#e2e0d9]">
        <CardHeader className="pb-3">
          <CardTitle>Teamwork Configuration</CardTitle>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Connect a Teamwork project to this client's portal.
          </p>
        </CardHeader>
        <CardContent>
          <TeamworkConfigForm
            clientId={id}
            config={
              config
                ? { enabled: config.enabled, projectId: config.projectId, domain: config.domain }
                : null
            }
          />
        </CardContent>
      </Card>

      {/* Live preview */}
      {config?.enabled && (
        <>
          {fetchError ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[#ff6b6c]">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{fetchError}</p>
            </div>
          ) : project ? (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-[#e2e0d9]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">Progress</p>
                        <p className="text-2xl font-semibold text-[#464540] font-heading">{project.percentComplete}%</p>
                        <p className="text-xs text-[#8a8880] mt-1">
                          {project.completedTaskCount} of {project.totalTaskCount} tasks
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#e2e0d9]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">Open Tasks</p>
                        <p className="text-2xl font-semibold text-[#464540] font-heading">{tasks.length}</p>
                        <p className="text-xs text-[#8a8880] mt-1">Incomplete</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <ListChecks className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#e2e0d9]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">Recent Hours</p>
                        <p className="text-2xl font-semibold text-[#464540] font-heading">{totalHours}h</p>
                        <p className="text-xs text-[#8a8880] mt-1">Last {timeEntries.length} entries</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tasks preview */}
              {tasks.length > 0 && (
                <Card className="border-[#e2e0d9]">
                  <CardHeader className="pb-3">
                    <CardTitle>Upcoming Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-[#f0efe9]">
                      {tasks.slice(0, 8).map((task) => (
                        <div key={task.id} className="py-2.5 flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              task.priority === "urgent"
                                ? "bg-[#ff6b6c]"
                                : task.priority === "high"
                                ? "bg-amber-500"
                                : task.priority === "medium"
                                ? "bg-blue-400"
                                : "bg-[#e2e0d9]"
                            }`}
                          />
                          <span className="text-sm text-[#464540] flex-1 min-w-0 truncate">
                            {task.name}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-[#8a8880] flex-shrink-0">
                              Due {task.dueDate}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
