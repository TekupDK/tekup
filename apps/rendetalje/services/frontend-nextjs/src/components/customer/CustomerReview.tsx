'use client';

import React, { useState } from 'react';
import { 
  Star, 
  Camera, 
  Send, 
  CheckCircle, 
  X,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

interface CustomerReviewProps {
  jobId: string;
  jobDetails: {
    service: string;
    date: string;
    teamMembers: string[];
  };
  onReviewSubmit: (review: ReviewData) => void;
  onClose?: () => void;
  existingReview?: ReviewData;
}

interface ReviewData {
  rating: number;
  comment: string;
  photos: File[];
  categories: {
    quality: number;
    punctuality: number;
    professionalism: number;
    communication: number;
  };
  wouldRecommend: boolean;
}

const RATING_CATEGORIES = [
  { key: 'quality', label: 'Kvalitet af arbejdet', description: 'Hvor tilfreds er du med rengøringens kvalitet?' },
  { key: 'punctuality', label: 'Punktlighed', description: 'Kom teamet til tiden?' },
  { key: 'professionalism', label: 'Professionalisme', description: 'Var teamet professionelt og høfligt?' },
  { key: 'communication', label: 'Kommunikation', description: 'Var kommunikationen klar og hjælpsom?' }
];

export const CustomerReview: React.FC<CustomerReviewProps> = ({
  jobId,
  jobDetails,
  onReviewSubmit,
  onClose,
  existingReview
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [photos, setPhotos] = useState<File[]>(existingReview?.photos || []);
  const [categories, setCategories] = useState(existingReview?.categories || {
    quality: 0,
    punctuality: 0,
    professionalism: 0,
    communication: 0
  });
  const [wouldRecommend, setWouldRecommend] = useState(existingReview?.wouldRecommend || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleCategoryRating = (category: string, value: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    setPhotos(prev => [...prev, ...imageFiles]);
    setShowPhotoUpload(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Vælg venligst en samlet vurdering');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData: ReviewData = {
        rating,
        comment,
        photos,
        categories,
        wouldRecommend
      };

      await onReviewSubmit(reviewData);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, onStarClick?: (value: number) => void, onStarHover?: (value: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onStarClick?.(star)}
            onMouseEnter={() => onStarHover?.(star)}
            onMouseLeave={() => onStarHover?.(0)}
            className={`transition-colors ${onStarClick ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentRating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderCategoryStars = (category: string, currentRating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleCategoryRating(category, star)}
            className="transition-colors cursor-pointer"
          >
            <Star
              className={`w-5 h-5 ${
                star <= currentRating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageCategoryRating = Object.values(categories).reduce((sum, rating) => sum + rating, 0) / 4;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Vurder din oplevelse</h2>
            <p className="text-gray-600">Job #{jobId} - {jobDetails.service}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Overall Rating */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Samlet vurdering</h3>
            <div className="flex items-center space-x-4">
              {renderStars(
                hoverRating || rating,
                handleStarClick,
                setHoverRating
              )}
              <span className="text-lg font-medium text-gray-700">
                {rating > 0 && (
                  <>
                    {rating}/5 - {
                      rating >= 5 ? 'Fremragende' :
                      rating >= 4 ? 'Meget godt' :
                      rating >= 3 ? 'Godt' :
                      rating >= 2 ? 'Okay' : 'Dårligt'
                    }
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Category Ratings */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detaljeret vurdering</h3>
            <div className="space-y-4">
              {RATING_CATEGORIES.map((category) => (
                <div key={category.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{category.label}</h4>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <div className="ml-4">
                    {renderCategoryStars(category.key, categories[category.key as keyof typeof categories])}
                  </div>
                </div>
              ))}
            </div>
            
            {averageCategoryRating > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Gennemsnit:</span>
                  <div className="flex items-center space-x-2">
                    {renderStars(Math.round(averageCategoryRating))}
                    <span className="text-sm text-gray-600">
                      {averageCategoryRating.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Anbefaling</h3>
            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-700">Jeg vil anbefale Rendetalje til andre</span>
              </label>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kommentar (valgfrit)</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Del dine tanker om servicen, teamet eller forbedringsforslag..."
            />
          </div>

          {/* Photos */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Billeder (valgfrit)</h3>
              <button
                onClick={() => setShowPhotoUpload(true)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <Camera className="w-4 h-4 mr-1" />
                Tilføj billeder
              </button>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showPhotoUpload && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Klik for at vælge billeder</p>
                  <p className="text-sm text-gray-500">Eller træk og slip billeder her</p>
                </label>
                <button
                  onClick={() => setShowPhotoUpload(false)}
                  className="mt-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Annuller
                </button>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Del billeder af det færdige resultat eller andre relevante detaljer
            </p>
          </div>

          {/* Job Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Job detaljer</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Service:</strong> {jobDetails.service}</p>
              <p><strong>Dato:</strong> {new Date(jobDetails.date).toLocaleDateString('da-DK')}</p>
              <p><strong>Team:</strong> {jobDetails.teamMembers.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t bg-gray-50">
          {onClose && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Annuller
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sender...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send vurdering
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};