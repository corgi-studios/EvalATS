"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

function formatSalaryRange(salaryMin?: number | null, salaryMax?: number | null) {
  const min = typeof salaryMin === "number" ? salaryMin : null;
  const max = typeof salaryMax === "number" ? salaryMax : null;
  if (min == null && max == null) return null;

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export default function CareerJobPage() {
  const params = useParams();

  // Convex Ids are strings at runtime; cast to Id<"jobs"> for type safety
  const id = params?.id as string;
  const jobId = id as Id<"jobs">;

  const job = useQuery(api.jobs.getPublicById, { id: jobId });

  if (job === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        Loading job…
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center px-6">
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            Job not found
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            This position may have been closed or removed.
          </p>
          <Link
            href="/careers"
            className="inline-block mt-4 text-blue-600 dark:text-blue-400"
          >
            ← Back to openings
          </Link>
        </div>
      </div>
    );
  }

  const salary = formatSalaryRange(job.salaryMin, job.salaryMax);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/careers" className="text-sm text-blue-600 dark:text-blue-400">
          ← Back to openings
        </Link>

        <h1 className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">
          {job.title}
        </h1>

        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          {job.department} • {job.location} • {job.type}
          {job.postedDate ? ` • Posted ${job.postedDate}` : ""}
        </div>

        {salary && (
          <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {salary}
          </div>
        )}

        {job.urgency === "high" && (
          <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            Urgent
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Description
          </h2>
          <p className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {Array.isArray(job.requirements) && job.requirements.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Requirements
            </h2>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-gray-800 dark:text-gray-200">
              {job.requirements.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Apply
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Application form goes here. Next step: wire this to an application submission mutation.
          </p>

          <button className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Start Application
          </button>
        </div>
      </div>
    </div>
  );
}