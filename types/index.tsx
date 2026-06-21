// src/types/index.ts

export interface TimelineStage {
  completed: boolean;
  savedAt?: Date;
  savedBy?: string;
}

export interface ETDETAData extends TimelineStage {
  estimatedDeparture?: Date;
  shippedOnboardDate?: Date;
  sailedDate?: Date;
  expectedArrival?: Date;
  note?: string;
}

export interface ETDData extends TimelineStage {
  estimatedDeparture?: Date;
  shippedOnboardDate?: Date;
  sailedDate?: Date;
  note?: string;
}

export interface ETAData extends TimelineStage {
  approxArrivalDate?: Date;
  arrivalDate?: Date;
  status?: string;
  note?: string;
}

export interface ClearanceData extends TimelineStage {
  status?: string;
  clearanceDate?: Date;
  note?: string;
}

export interface CargoSegregationData extends TimelineStage {
  status?: string;
  segregationDate?: Date;
  note?: string;
}

export interface BillingData extends TimelineStage {
  status?: string;
  billingDate?: Date;
  note?: string;
}

export interface PaymentData extends TimelineStage {
  status?: string;
  paymentDate?: Date;
  note?: string;
}

export interface DispatchData extends TimelineStage {
  status?: string;
  driverName?: string;
  driverPhone?: string;
  truckNo?: string;
  dispatchDate?: Date;
  note?: string;
}

export interface SupportDocument {
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'excel';
  uploadedAt?: string;
}

export interface PackageTimeline {
  packageCreated?: TimelineStage;
  etd?: ETDData;
  eta?: ETAData;
  etdEta?: ETDETAData;
  clearance?: ClearanceData;
  cargoSegregation?: CargoSegregationData;
  billing?: BillingData;
  payment?: PaymentData;
  dispatch?: DispatchData;
}

export interface User {
    username: string;
    password: string;
    role: string;
  }
  
  export interface Package {
    id: string;
    name: string;
    status:
      | 'in_process'
      | 'payment_completed'
      | 'operation_completed'
      | 'operation_cancelled';
    vendorId?: string;
    vendorCode?: string;
    vendorName?: string;
    vendorMobile?: string;
    supportDocuments?: SupportDocument[];
    createdAt: Date;
    updatedAt: Date;
    description?: string;
    blNo?: string;
    containerNo?: string;
    amountPerCbm?: number;
    totalAmount?: number;
    otherExpenses?: number;
    transportExpenses?: number;
    weightType?: 'KG' | 'TON';
    vendorDeliveryAddress?: string;
    vendorBillingAddress?: string;
    amount?: number;
    weight?: number;
    cbm?: number;
    packageType?: string;
    packageCount?: number;
    createdBy?: string;
    updatedBy?: string;
    completedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    timeline?: PackageTimeline;
  }

  export interface Operation {
    id: string;
    type: 'Billing' | 'Payment' | 'Cargo Segregation' | 'Clearance' | 'Dispatch Status' | 'Package';
    status: string[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Vendor {
    id: string;
    name: string;
    mobile: string;
    mailId: string;
    address: string;
    billingAddress: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface AuthUser {
    username: string;
    role: string;
  }
  