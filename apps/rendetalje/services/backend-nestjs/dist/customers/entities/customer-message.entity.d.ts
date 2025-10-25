import { OrganizationEntity } from '../../common/entities/base.entity';
export declare class CustomerMessage extends OrganizationEntity {
    customer_id: string;
    job_id?: string;
    sender_id?: string;
    sender_type: 'customer' | 'employee' | 'system';
    message_type: 'text' | 'photo' | 'file';
    content: string;
    attachments: string[];
    is_read: boolean;
}
