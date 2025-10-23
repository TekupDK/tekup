export interface Customer {
  id: string;
  organization_id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  preferences: {
    preferred_time?: string;
    special_instructions?: string;
    key_location?: string;
    contact_method?: 'email' | 'phone' | 'sms';
  };
  total_jobs: number;
  total_revenue: number;
  satisfaction_score?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerMessage {
  id: string;
  organization_id: string;
  customer_id: string;
  job_id?: string;
  sender_id?: string;
  sender_type: 'customer' | 'employee' | 'system';
  message_type: 'text' | 'photo' | 'file';
  content: string;
  attachments: string[];
  is_read: boolean;
  created_at: string;
}

export interface CustomerReview {
  id: string;
  job_id: string;
  customer_id: string;
  rating: number;
  review_text?: string;
  photos: string[];
  is_public: boolean;
  created_at: string;
}