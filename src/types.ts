export interface RequisitionItem {
  id: string;
  packageName: string;
  packageDescription: string;
  bomCode: string;
  description: string;
  etItemCode: string;
  quantity: number;
  uom: string;
  remarksBoq: string;
}

export interface MR {
  mrNumber: string;
  poNumber: string;
  vendorClient: string;
  requestDate: string;
  handoverDate: string;
  assignedTim: string;
  assignedTl: string;
  notes: string;
  status: 'Received' | 'Handed over' | 'Analysed' | 'Approved' | 'Dispatched' | 'Delivered' | 'Closed';
  lineItems: MRLineItem[];
  
  // Extended Ethio Telecom / ZTE sheet fields
  circleName?: string;
  warehouseName?: string;
  requestArrivedSiteTime?: string;
  subcontractor?: string;
  submitterName?: string;
  submitterTitle?: string;
  submitterCompany?: string;
  siteAddress?: string;
  requisitionItems?: RequisitionItem[];
}

export interface MRLineItem {
  id: string;
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  mwLinks: string;
  town: string;
  projectScope: string;
  zoneManager: string;
  implementationPriority: 'High' | 'Medium' | 'Low';
  distance: number;
  truck: string;
  itemCategory: string;
}

export interface WorkAnalysis {
  id: string;
  mrRef: string;
  date: string;
  preparedBy: string;
  sites: WorkAnalysisSite[];
  truckTypeRecommended: '3-ton' | '5-ton' | '7-ton' | '10-ton' | 'Trailer';
  totalSites: number;
  totalDistance: number;
  estimatedTrips: number;
  specialRequirements: string[]; // Security escort, Night delivery, Last-mile labour, Refrigeration
  keyRisks: string;
  scopeNegotiationNotes: string;
  validatedBy: string;
  validationDate: string;
  status: 'Pending' | 'Validated' | 'Negotiation required';
}

export interface WorkAnalysisSite {
  id: string;
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  mwLinks: string;
  town: string;
  projectScope: string;
  zoneManager: string;
  implementationPriority: 'High' | 'Medium' | 'Low';
  distance: number;
  recommendedTruck: '3-ton' | '5-ton' | '7-ton' | '10-ton' | 'Trailer';
}

export interface Supplier {
  id: string;
  name: string;
  tin: string;
  region: string;
  city: string;
  capitalCity: string;
  licenseNo: string;
  status: 'Active' | 'Inactive';
  rating: number; // overall percentage (0-100)
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  licenseExpiryDate: string;
  serviceQualityScore: number;
  creditFacility: boolean;
  experienceWithAdiu: boolean;
  notes: string;
  
  // Performance evaluation criteria
  perfCreditFacility: number;
  perfProductQuality: number;
  perfServiceQuality: number;
  perfAvailability: number;
  perfExperienceWithAdiu: number;
}

export interface PriceBookEntry {
  id: string;
  code: string;
  itemDescription: string;
  unit: string;
  unitPrice: number; // ETB ex-VAT
  effectiveDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired';
  supplierId: string;
  itemCategoryId: string;
  remark?: string;
}

export interface PriceThresholdConfig {
  supplierId: string;
  thresholdAmount: number;
  alertThresholdPercent: number;
}

export interface Vehicle {
  plateNumber: string;
  supplierId: string;
  tonCapacity: number;
  ageCategory: '0-5 yrs' | '6-10 yrs' | '10+ yrs';
  model: string;
  lastQehsCheck: string;
  status: 'Compliant' | 'Non-compliant' | 'Blacklisted';
  driverName: string;
  driverId: string;
  driverPhone: string;
  assignedRoute: string;
  carType?: 'Owned' | 'Rented';
  lastServiceDate?: string;
  nextServiceDate?: string;
  lastServiceKm?: number;
  nextServiceKm?: number;
  additionalPhotos?: string[];
  
