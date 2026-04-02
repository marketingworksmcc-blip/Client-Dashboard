import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamworkProjectCard } from "@/components/teamwork/TeamworkProjectCard";
import { TeamworkTaskList } from "@/components/teamwork/TeamworkTaskList";
import { TeamworkTimeCard } from "@/components/teamwork/TeamworkTimeCard";
import { fetchProject, fetchTasks, fetchTimeEntries } from "@/lib/teamwork";
import { AlertCircle } from "lucide-react";

export default async function ClientTeamworkPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0] ?? null;
  if (!clientId) notFound();

  const config = await prisma.teamworkConfig.findUnique({ where: { clientId } });

  if (!config?.enabled) notFound();

  let project = null;
  let tasks: Awaited<ReturnType<typeof fetchTasks>> = [];
  let timeEntries: Awaited<ReturnType<typeof fetchTimeEntries>> = [];
  let fetchError: string | null = null;

  try {
    [project, tasks, timeEntries] = await Promise.all([
      fetchProject(config.domain, config.projectId),
      fetchTasks(config.domain, config.projectId),
      fetchTimeEntries(config.domain, config.projectId),
    ]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Could not load project data.";
  }

  return (
    <div>
      <PageHeader
        title="Project Overview"
        subtitle="Live status pulled from Teamwork."
      />

      {fetchError ? (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[#ff6b6c]">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>Unable to load project data right now. Please try again later.</p>
        </div>
      ) : project ? (
        <div className="space-y-6">
          {/* Project status */}
          <TeamworkProjectCard project={project} />

          {/* Tasks + time side by side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamworkTaskList tasks={tasks} />
            <TeamworkTimeCard entries={timeEntries} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
