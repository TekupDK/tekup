"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Star,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  Pause,
} from "lucide-react";

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  status: "active" | "inactive" | "suspended";
  rating: number;
  cvrNumber?: string;
  websiteUrl?: string;
  notes?: string;
  createdAt: string;
}

interface SubcontractorListProps {
  onSelectSubcontractor: (subcontractor: Subcontractor) => void;
  onCreateSubcontractor: () => void;
  onEditSubcontractor: (subcontractor: Subcontractor) => void;
}

export const SubcontractorList: React.FC<SubcontractorListProps> = ({
  onSelectSubcontractor,
  onCreateSubcontractor,
  onEditSubcontractor,
}) => {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSubcontractors();
  }, [searchQuery, statusFilter, minRatingFilter]);

  const fetchSubcontractors = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (minRatingFilter > 0)
        params.append("minRating", minRatingFilter.toString());

      const response = await fetch(`/api/subcontractors?${params}`, {
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
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching subcontractors:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "inactive":
        return <XCircle className="h-5 w-5 text-gray-400" />;
      case "suspended":
        return <Pause className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            Aktiv
          </span>
        );
      case "inactive":
        return (
          <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
            Inaktiv
          </span>
        );
      case "suspended":
        return (
          <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
            Suspenderet
          </span>
        );
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-medium">Fejl ved indlæsning af underleverandører</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchSubcontractors}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Prøv igen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Underleverandører
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {subcontractors.length}{" "}
            {subcontractors.length === 1
              ? "underleverandør"
              : "underleverandører"}
          </p>
        </div>
        <button
          onClick={onCreateSubcontractor}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Tilføj Underleverandør
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Søg efter firma, navn, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-5 w-5" />
          Filtre
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
                <option value="suspended">Suspenderet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min. rating
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={minRatingFilter}
                onChange={(e) =>
                  setMinRatingFilter(parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Subcontractors Grid */}
      {subcontractors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Ingen underleverandører fundet
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Prøv at justere dine søgefiltre
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subcontractors.map((subcontractor) => (
            <div
              key={subcontractor.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectSubcontractor(subcontractor)}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {subcontractor.companyName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subcontractor.contactName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(subcontractor.status)}
                  {getStatusLabel(subcontractor.status)}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-3">{renderStars(subcontractor.rating)}</div>

              {/* Contact Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{subcontractor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{subcontractor.phone}</span>
                </div>
                {subcontractor.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{subcontractor.address}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSubcontractor(subcontractor);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Se detaljer
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSubcontractor(subcontractor);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