  // QEHS Compliance Checklist
  qehsInsurance: boolean;
  qehsRoadWorthy: boolean;
  qehsDriverLicence: boolean;
  qehsLoadSecurity: boolean;
  qehsFireExtinguisher: boolean;
  qehsFirstAid: boolean;
  qehsGpsTracker: boolean;
  qehsVehiclePhotoUrl: string;
  qehsDriverIdPhotoUrl: string;
  rejectionReason: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiryDate: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  assignedVehiclePlate?: string; // plateNumber of the vehicle they drive
  experienceYears?: number;
  photoUrl?: string;
  licensePhotoUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  projectManager: string;
  client: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Suspended';
  assignedSites: string[]; // siteIds
  budgetEtb?: number;
}

export interface ProjectSite {
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  town: string;
  projectScope: string;
  zoneManager: string;
  implementationPriority: 'High' | 'Medium' | 'Low';
  distance: number;
  geofenceZone: string; // Region NR, NER, NWR, etc.
  receiverName: string;
  receiverPhone: string;
  status: string;
}

export interface StoreCluster {
  id: string;
  name: string;
  code: string;
  assignedSites: string[]; // List of siteIds
  zone: string;
  estimatedTotalDistance: number;
  assignedSdt: string;
  notes: string;
}

export interface ItemCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  parentCategory?: string;
  status: 'Active' | 'Inactive';
}

export interface QuoteComparisonRow {
  supplierId: string;
  supplierName: string;
  truckType: string;
  routeZone: string;
  quotedPrice: number;
  budget: number;
  variance: number;
  variancePercent: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  vendorId?: string;
  priceBookEntryId?: string;
}

export interface ProfitabilityAnalysis {
  paNumber: string;
  mrRef: string;
  supplierId: string;
  date: string;
  quoteComparison: QuoteComparisonRow[];
  selectedSupplierId: string;
  workOrderNumber: string;
  issuedDate: string;
  specialInstructions: string;
  comment: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approverName?: string;
  approvalReference?: string;
  approvedTier?: string;
  approvalDocumentedDate?: string;
}

export interface IncidentLogEntry {
  id: string;
  timestamp: string; // ISO date-time
  user: string;
  action: string; // e.g. 'Case opened', 'Assigned to Security', 'Evidence added', 'Status changed to Resolved'
  comment?: string;
}

export interface Incident {
  id: string; // case number, e.g. INC-2026-001
  type: 'Theft' | 'Loss' | 'Damage' | 'Delay' | 'Route Deviation' | 'Compliance Breach' | 'Documentation Discrepancy';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Pending Evidence' | 'Resolved' | 'Closed';
  title: string;
  description: string;
  reportedBy: string;
  reportedDate: string;

  // Linkage to related records so investigators can trace context from one screen
  mrRef?: string;
  vehiclePlate?: string;
  driverId?: string;
  supplierId?: string;
  siteId?: string;

  assignedRole: 'Security' | 'Transport' | 'QEHS' | 'Supplier Focal' | 'Other';
  assignedTo: string;
  dueDate?: string;

  rootCause?: string;
  correctiveAction?: string;

  escalated: boolean;
  escalatedTo?: string;
  escalatedDate?: string;

  resolutionNotes?: string;
  closedBy?: string;
  closedDate?: string;

  // Chronological, append-only accountability log
  log: IncidentLogEntry[];
}

export interface DeliveryJob {
  mrRef: string;
  siteId: string;
  supplierId: string;
  truck: string;
  driver: string;
  status: 'Loading' | 'In transit' | 'Delivered' | 'Closed';
  
  // Timeline details
  loadingTime?: string;
  loadingPhotoUrl?: string;
  loadingConfirmed: boolean;
  
  inTransitGpsStatus?: string;
  inTransitEta?: string;
  
  deliveryTime?: string;
  deliveryPhotoUrl?: string;
  
  signedMrPhotoUrl?: string;
  signedMrConfirmed: boolean;
  supervisorUnavailable: boolean;
  escalationNote?: string;
  
  // Last mile
  lastMileRequired: boolean;
  lastMileApprovalStatus: 'Pending' | 'Approved' | 'Rejected';
  lastMileMethod: 'Labour' | 'Additional transport' | '';
  lastMileCost: number;
  lastMilePhotoUrl?: string;
}

