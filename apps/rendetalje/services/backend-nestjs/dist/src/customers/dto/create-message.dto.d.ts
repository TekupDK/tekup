export declare class CreateMessageDto {
    customer_id: string;
    job_id?: string;
    sender_type: 'customer' | 'employee' | 'system';
    message_type: 'text' | 'photo' | 'file';
    content: string;
    attachments?: string[];
}
