export interface CrmContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ownerId?: string;
}

export interface CrmCompany {
  id: string;
  name: string;
  domain?: string;
  ownerId?: string;
}

export interface CrmDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  ownerId?: string;
  associatedCompanyIds?: string[];
  associatedContactIds?: string[];
}