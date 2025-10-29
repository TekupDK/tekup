"use client";

import React, { useState } from "react";
import { Star, X, CheckCircle, AlertCircle } from "lucide-react";

interface ReviewFormProps {
  subcontractorId: string;
  subcontractorName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subcontractorId: string, review: ReviewData) => Promise<void>;
}

export interface ReviewData {
  rating: number;
  punctualityScore?: number;
  qualityScore?: number;
  communicationScore?: number;
  comments?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  subcontractorId,
  subcontractorName,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [punctualityScore, setPunctualityScore] = useState(0);
  const [qualityScore, setQualityScore] = useState(0);
  const [communicationScore, setCommunicationScore] = useState(0);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Vælg venligst en overordnet rating");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reviewData: ReviewData = {
        rating,
        punctualityScore: punctualityScore || undefined,
        qualityScore: qualityScore || undefined,
        communicationScore: communicationScore || undefined,
        comments: comments.trim() || undefined,
      };

      await onSubmit(subcontractorId, reviewData);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setRating(0);
        setPunctualityScore(0);
        setQualityScore(0);
        setCommunicationScore(0);
        setComments("");
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke gemme anmeldelse"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    required: boolean = false
  ) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <Star
                className={`h-8 w-8 cursor-pointer transition-colors ${
                  star <= value
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-200"
                }`}
              />
            </button>
          ))}
        </div>
        {value > 0 && (
          <p className="text-sm text-gray-600">
            {value === 1 && "Meget dårlig"}
            {value === 2 && "Dårlig"}
            {value === 3 && "Okay"}
            {value === 4 && "God"}
            {value === 5 && "Fremragende"}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Anmeld Underleverandør
            </h2>
            <p className="text-sm text-gray-600 mt-1">{subcontractorName}</p>
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
            <p className="text-green-700 font-medium">Anmeldelse gemt!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Overall Rating */}
          {renderStarRating("Overordnet rating", rating, setRating, true)}

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Detaljeret vurdering (valgfrit)
            </h3>

            <div className="space-y-6">
              {/* Punctuality */}
              {renderStarRating(
                "Punktlighed",
                punctualityScore,
                setPunctualityScore
              )}

              {/* Quality */}
              {renderStarRating(
                "Arbejdskvalitet",
                qualityScore,
                setQualityScore
              )}

              {/* Communication */}
              {renderStarRating(
                "Kommunikation",
                communicationScore,
                setCommunicationScore
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label
              htmlFor="comments"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Kommentarer (valgfrit)
            </label>
            <textarea
              id="comments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Del din erfaring med denne underleverandør..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={2000}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {comments.length}/2000 tegn
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gemmer...
                </>
              ) : (
                "Gem Anmeldelse"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
