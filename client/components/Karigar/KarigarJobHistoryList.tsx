"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ReceiveMetalDialog from "./ReceiveMetalDialog"
import JobDetailsModal from "./JobDetailsModal"
import { Eye, Hammer } from "lucide-react"

export default function KarigarJobHistoryList({ jobs }: { jobs: any[] }) {
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenDetails = (job: any) => {
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No workshop jobs found for this artisan.
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => handleOpenDetails(job)}
            className="flex flex-col md:flex-row justify-between md:items-center bg-[#1f1e15] border border-border/80 hover:border-[#C9943A]/50 rounded-xl p-4 gap-4 transition-all duration-200 cursor-pointer group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-base font-mono group-hover:text-[#C9943A] transition">
                  Job #{job.id.slice(-6).toUpperCase()}
                </span>
                <Badge
                  className={
                    job.status === "OPEN"
                      ? "bg-blue-600 text-foreground"
                      : "bg-emerald-600 text-foreground"
                  }
                >
                  {job.status}
                </Badge>
              </div>
              <p className="text-sm text-foreground/90">
                Issued: <b className="text-yellow-500 font-mono">{job.issuedWeight} g</b> @ {(job.issuedPurity * 100).toFixed(1)}% Purity
              </p>
              {(job.cashIssued > 0 || job.cashPaid > 0) && (
                <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                  {job.cashIssued > 0 && <span>Cash Advanced: <b className="text-green-400">₹{job.cashIssued}</b></span>}
                  {job.cashPaid > 0 && <span>Labour Paid/Due: <b className="text-amber-400">₹{job.cashPaid}</b></span>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Date: {new Date(job.createdAt).toLocaleDateString("en-GB")}
              </p>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDetails(job)}
                className="border-border hover:border-[#C9943A] text-foreground/90 hover:text-foreground rounded-lg text-xs flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-[#C9943A]" /> View Details
              </Button>

              {job.status === "OPEN" && (
                <ReceiveMetalDialog
                  jobId={job.id}
                  issuedWeight={job.issuedWeight}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* JOB DETAILS MODAL */}
      <JobDetailsModal
        jobData={selectedJob}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedJob(null)
        }}
      />
    </>
  )
}
