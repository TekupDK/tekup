'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Image, 
  Phone, 
  Video,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  MapPin
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'employee' | 'system';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read';
  attachments?: Attachment[];
  jobId?: string;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  size: number;
}

interface CustomerMessagingProps {
  customerId: string;
  jobId?: string;
  teamMembers?: any[];
}

export const CustomerMessaging: React.FC<CustomerMessagingProps> = ({
  customerId,
  jobId,
  teamMembers = []
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [customerId, jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock messages
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: 'system',
          senderName: 'System',
          senderRole: 'system',
          content: 'Din booking er bekræftet for i dag kl. 10:00. Vores team er på vej!',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'system',
          status: 'read',
          jobId
        },
        {
          id: '2',
          senderId: 'emp-1',
          senderName: 'Maria Hansen',
          senderRole: 'employee',
          content: 'Hej! Vi er lige ankommet og går i gang om 5 minutter. Har du nogle særlige ønsker til dagens rengøring?',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          type: 'text',
          status: 'read',
          jobId
        },
        {
          id: '3',
          senderId: customerId,
          senderName: 'Du',
          senderRole: 'customer',
          content: 'Hej Maria! Tak fordi I kom til tiden. Kunne I være ekstra opmærksomme på køkkenet i dag? Der er lidt ekstra snavs efter gårsdagens madlavning.',
          timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
          type: 'text',
          status: 'read',
          jobId
        },
        {
          id: '4',
          senderId: 'emp-1',
          senderName: 'Maria Hansen',
          senderRole: 'employee',
          content: 'Selvfølgelig! Vi tager ekstra tid til køkkenet. Vi sender billeder når vi er færdige.',
          timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
          type: 'text',
          status: 'read',
          jobId
        },
        {
          id: '5',
          senderId: 'emp-1',
          senderName: 'Maria Hansen',
          senderRole: 'employee',
          content: 'Vi er færdige med køkkenet! Hvad synes du?',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: 'image',
          status: 'delivered',
          attachments: [
            {
              id: 'img-1',
              name: 'køkken_efter.jpg',
              type: 'image',
              url: '/api/placeholder/400/300',
              size: 245760
            }
          ],
          jobId
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    setSending(true);
    
    try {
      const message: Message = {
        id: Date.now().toString(),
        senderId: customerId,
        senderName: 'Du',
        senderRole: 'customer',
        content: newMessage,
        timestamp: new Date().toISOString(),
        type: selectedFiles.length > 0 ? 'image' : 'text',
        status: 'sent',
        attachments: selectedFiles.map(file => ({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: URL.createObjectURL(file),
          size: file.size
        })),
        jobId
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setSelectedFiles([]);

      // Simulate message delivery
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'delivered' } : msg
        ));
      }, 1000);

      // Simulate read receipt
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'read' } : msg
        ));
      }, 3000);

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('da-DK', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('da-DK', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCircle className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {jobId ? `Job #${jobId}` : 'Generel chat'}
            </h3>
            <p className="text-sm text-gray-600">
              {teamMembers.length > 0 
                ? `${teamMembers.length} team medlem${teamMembers.length > 1 ? 'mer' : ''}`
                : 'Kundeservice'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderRole === 'customer';
          const isSystemMessage = message.senderRole === 'system';

          if (isSystemMessage) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md">
                  <div className="flex items-center text-blue-800">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{message.content}</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1 text-center">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                {!isOwnMessage && (
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-green-600">
                        {message.senderName.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{message.senderName}</span>
                  </div>
                )}
                
                <div className={`rounded-lg px-4 py-2 ${
                  isOwnMessage 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.content && (
                    <p className="text-sm">{message.content}</p>
                  )}
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id}>
                          {attachment.type === 'image' ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="max-w-full h-auto rounded cursor-pointer"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                          ) : (
                            <div className="flex items-center p-2 bg-white bg-opacity-20 rounded">
                              <Paperclip className="w-4 h-4 mr-2" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.name}</p>
                                <p className="text-xs opacity-75">{formatFileSize(attachment.size)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className={`flex items-center mt-1 space-x-1 ${
                  isOwnMessage ? 'justify-end' : 'justify-start'
                }`}>
                  <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                  {isOwnMessage && getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="border-t p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Vedhæftede filer:</span>
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Skriv en besked..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Vedhæft fil"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <button
              onClick={sendMessage}
              disabled={sending || (!newMessage.trim() && selectedFiles.length === 0)}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};