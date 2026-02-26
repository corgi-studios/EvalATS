import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Keep a single source of truth for the allowed candidate statuses
 * (must match schema.ts).
 */
const candidateStatus = v.union(
  v.literal("applied"),
  v.literal("screening"),
  v.literal("interview"),
  v.literal("offer"),
  v.literal("rejected"),
  v.literal("withdrawn")
);

type CandidateStatus = typeof candidateStatus.type;

function today() {
  return new Date().toISOString().split("T")[0];
}

// Get all candidates
export const list = query({
  args: {
    status: v.optional(v.union(v.literal("all"), candidateStatus)),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ Narrow to real status values only
    const status = args.status;

    const candidates =
      status && status !== "all"
        ? await ctx.db
            .query("candidates")
            .withIndex("by_status", (q) => q.eq("status", status as CandidateStatus))
            .collect()
        : await ctx.db.query("candidates").collect();

    if (!args.search) return candidates;

    const search = args.search.toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.position.toLowerCase().includes(search)
    );
  },
});

// Get single candidate with full details
export const get = query({
  args: { id: v.id("candidates") },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id);
    if (!candidate) return null;

    const [timeline, assessments, notes, interviews] = await Promise.all([
      ctx.db
        .query("timeline")
        .withIndex("by_candidate", (q) => q.eq("candidateId", args.id))
        .collect(),
      ctx.db
        .query("assessments")
        .withIndex("by_candidate", (q) => q.eq("candidateId", args.id))
        .collect(),
      ctx.db
        .query("notes")
        .withIndex("by_candidate", (q) => q.eq("candidateId", args.id))
        .collect(),
      ctx.db
        .query("interviews")
        .withIndex("by_candidate", (q) => q.eq("candidateId", args.id))
        .collect(),
    ]);

    return {
      ...candidate,
      timeline,
      assessments,
      notes,
      interviews,
    };
  },
});

// Create new candidate
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    position: v.string(),
    experience: v.string(),
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const candidateId = await ctx.db.insert("candidates", {
      ...args,
      appliedDate: today(),
      status: "applied",
      evaluation: {
        overall: 0,
        technical: 0,
        cultural: 0,
        communication: 0,
      },
    });

    await ctx.db.insert("timeline", {
      candidateId,
      date: today(),
      type: "applied",
      title: "Application Received",
      description: `Applied for ${args.position} position`,
      status: "completed",
    });

    return candidateId;
  },
});

// Update candidate status
export const updateStatus = mutation({
  args: {
    id: v.id("candidates"),
    status: candidateStatus,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });

    await ctx.db.insert("timeline", {
      candidateId: args.id,
      date: today(),
      type: args.status, // ✅ already a valid union type
      title: `Status changed to ${args.status}`,
      description: `Candidate moved to ${args.status} stage`,
      status: "completed",
    });
  },
});

// Update candidate evaluation
export const updateEvaluation = mutation({
  args: {
    id: v.id("candidates"),
    evaluation: v.object({
      overall: v.number(),
      technical: v.number(),
      cultural: v.number(),
      communication: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { evaluation: args.evaluation });
  },
});

// Add note to candidate
export const addNote = mutation({
  args: {
    candidateId: v.id("candidates"),
    author: v.string(),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notes", {
      ...args,
      date: today(),
    });
  },
});

// Submit application as a logged-in candidate
export const submitApplication = mutation({
  args: {
    jobId: v.id("jobs"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    experience: v.string(),
    skills: v.array(v.string()),
    linkedin: v.optional(v.string()),
    github: v.optional(v.string()),
    portfolio: v.optional(v.string()),
    education: v.optional(v.string()),
    currentCompany: v.optional(v.string()),
    resumeStorageId: v.optional(v.id("_storage")),
    resumeFilename: v.optional(v.string()),
    coverLetterStorageId: v.optional(v.id("_storage")),
    coverLetterFilename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify job exists and is active
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status !== "active") {
      throw new Error("Job not found or not accepting applications");
    }

    // Create or find candidate by email
    let candidateId: any;
    let existingCandidate = await ctx.db
      .query("candidates")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!existingCandidate) {
      // Create new candidate
      candidateId = await ctx.db.insert("candidates", {
        name: args.name,
        email: args.email,
        phone: args.phone,
        location: args.location,
        position: job.title,
        experience: args.experience,
        skills: args.skills,
        linkedin: args.linkedin,
        github: args.github,
        portfolio: args.portfolio,
        education: args.education,
        currentCompany: args.currentCompany,
        resumeUrl: args.resumeStorageId,
        resumeFilename: args.resumeFilename,
        coverLetter: args.coverLetterStorageId,
        coverLetterFilename: args.coverLetterFilename,
        appliedDate: today(),
        status: "applied",
        evaluation: {
          overall: 0,
          technical: 0,
          cultural: 0,
          communication: 0,
        },
      });
    } else {
      // Update existing candidate's fields if needed
      candidateId = existingCandidate._id;
      await ctx.db.patch(existingCandidate._id, {
        resumeUrl: args.resumeStorageId || existingCandidate.resumeUrl,
        resumeFilename: args.resumeFilename || existingCandidate.resumeFilename,
        coverLetter: args.coverLetterStorageId || existingCandidate.coverLetter,
        coverLetterFilename: args.coverLetterFilename || existingCandidate.coverLetterFilename,
      });
    }

    // Create application record
    const applicationId = await ctx.db.insert("applications", {
      candidateId: candidateId,
      jobId: args.jobId,
      appliedDate: today(),
      status: "pending",
    });

    // Add timeline entry
    await ctx.db.insert("timeline", {
      candidateId: candidateId,
      date: today(),
      type: "applied",
      title: `Applied for ${job.title}`,
      description: `Application submitted for ${job.title} position`,
      status: "completed",
    });

    return {
      candidateId,
      applicationId,
      success: true,
    };
  },
});