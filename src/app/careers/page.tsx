"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Clock,
  Heart,
  MapPin,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function formatSalaryRange(salaryMin?: number | null, salaryMax?: number | null) {
  const min = typeof salaryMin === "number" ? salaryMin : null;
  const max = typeof salaryMax === "number" ? salaryMax : null;

  if (min == null && max == null) return null;

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export default function CareersPage() {
  const jobs = useQuery(api.jobs.listPublic);

  // Local UI state for filtering
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [location, setLocation] = useState("All Locations");
  const [type, setType] = useState("All Types");

  const allJobs = jobs ?? [];

  // Build dropdown options from real data
  const departments = useMemo(() => {
    const uniq = Array.from(
      new Set(allJobs.map((j) => j.department).filter(Boolean))
    ).sort();
    return ["All", ...uniq];
  }, [allJobs]);

  const locations = useMemo(() => {
    const uniq = Array.from(
      new Set(allJobs.map((j) => j.location).filter(Boolean))
    ).sort();
    return ["All Locations", ...uniq];
  }, [allJobs]);

  const types = useMemo(() => {
    const uniq = Array.from(
      new Set(allJobs.map((j) => j.type).filter(Boolean))
    ).sort();
    return ["All Types", ...uniq];
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    const s = search.trim().toLowerCase();

    return allJobs.filter((job) => {
      const matchesSearch =
        !s ||
        job.title.toLowerCase().includes(s) ||
        job.department.toLowerCase().includes(s) ||
        job.location.toLowerCase().includes(s);

      const matchesDept = department === "All" || job.department === department;
      const matchesLoc =
        location === "All Locations" || job.location === location;
      const matchesType = type === "All Types" || job.type === type;

      return matchesSearch && matchesDept && matchesLoc && matchesType;
    });
  }, [allJobs, search, department, location, type]);

  // Loading state
  if (jobs === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        Loading openings…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
              Open Positions
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Find your next career opportunity with us
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mt-10 bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search positions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Cards */}
          <div className="mt-8 space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-300 py-10">
                No matching positions found.
              </div>
            ) : (
              filteredJobs.map((job) => {
                const salary = formatSalaryRange(job.salaryMin, job.salaryMax);
                return (
                  <Link
                    key={job._id}
                    href={`/careers/${job._id}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                              {job.title}
                            </h3>

                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.department}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {job.type}
                              </span>
                              {job.postedDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Posted {job.postedDate}
                                </span>
                              )}
                            </div>
                          </div>

                          {job.urgency === "high" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              Urgent
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-gray-600 dark:text-gray-400 line-clamp-2">
                          {job.description}
                        </p>

                        {salary && (
                          <div className="flex items-center gap-4 mt-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {salary}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 sm:mt-0 sm:ml-6">
                        <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                          Apply Now
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* The rest of your sections can stay as-is */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Team Members
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Build with a small, dedicated team.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Growth
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Learn fast and own meaningful work.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Culture
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Respectful, remote-friendly collaboration.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Open Roles
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Join us when there’s a match.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}