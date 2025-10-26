
interface EmailViewerProps {
  email: Email
}

export default function EmailViewer({ email }: EmailViewerProps) {
  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-2">{email.subject}</h1>
      <div className="text-sm text-gray-700 whitespace-pre-wrap">{email.body}</div>
    </div>
  )
}
>>>>>>> 8b19946abcf2c49f3a3ba2ce044a86b7032193c3
import React from 'react'
import { Email } from '@shared/types'
import { formatDistanceToNow } from 'date-fns'

interface EmailViewerProps {
  email: Email
  onBack?: () => void
}

export function EmailViewer({ email, onBack }: EmailViewerProps) {
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 text-gray-500 hover:text-gray-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(email.sender.name || email.sender.email)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">{email.subject}</h1>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <span>{email.sender.name || email.sender.email}</span>
                <span>•</span>
                <span>{formatDate(email.date)}</span>
                {email.attachments.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Recipients */}
        {email.recipients.length > 0 && (
          <div className="mb-6 text-sm">
            <div className="text-gray-600 mb-1">To:</div>
            <div className="text-gray-900">
              {email.recipients.map((recipient, index) => (
                <span key={index}>
                  {recipient.name || recipient.email}
                  {index < email.recipients.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div className="prose max-w-none">
          {email.body.html ? (
            <div 
              dangerouslySetInnerHTML={{ __html: email.body.html }}
              className="email-content"
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-900">
              {email.body.text}
            </div>
          )}
        </div>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Attachments ({email.attachments.length})
            </h3>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{attachment.filename}</div>
                    <div className="text-xs text-gray-500">
                      {attachment.contentType} • {Math.round(attachment.size / 1024)} KB
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reply Actions */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex space-x-2">
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            Reply
          </button>
          <button className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">
            Reply All
          </button>
          <button className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">
            Forward
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailViewer
=======

interface EmailViewerProps {
  email: Email
}

export default function EmailViewer({ email }: EmailViewerProps) {
  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-2">{email.subject}</h1>
      <div className="text-sm text-gray-700 whitespace-pre-wrap">{email.body}</div>
    </div>
  )
}
>>>>>>> 8b19946abcf2c49f3a3ba2ce044a86b7032193c3
