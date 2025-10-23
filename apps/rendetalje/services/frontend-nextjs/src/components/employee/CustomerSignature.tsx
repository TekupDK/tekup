'use client';

import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  RotateCcw, 
  Check, 
  X, 
  Download,
  User,
  Calendar
} from 'lucide-react';

interface CustomerSignatureProps {
  customerName: string;
  jobId: string;
  onSignatureCapture: (signatureData: string, customerInfo: SignatureInfo) => void;
  onCancel?: () => void;
  existingSignature?: string;
  readOnly?: boolean;
}

interface SignatureInfo {
  customerName: string;
  date: string;
  time: string;
  jobId: string;
}

export const CustomerSignature: React.FC<CustomerSignatureProps> = ({
  customerName,
  jobId,
  onSignatureCapture,
  onCancel,
  existingSignature,
  readOnly = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: customerName,
    date: new Date().toLocaleDateString('da-DK'),
    time: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if provided
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureData = canvas.toDataURL('image/png');
    const signatureInfo: SignatureInfo = {
      customerName: customerInfo.name,
      date: customerInfo.date,
      time: customerInfo.time,
      jobId
    };

    onSignatureCapture(signatureData, signatureInfo);
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `signature_${jobId}_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Kunde Underskrift</h3>
        <p className="text-gray-600 mt-1">
          {readOnly ? 'Bekræft arbejdets fuldførelse' : 'Bed kunden om at underskrive for at bekræfte arbejdets fuldførelse'}
        </p>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Kunde Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kunde Navn</label>
            {readOnly ? (
              <p className="text-sm text-gray-900">{customerInfo.name}</p>
            ) : (
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dato</label>
            <div className="flex items-center text-sm text-gray-900">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              {customerInfo.date}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tidspunkt</label>
            <div className="flex items-center text-sm text-gray-900">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              {customerInfo.time}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Canvas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Underskrift</h4>
          {!readOnly && (
            <div className="flex space-x-2">
              <button
                onClick={clearSignature}
                disabled={!hasSignature}
                className="text-gray-600 hover:text-gray-800 disabled:opacity-50 p-2 rounded-lg hover:bg-gray-100 flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">Ryd</span>
              </button>
              <button
                onClick={downloadSignature}
                disabled={!hasSignature}
                className="text-gray-600 hover:text-gray-800 disabled:opacity-50 p-2 rounded-lg hover:bg-gray-100 flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`w-full h-48 border-2 border-dashed rounded-lg ${
              readOnly 
                ? 'border-gray-200 bg-gray-50' 
                : hasSignature 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 bg-white cursor-crosshair'
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {!hasSignature && !readOnly && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <PenTool className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Undskriv her med finger eller mus</p>
              </div>
            </div>
          )}
        </div>

        {/* Signature Line */}
        <div className="border-t border-gray-300 pt-2">
          <p className="text-xs text-gray-600 text-center">
            Kunde underskrift - {customerInfo.name}
          </p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-900 mb-2">Bekræftelse</h5>
        <p className="text-xs text-blue-800">
          Ved at underskrive bekræfter kunden at arbejdet er udført tilfredsstillende og i overensstemmelse med aftalen. 
          Kunden har modtaget service som beskrevet og er tilfreds med resultatet.
        </p>
      </div>

      {/* Action Buttons */}
      {!readOnly && (
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Annuller
            </button>
          )}
          <button
            onClick={saveSignature}
            disabled={!hasSignature || !customerInfo.name.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Gem Underskrift
          </button>
        </div>
      )}

      {/* Signature Status */}
      {hasSignature && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-sm font-medium text-green-800">
              {readOnly ? 'Underskrift bekræftet' : 'Underskrift klar til gem'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};