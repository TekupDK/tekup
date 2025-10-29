"use client";

import React, { useState, useEffect } from "react";
import { X, User, Calendar, AlertCircle, CheckCircle } from "lucide-react";

interface Job {
  id: string;
  title: string;
  scheduledDate?: string;
  customer: {
    name: string;
    address?: string;
  };
}

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
  rating: number;
  status: string;
}

interface AssignmentModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (
    jobId: string,
    subcontractorId?: string,
    useSmartAssignment?: boolean
  ) => Promise<void>;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  job,
  isOpen,
  onClose,
  onAssign,
}) => {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<
    string | null
  >(null);
  const [useSmartAssignment, setUseSmartAssignment] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubcontractors();
    }
  }, [isOpen]);

  const fetchSubcontractors = async () => {
    try {
      const response = await fetch("/api/subcontractors?status=active", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subcontractors");
      }

      const data = await response.json();
      setSubcontractors(data);
    } catch (err) {
      console.error("Error fetching subcontractors:", err);
      setError("Kunne ikke hente underleverandører");
    }
  };

  const handleAssign = async () => {
    try {
      setLoading(true);
      setError(null);

      await onAssign(
        job.id,
        selectedSubcontractor || undefined,
        useSmartAssignment
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tildeling fejlede");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Tildel Underleverandør
            </h2>
            <p className="text-sm text-gray-600 mt-1">Opgave: {job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-700 font-medium">
              Underleverandør tildelt!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Job Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">Kunde:</span>
              <span>{job.customer.name}</span>
            </div>
            {job.scheduledDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Planlagt:</span>
                <span>
                  {new Date(job.scheduledDate).toLocaleDateString("da-DK")}
                </span>
              </div>
            )}
          </div>

          {/* Smart Assignment Toggle */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="smartAssignment"
              checked={useSmartAssignment}
              onChange={(e) => {
                setUseSmartAssignment(e.target.checked);
                if (e.target.checked) {
                  setSelectedSubcontractor(null);
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="smartAssignment" className="text-sm text-gray-700">
              <span className="font-medium">Brug smart tildeling</span>
              <p className="text-xs text-gray-600 mt-0.5">
                Systemet vælger den bedst egnede underleverandør baseret på
                rating, tilgængelighed og erfaring
              </p>
            </label>
          </div>

          {/* Manual Selection */}
          {!useSmartAssignment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vælg underleverandør manuelt
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {subcontractors.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcontractor(sub.id)}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      selectedSubcontractor === sub.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sub.companyName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {sub.contactName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-700">
                          {sub.rating.toFixed(1)}
                        </span>
                        <span className="text-yellow-400">★</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuller
          </button>
          <button
            onClick={handleAssign}
            disabled={
              loading || (!useSmartAssignment && !selectedSubcontractor)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Tildeler...
              </>
            ) : (
              "Tildel Opgave"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
