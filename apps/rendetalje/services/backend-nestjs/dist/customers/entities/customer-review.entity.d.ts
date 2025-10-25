import { BaseEntity } from '../../common/entities/base.entity';
export declare class CustomerReview extends BaseEntity {
    job_id: string;
    customer_id: string;
    rating: number;
    review_text?: string;
    photos: string[];
    is_public: boolean;
}
