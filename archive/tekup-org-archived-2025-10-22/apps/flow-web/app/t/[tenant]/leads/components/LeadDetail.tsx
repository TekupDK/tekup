import React from 'react';
import { Lead } from '../../../../../lib/api';
import { StatusBadge } from './StatusBadge';

export interface LeadDetailProps {
  lead: Lead;
  className?: string;
}

export function LeadDetail({ lead, className = '' }: LeadDetailProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('da-DK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const renderContactLink = (type: 'email' | 'phone', value: string) => {
    if (type === 'email') {
      return (
        <a
          href={`mailto:${value}`}
          className="text-brand hover:text-brand/80 underline transition-colors font-medium"
          title={`Send email to ${value}`}
        >
          {value}
        </a>
      );
    }
    
    if (type === 'phone') {
      // Clean phone number for tel: link
      const cleanPhone = value.replace(/[^\d+]/g, '');
      return (
        <a
          href={`tel:${cleanPhone}`}
          className="text-brand hover:text-brand/80 underline transition-colors font-medium"
          title={`Call ${value}`}
        >
          {value}
        </a>
      );
    }
    
    return <span>{value}</span>;
  };

  const renderPayloadField = (label: string, value: any, type?: 'email' | 'phone') => {
    if (!value && value !== 0) return null;
    
    return (
      <div className="space-y-1">
        <dt className="text-sm font-medium text-neutral-300">{label}</dt>
        <dd className="text-sm text-neutral-400">
          {type ? renderContactLink(type, value) : value}
        </dd>
      </div>
    );
  };

  const renderBrandSpecificFields = (payload: any) => {
    if (!payload) return null;
    
    const brand = payload.brand || '';
    
    switch (brand.toLowerCase()) {
      case 'rendetalje':
        return (
          <>
            {renderPayloadField('Area (m²)', payload.area_sqm)}
            {renderPayloadField('Service Type', payload.service_type)}
            {renderPayloadField('Frequency', payload.frequency)}
            {renderPayloadField('Address', payload.address)}
            {renderPayloadField('Postal Code', payload.postal_code)}
            {renderPayloadField('City', payload.city)}
          </>
        );
      
      case 'foodtruck':
        return (
          <>
            {renderPayloadField('Event Type', payload.event_type)}
            {renderPayloadField('Number of Guests', payload.pax)}
            {renderPayloadField('Event Date', payload.event_date)}
            {renderPayloadField('Budget (DKK)', payload.budget)}
            {renderPayloadField('Menu Request', payload.menu_request)}
            {renderPayloadField('Address', payload.address)}
          </>
        );
      
      case 'tekup':
        return (
          <>
            {renderPayloadField('Company', payload.company)}
            {renderPayloadField('Service Type', payload.service_type)}
            {renderPayloadField('Urgency', payload.urgency)}
            {renderPayloadField('Compliance Type', payload.compliance_type)}
            {renderPayloadField('Severity', payload.severity)}
            {renderPayloadField('Scan ID', payload.scan_id)}
            {renderPayloadField('Finding Category', payload.finding_category)}
            {renderPayloadField('Recommendation', payload.recommendation)}
            {renderPayloadField('Auto Actionable', payload.auto_actionable ? 'Yes' : 'No')}
            {payload.sla_deadline && (
              <div className="space-y-1">
                <dt className="text-sm font-medium text-neutral-300">SLA Deadline</dt>
                <dd className="text-sm text-neutral-400">
                  {formatDate(payload.sla_deadline)}
                  {isSlaBreached(payload.sla_deadline) && (
                    <span className="ml-2 px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded">
                      Breached
                    </span>
                  )}
                  {isSlaApproaching(payload.sla_deadline) && (
                    <span className="ml-2 px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded">
                      Approaching
                    </span>
                  )}
                </dd>
              </div>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  const isSlaBreached = (slaDeadline: string) => {
    if (!slaDeadline) return false;
    return new Date(slaDeadline) < new Date();
  };

  const isSlaApproaching = (slaDeadline: string) => {
    if (!slaDeadline) return false;
    const deadline = new Date(slaDeadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-200 mb-3">
              Lead Details
            </h1>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded">
                ID: {lead.id}
              </span>
              <StatusBadge status={lead.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="space-y-1">
          <dt className="text-sm font-medium text-neutral-300">Source</dt>
          <dd className="text-sm text-neutral-400 capitalize">{lead.source}</dd>
        </div>
        
        <div className="space-y-1">
          <dt className="text-sm font-medium text-neutral-300">Created</dt>
          <dd className="text-sm text-neutral-400">{formatDate(lead.created_at || lead.createdAt)}</dd>
        </div>
        
        {lead.updated_at && (
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <dt className="text-sm font-medium text-neutral-300">Last Updated</dt>
            <dd className="text-sm text-neutral-400">{formatDate(lead.updated_at)}</dd>
          </div>
        )}
      </div>

      {/* Contact Information */}
      {lead.payload && (
        <div className="border border-neutral-800/60 rounded-lg p-6 bg-neutral-950/30 backdrop-blur-sm">
          <h2 className="text-lg font-medium text-neutral-200 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Contact Information
          </h2>
          
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderPayloadField('Name', lead.payload.name)}
            {renderPayloadField('Email', lead.payload.email, 'email')}
            {renderPayloadField('Phone', lead.payload.phone, 'phone')}
            {renderPayloadField('Company', lead.payload.company)}
            {renderPayloadField('Subject', lead.payload.subject)}
          </dl>
          
          {/* Brand-specific fields */}
          <div className="mt-6 pt-6 border-t border-neutral-700/50">
            <h3 className="text-md font-medium text-neutral-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Details
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderBrandSpecificFields(lead.payload)}
            </dl>
          </div>
          
          {lead.payload.message && (
            <div className="mt-6 pt-6 border-t border-neutral-700/50">
              <dt className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </dt>
              <dd className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed bg-neutral-800/30 p-4 rounded border border-neutral-700/30">
                {lead.payload.message}
              </dd>
            </div>
          )}
          
          {/* Additional payload fields */}
          {Object.entries(lead.payload).map(([key, value]) => {
            // Skip fields we've already rendered
            const standardFields = ['name', 'email', 'phone', 'company', 'subject', 'message', 'brand', 'area_sqm', 'service_type', 'frequency', 'event_type', 'pax', 'event_date', 'budget', 'menu_request', 'urgency', 'compliance_type', 'severity', 'scan_id', 'finding_category', 'recommendation', 'auto_actionable', 'sla_deadline', 'address', 'postal_code', 'city'];
            if (standardFields.includes(key)) {
              return null;
            }
            
            if (!value) return null;
            
            return (
              <div key={key} className="mt-4">
                <dt className="text-sm font-medium text-neutral-300 capitalize">
                  {key.replace(/[_-]/g, ' ')}
                </dt>
                <dd className="text-sm text-neutral-400 mt-1">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </dd>
              </div>
            );
          })}
        </div>
      )}

      {/* No payload message */}
      {!lead.payload && (
        <div className="border border-neutral-800 rounded-lg p-6 text-center">
          <div className="text-neutral-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No additional information available for this lead.</p>
          </div>
        </div>
      )}

      {/* Raw data (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="border border-neutral-800 rounded-lg">
          <summary className="p-4 cursor-pointer text-sm text-neutral-400 hover:text-neutral-300">
            Raw Lead Data (Development Only)
          </summary>
          <div className="p-4 pt-0">
            <pre className="text-xs text-neutral-500 bg-neutral-900 p-3 rounded overflow-auto">
              {JSON.stringify(lead, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}