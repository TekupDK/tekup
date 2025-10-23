'use client';

import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  Eye, 
  Trash2,
  RotateCcw,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { JobPhoto } from '../../types';

interface PhotoDocumentationProps {
  jobId: string;
  photos: JobPhoto[];
  onPhotosUpdate: (photos: JobPhoto[]) => void;
  requiredPhotos?: string[];
  readOnly?: boolean;
}

interface PhotoUpload {
  id: string;
  file: File;
  preview: string;
  type: 'before' | 'after' | 'during';
  description?: string;
  uploading?: boolean;
}

export const PhotoDocumentation: React.FC<PhotoDocumentationProps> = ({
  jobId,
  photos,
  onPhotosUpdate,
  requiredPhotos = ['before', 'after'],
  readOnly = false
}) => {
  const [uploads, setUploads] = useState<PhotoUpload[]>([]);
  const [selectedType, setSelectedType] = useState<'before' | 'after' | 'during'>('before');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null, type: 'before' | 'after' | 'during') => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const preview = URL.createObjectURL(file);
        
        const newUpload: PhotoUpload = {
          id,
          file,
          preview,
          type,
          uploading: false
        };

        setUploads(prev => [...prev, newUpload]);
      }
    });
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files, selectedType);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files, selectedType);
  };

  const removeUpload = (id: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === id);
      if (upload) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter(u => u.id !== id);
    });
  };

  const updateUploadDescription = (id: string, description: string) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, description } : upload
    ));
  };

  const uploadPhotos = async () => {
    const uploadPromises = uploads.map(async (upload) => {
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, uploading: true } : u
      ));

      try {
        // Simulate upload - in real implementation, upload to storage service
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newPhoto: JobPhoto = {
          id: upload.id,
          url: upload.preview, // In real implementation, this would be the uploaded URL
          type: upload.type,
          description: upload.description,
          uploaded_at: new Date().toISOString()
        };

        return newPhoto;
      } catch (error) {
        console.error('Upload failed:', error);
        return null;
      }
    });

    const uploadedPhotos = (await Promise.all(uploadPromises)).filter(Boolean) as JobPhoto[];
    
    if (uploadedPhotos.length > 0) {
      const updatedPhotos = [...photos, ...uploadedPhotos];
      onPhotosUpdate(updatedPhotos);
      setUploads([]);
    }
  };

  const deletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosUpdate(updatedPhotos);
  };

  const getPhotosByType = (type: 'before' | 'after' | 'during') => {
    return photos.filter(photo => photo.type === type);
  };

  const getTypeColor = (type: 'before' | 'after' | 'during') => {
    switch (type) {
      case 'before': return 'bg-red-100 text-red-800';
      case 'after': return 'bg-green-100 text-green-800';
      case 'during': return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeLabel = (type: 'before' | 'after' | 'during') => {
    switch (type) {
      case 'before': return 'Før';
      case 'after': return 'Efter';
      case 'during': return 'Under arbejdet';
    }
  };

  const isTypeRequired = (type: 'before' | 'after' | 'during') => {
    return requiredPhotos.includes(type);
  };

  const hasRequiredPhotos = () => {
    return requiredPhotos.every(type => 
      getPhotosByType(type as any).length > 0 || 
      uploads.some(upload => upload.type === type)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Foto Dokumentation</h3>
          <p className="text-gray-600">
            Tag billeder før, under og efter arbejdet
          </p>
        </div>
        {!readOnly && uploads.length > 0 && (
          <button
            onClick={uploadPhotos}
            disabled={uploads.some(u => u.uploading)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Billeder ({uploads.length})
          </button>
        )}
      </div>

      {/* Required Photos Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Påkrævede Billeder</h4>
        <div className="grid grid-cols-3 gap-4">
          {(['before', 'after', 'during'] as const).map(type => {
            const isRequired = isTypeRequired(type);
            const hasPhotos = getPhotosByType(type).length > 0 || uploads.some(u => u.type === type);
            
            return (
              <div
                key={type}
                className={`p-3 rounded-lg border-2 ${
                  isRequired
                    ? hasPhotos
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                    : hasPhotos
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {getTypeLabel(type)}
                  </span>
                  {isRequired && (
                    hasPhotos ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {getPhotosByType(type).length + uploads.filter(u => u.type === type).length} billeder
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo Capture Controls */}
      {!readOnly && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tag Nyt Billede</h4>
          
          {/* Type Selection */}
          <div className="flex space-x-2 mb-4">
            {(['before', 'after', 'during'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>

          {/* Capture Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Tag Billede
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Vælg Fil
            </button>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Pending Uploads */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Afventende Upload</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploads.map(upload => (
              <div key={upload.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={upload.preview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                  {upload.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(upload.type)}`}>
                    {getTypeLabel(upload.type)}
                  </span>
                </div>

                <textarea
                  value={upload.description || ''}
                  onChange={(e) => updateUploadDescription(upload.id, e.target.value)}
                  placeholder="Beskrivelse (valgfri)"
                  className="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1"
                  rows={2}
                />

                {!upload.uploading && (
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Photos */}
      {(['before', 'after', 'during'] as const).map(type => {
        const typePhotos = getPhotosByType(type);
        if (typePhotos.length === 0) return null;

        return (
          <div key={type} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                {getTypeLabel(type)} Billeder ({typePhotos.length})
              </h4>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(type)}`}>
                {getTypeLabel(type)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {typePhotos.map(photo => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.description || `${getTypeLabel(type)} billede`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setViewingPhoto(photo.url)}
                    />
                  </div>
                  
                  {photo.description && (
                    <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                      {photo.description}
                    </p>
                  )}

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                      onClick={() => setViewingPhoto(photo.url)}
                      className="bg-blue-600 text-white p-1 rounded-full"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="bg-red-600 text-white p-1 rounded-full"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(photo.uploaded_at).toLocaleDateString('da-DK')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={viewingPhoto}
              alt="Forstørret billede"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setViewingPhoto(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingPhoto;
                  link.download = 'job-photo.jpg';
                  link.click();
                }}
                className="bg-white text-gray-900 px-3 py-2 rounded-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Status */}
      {!readOnly && requiredPhotos.length > 0 && (
        <div className={`p-4 rounded-lg border ${
          hasRequiredPhotos()
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center">
            {hasRequiredPhotos() ? (
              <Check className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            )}
            <p className={`text-sm font-medium ${
              hasRequiredPhotos() ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {hasRequiredPhotos()
                ? 'Alle påkrævede billeder er taget'
                : 'Mangler påkrævede billeder for at fuldføre jobbet'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};