export interface WccClosure {
  mrRef: string;
  docMrSigned: boolean;
  docDeliveryPhoto: boolean;
  docWorkOrderCopy: boolean;
  docGrn: boolean;
  docSupplierInvoice: boolean;
  basecampStatus: 'Active' | 'Closed on Basecamp' | string;
  poNumber: string;
  poAmount: number;
  supplierInvoiceAmount: number;
  poVariance: number;
  poVariancePercent: number;
  wccStatus: 'Not applied' | 'Applied' | 'Approved' | 'Rejected';
}

// --- GPS Tracking, Route Execution & Mobile Operations (FR-020 to FR-025) ---

export interface RouteCheckpoint {
  id: string;
  sequence: number;
  label: string;
  type: 'Warehouse' | 'Checkpoint' | 'Site' | 'Return';
  latitude: number;
  longitude: number;
  geofenceZone: string;
  plannedArrival?: string; // ISO date-time
}

export interface GeofenceEvent {
  id: string;
  timestamp: string; // ISO date-time
  checkpointId: string;
  checkpointLabel: string;
  geofenceZone: string;
  eventType: 'Entered' | 'Exited';
}

export interface TripAlert {
  id: string;
  timestamp: string; // ISO date-time
  type: 'Route Deviation' | 'Prolonged Stoppage' | 'Delayed Arrival' | 'Unauthorized Geofence Breach';
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedDate?: string;
}

export type TripMilestoneStatus =
  | 'Arrived at Warehouse'
  | 'Loaded'
  | 'En Route'
  | 'Arrived at Site'
  | 'Delivered'
  | 'Returned';

export interface TripMilestone {
  id: string;
  timestamp: string; // ISO date-time
  status: TripMilestoneStatus;
  user: string;
  note?: string;
  photoUrl?: string;
  offlineCaptured?: boolean; // recorded while device was offline, later synced
  synced: boolean;
}

export interface TripTracking {
  mrRef: string;
  vehiclePlate: string;
  driver: string;
  tripStatus: 'Not started' | 'Active' | 'Completed';
  connectivity: 'Online' | 'Offline';
  currentLat: number;
  currentLng: number;
  lastUpdateTime: string;
  lastCheckpointId: string; // most recently confirmed checkpoint on the planned route
  plannedRoute: RouteCheckpoint[];
  milestones: TripMilestone[];
  geofenceEvents: GeofenceEvent[];
  alerts: TripAlert[];
}

export interface SupplierQuotation {
  id: string;
  supplierId: string;
  supplierName: string;
  priceBookCode: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  workAnalysisId: string;
  mrRef: string;
}

// --- Item Tracking & POD ---

export type ItemTrackingStatus = 'Pending' | 'Loaded' | 'In Transit' | 'Delivered' | 'Partial' | 'Returned' | 'Missing' | 'Damaged';
export type ItemReconciliationStatus = 'Clear' | 'Open Case' | 'Resolved';

export interface ItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  itemGroup: string;
  barcode: string;
  serialNumber: string;
  uom: string;
  expectedQuantity: number;
  loadedQuantity: number;
  deliveredQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  status: ItemTrackingStatus;
  barcodeScanned?: boolean;
  serialVerified?: boolean;
}

export interface TransportRequestItem {
  tripId: string;
  mrRef: string;
  customer: string;
  originWarehouse: string;
  destination: string;
  itemGroup: string;
  totalItems: number;
  loadedQuantity: number;
  inTransitQuantity: number;
  deliveredQuantity: number;
  missingQuantity: number;
  damagedQuantity: number;
  returnedQuantity: number;
  deliveryStatus: 'Pending' | 'Loading' | 'In Transit' | 'Delivered' | 'Partial' | 'Exceptions';
  reconciliationStatus: ItemReconciliationStatus;
  items: ItemDetail[];
  
  // additional shipment details
  vehicle: string;
  driver: string;
  dispatchDate: string;
}

export interface LoadingConfirmationData {
  tripId: string;
  operatorName: string;
  operatorId: string;
  confirmationTime?: string;
  status: 'Draft' | 'Confirmed';
  notes: string;
}

