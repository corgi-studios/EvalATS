import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Admin: list jobs (with applicant counts)
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use index when filtering by status (optional optimization)
    let jobs =
      args.status && args.status !== "all"
        ? await ctx.db
            .query("jobs")
            .withIndex("by_status", (q) => q.eq("status", args.status as any))
            .collect()
        : await ctx.db.query("jobs").collect();

    if (args.search && args.search.trim().length > 0) {
      const search = args.search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search) ||
          j.department.toLowerCase().includes(search)
      );
    }

    // Applicant count for each job (uses applications.by_job index)
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const apps = await ctx.db
          .query("applications")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .collect();
        return { ...job, applicantCount: apps.length };
      })
    );

    return jobsWithCounts;
  },
});

/**
 * Admin: get single job with its applicants
 */
export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return null;

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_job", (q) => q.eq("jobId", args.id))
      .collect();

    const applicants = await Promise.all(
      applications.map(async (app) => {
        const candidate = await ctx.db.get(app.candidateId);
        return {
          ...candidate,
          applicationId: app._id,
          applicationStatus: app.status,
          appliedDate: app.appliedDate,
        };
      })
    );

    return { ...job, applicants };
  },
});

/**
 * Public: list active jobs only (NO sign-in required)
 * This is what /careers should call.
 */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

/**
 * Public: get active job by id only (NO sign-in required)
 */
export const getPublicById = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return null;
    if (job.status !== "active") return null;
    return job;
  },
});

/** Basic slugify helper */
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Admin: create new job
 */
export const create = mutation({
  args: {
    title: v.string(),
    department: v.string(),
    location: v.string(),
    type: v.union(v.literal("full-time"), v.literal("part-time"), v.literal("contract")),
    description: v.string(),
    requirements: v.array(v.string()),
    urgency: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),

    // NEW:
    isPublic: v.boolean(),
    // Optional in schema? keep optional here too:
    benefits: v.optional(v.array(v.string())),
    // Optional override (otherwise auto-generated)
    slug: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const postedDate = new Date().toISOString().split("T")[0];

    const baseSlug = slugify(args.slug ?? args.title);
    // Make slug unique by suffixing a short random chunk if needed
    let slug = baseSlug;
    const existing = await ctx.db
      .query("jobs")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const jobId = await ctx.db.insert("jobs", {
      title: args.title,
      department: args.department,
      location: args.location,
      type: args.type,
      description: args.description,
      requirements: args.requirements,
      urgency: args.urgency,
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,

      // NEW REQUIRED FIELDS:
      slug,
      isPublic: args.isPublic,

      // optional
      benefits: args.benefits,

      postedDate,
      status: "active", // must match schema union
    });

    return jobId;
  },
});

/**
 * Admin: update job status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("jobs"),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});