'use client'

import { useMutation } from 'convex/react'
import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

interface ApplicationFormProps {
  jobId: Id<'jobs'>
  jobTitle: string
  onSuccess?: (candidateId: string) => void
  onCancel?: () => void
}

export function ApplicationForm({ jobId, jobTitle, onSuccess, onCancel }: ApplicationFormProps) {
  const submitApplication = useMutation(api.candidates.submitApplication)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    skills: '',
    linkedin: '',
    github: '',
    portfolio: '',
    education: '',
    currentCompany: '',
  })

  const [files, setFiles] = useState<{
    resume: File | null
    coverLetter: File | null
  }>({
    resume: null,
    coverLetter: null,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'coverLetter') => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles((prev) => ({ ...prev, [type]: file }))
    }
  }

  const uploadFile = async (file: File): Promise<{ storageId: Id<'_storage'>; filename: string } | null> => {
    try {
      const uploadUrl = await generateUploadUrl()

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!response.ok) {
        throw new Error('File upload failed')
      }

      const storageId = (await response.json()) as Id<'_storage'>
      return {
        storageId,
        filename: file.name,
      }
    } catch (err) {
      console.error('File upload error:', err)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.location || !formData.experience) {
        setError('Please fill in all required fields')
        setIsLoading(false)
        return
      }

      // Upload files if present
      let resumeStorageId: Id<'_storage'> | undefined
      let resumeFilename: string | undefined
      let coverLetterStorageId: Id<'_storage'> | undefined
      let coverLetterFilename: string | undefined

      if (files.resume) {
        const uploadedResume = await uploadFile(files.resume)
        if (uploadedResume) {
          resumeStorageId = uploadedResume.storageId
          resumeFilename = uploadedResume.filename
        }
      }

      if (files.coverLetter) {
        const uploadedCoverLetter = await uploadFile(files.coverLetter)
        if (uploadedCoverLetter) {
          coverLetterStorageId = uploadedCoverLetter.storageId
          coverLetterFilename = uploadedCoverLetter.filename
        }
      }

      // Submit application
      const result = await submitApplication({
        jobId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        location: formData.location,
        experience: formData.experience,
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s),
        linkedin: formData.linkedin || undefined,
        github: formData.github || undefined,
        portfolio: formData.portfolio || undefined,
        education: formData.education || undefined,
        currentCompany: formData.currentCompany || undefined,
        resumeStorageId,
        resumeFilename,
        coverLetterStorageId,
        coverLetterFilename,
      })

      setSuccess(true)
      if (onSuccess) {
        onSuccess(result.candidateId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 dark:text-green-400 text-lg font-semibold mb-2">
          ✓ Application Submitted Successfully
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Thank you for applying for{' '}
          <span className="font-medium">{jobTitle}</span>. We'll review your
          application and get back to you soon.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Job
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john@example.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="San Francisco, CA"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Experience */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            placeholder="e.g., 5 years"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Skills */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Skills (comma-separated)
          </label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleInputChange}
            placeholder="React, TypeScript, Node.js"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Current Company */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Current Company
          </label>
          <input
            type="text"
            name="currentCompany"
            value={formData.currentCompany}
            onChange={handleInputChange}
            placeholder="Acme Inc."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Education */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Education
          </label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleInputChange}
            placeholder="BS Computer Science"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            LinkedIn Profile
          </label>
          <input
            type="url"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleInputChange}
            placeholder="https://linkedin.com/in/johndoe"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            GitHub Profile
          </label>
          <input
            type="url"
            name="github"
            value={formData.github}
            onChange={handleInputChange}
            placeholder="https://github.com/johndoe"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Portfolio/Website
          </label>
          <input
            type="url"
            name="portfolio"
            value={formData.portfolio}
            onChange={handleInputChange}
            placeholder="https://johndoe.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* File Uploads */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Documents
        </h3>

        {/* Resume */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Resume
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileChange(e, 'resume')}
              className="hidden"
              id="resume-input"
            />
            <label
              htmlFor="resume-input"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {files.resume ? files.resume.name : 'Click to upload or drag and drop'}
              </span>
            </label>
          </div>
          {files.resume && (
            <div className="mt-2 flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
              <span className="text-gray-700 dark:text-gray-300">{files.resume.name}</span>
              <button
                type="button"
                onClick={() => setFiles((prev) => ({ ...prev, resume: null }))}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Cover Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Cover Letter (Optional)
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileChange(e, 'coverLetter')}
              className="hidden"
              id="cover-letter-input"
            />
            <label
              htmlFor="cover-letter-input"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {files.coverLetter ? files.coverLetter.name : 'Click to upload or drag and drop'}
              </span>
            </label>
          </div>
          {files.coverLetter && (
            <div className="mt-2 flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
              <span className="text-gray-700 dark:text-gray-300">{files.coverLetter.name}</span>
              <button
                type="button"
                onClick={() => setFiles((prev) => ({ ...prev, coverLetter: null }))}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
