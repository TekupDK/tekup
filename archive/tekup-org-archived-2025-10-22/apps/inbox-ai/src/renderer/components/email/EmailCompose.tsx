import React from 'react'

export default function EmailCompose() {
  return (
    <form className="p-4 space-y-2">
      <input className="border p-2 w-full" placeholder="To" />
      <input className="border p-2 w-full" placeholder="Subject" />
      <textarea className="border p-2 w-full h-40" placeholder="Message" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
    </form>
  )
}
>>>>>>> 8b19946abcf2c49f3a3ba2ce044a86b7032193c3
import React, { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

import { useApp } from '../../contexts/AppContext';

export interface EmailComposeProps {
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export function EmailCompose({ onClose, initialTo = '', initialSubject = '', initialBody = '' }: EmailComposeProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const { emailService } = useApp();

  const handleSend = async () => {
    try {
      await emailService.sendEmail({ to, subject, body });
      onClose();
    } catch (error) {
      logger.error('Failed to send email:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Compose Email</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded h-40"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-blue-600"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

export default EmailCompose;
=======
import React from 'react'

export default function EmailCompose() {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-renderer-com');

  return (
    <form className="p-4 space-y-2">
      <input className="border p-2 w-full" placeholder="To" />
      <input className="border p-2 w-full" placeholder="Subject" />
      <textarea className="border p-2 w-full h-40" placeholder="Message" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
    </form>
  )
}
>>>>>>> 8b19946abcf2c49f3a3ba2ce044a86b7032193c3
