import {
  Supplier,
  Vehicle,
  ProjectSite,
  StoreCluster,
  ItemCategory,
  PriceBookEntry,
  PriceThresholdConfig,
  MR,
  WorkAnalysis,
  ProfitabilityAnalysis,
  DeliveryJob,
  WccClosure,
  Driver,
  SupplierQuotation,
  Incident,
  TripTracking
} from './types';

// Standard 12 Ethiopian Regions
export const ETHIOPIAN_REGIONS = [
  'NR', 'NER', 'NWR', 'WR', 'SWR', 'SSWR', 'CWRAA', 'CNR', 'ER', 'SER', 'SR', 'Somali'
];

export const TIM_STAFF = [
  'Yonas Berhe', 'Selamawit Kebede', 'Tewodros Kassaye', 'Aster Assefa', 'Daniel Hailu'
];

export const TL_STAFF = [
  'Solomon Tekle', 'Mulugeta Alene', 'Hana Worku', 'Kassahun Bekele', 'Biniyam Girma'
];

export const TRUCK_TYPES = [
  '3-ton', '5-ton', '7-ton', '10-ton', 'Trailer'
];

// 1. Item Categories
export const INITIAL_CATEGORIES: ItemCategory[] = [
  { id: 'cat-01', name: 'Antenna & RF Cables', code: 'RF-ANT', description: 'RF Cables, Antennas, Jumpers, and connectors', status: 'Active' },
  { id: 'cat-02', name: 'Microwave Equipment', code: 'MW-EQP', description: 'RTN ODU, IDU, and MW Dishes', status: 'Active' },
  { id: 'cat-03', name: 'Power & Battery Systems', code: 'PWR-BAT', description: 'Li-Ion Batteries, Rectifiers, and DC Cables', status: 'Active' },
  { id: 'cat-04', name: 'Steel & Tower Structure', code: 'TWR-STL', description: 'Tower members, brackets, and outdoor poles', status: 'Active' },
  { id: 'cat-05', name: 'Civil Works Material', code: 'CVL-MAT', description: 'Cement, aggregate, rebar, and earthing materials', status: 'Inactive' }
];

// 2. Project Sites
export const INITIAL_SITES: ProjectSite[] = [
  { siteId: 'ET-ADD-1024', siteName: 'Bole Medhanialem High', latitude: 9.0012, longitude: 38.7845, town: 'Addis Ababa', projectScope: 'LTE Expansion & MW Upgrade', zoneManager: 'Mulugeta Alene', implementationPriority: 'High', distance: 12, geofenceZone: 'CNR', receiverName: 'Abebe Kebede', receiverPhone: '+251911223344', status: 'Active' },
  { siteId: 'ET-ADD-1875', siteName: 'CMC Sunshine Area', latitude: 9.0156, longitude: 38.8312, town: 'Addis Ababa', projectScope: '5G Trial Greenfield Site', zoneManager: 'Mulugeta Alene', implementationPriority: 'High', distance: 22, geofenceZone: 'CNR', receiverName: 'Chala Gemechu', receiverPhone: '+251911556677', status: 'Active' },
  { siteId: 'ET-HAW-2041', siteName: 'Hawassa Industrial Park 2', latitude: 7.0543, longitude: 38.4812, town: 'Hawassa', projectScope: 'MW Link installation & swap', zoneManager: 'Kassahun Bekele', implementationPriority: 'Medium', distance: 275, geofenceZone: 'SR', receiverName: 'Tigist Shiferaw', receiverPhone: '+251922334455', status: 'Active' },
  { siteId: 'ET-DIR-3011', siteName: 'Dire Dawa Sabian High', latitude: 9.6124, longitude: 41.8541, town: 'Dire Dawa', projectScope: 'Batteries Backup Overhaul', zoneManager: 'Hana Worku', implementationPriority: 'Medium', distance: 450, geofenceZone: 'ER', receiverName: 'Mohammed Yusuf', receiverPhone: '+251933445566', status: 'Active' },
  { siteId: 'ET-BAH-0982', siteName: 'Bahir Dar Giyorgis', latitude: 11.5942, longitude: 37.3854, town: 'Bahir Dar', projectScope: 'Modernization RF Swap', zoneManager: 'Biniyam Girma', implementationPriority: 'High', distance: 565, geofenceZone: 'NWR', receiverName: 'Getachew Belay', receiverPhone: '+251944556677', status: 'Active' },
  { siteId: 'ET-GON-1432', siteName: 'Gondar Azezo Airport Road', latitude: 12.5512, longitude: 37.4321, town: 'Gondar', projectScope: 'LTE 1800 Capacity Add', zoneManager: 'Biniyam Girma', implementationPriority: 'Low', distance: 740, geofenceZone: 'NWR', receiverName: 'Almaz Tefera', receiverPhone: '+251955667788', status: 'Active' }
];

// 3. Store Clusters
export const INITIAL_CLUSTERS: StoreCluster[] = [
  { id: 'cl-01', name: 'Addis East Cluster', code: 'CL-ADD-E', assignedSites: ['ET-ADD-1024', 'ET-ADD-1875'], zone: 'CNR', estimatedTotalDistance: 34, assignedSdt: 'Yonas Berhe', notes: 'Serves East Addis sites with regular 3-ton shuttles.' },
  { id: 'cl-02', name: 'North West Corridor Cluster', code: 'CL-NW-CORR', assignedSites: ['ET-BAH-0982', 'ET-GON-1432'], zone: 'NWR', estimatedTotalDistance: 1305, assignedSdt: 'Aster Assefa', notes: 'High distance route. Requires 10-ton closed trucks with GPS verification.' }
];

// 4. Suppliers
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    name: 'Abyssinia Logistics Plc',
    tin: '0012489632',
    region: 'CNR',
    city: 'Addis Ababa',
    capitalCity: 'Addis Ababa',
    licenseNo: 'BL/AA/2024/9912',
    status: 'Active',
    rating: 92,
    address: 'Bole Road, Mega Building 5th Floor',
    phone: '+251116634522',
    email: 'info@abyssinialogistics.com',
    contactPerson: 'Zelalem Hailu',
    licenseExpiryDate: '2027-12-31',
    serviceQualityScore: 90,
    creditFacility: true,
    experienceWithAdiu: true,
    notes: 'Premium supplier for cross-country routes. Large fleet of 10-ton closed trucks and lowbed trailers.',
    perfCreditFacility: 20,
    perfProductQuality: 18,
    perfServiceQuality: 18,
    perfAvailability: 18,
    perfExperienceWithAdiu: 18
  },
  {
    id: 'sup-02',
    name: 'Lucy Freight & Transit Plc',
    tin: '0098551241',
    region: 'ER',
    city: 'Adama',
    capitalCity: 'Adama',
    licenseNo: 'BL/OR/2023/18412',
    status: 'Active',
    rating: 84,
    address: 'Adama Express Highway Exit, Block C',
    phone: '+251221114592',
    email: 'contact@lucyfreight.com',
    contactPerson: 'Sintayehu Tesfaye',
    licenseExpiryDate: '2026-09-30',
    serviceQualityScore: 82,
    creditFacility: true,
    experienceWithAdiu: true,
    notes: 'Specializes in Eastern routes (Adama, Dire Dawa, Harar). Excellent dispatch times.',
    perfCreditFacility: 20,
    perfProductQuality: 15,
    perfServiceQuality: 16,
    perfAvailability: 17,
    perfExperienceWithAdiu: 16
  },
  {
    id: 'sup-03',
    name: 'Danakil Transport Services',
    tin: '0104882195',
    region: 'Somali',
    city: 'Jijiga',
    capitalCity: 'Jijiga',
    licenseNo: 'BL/SOM/2025/1102',
    status: 'Active',
    rating: 76,
    address: 'Jijiga Main Road near Commercial Bank',
    phone: '+251257790124',
    email: 'danakiltrans@gmail.com',
    contactPerson: 'Bashir Ahmed',
    licenseExpiryDate: '2027-01-15',
    serviceQualityScore: 78,
    creditFacility: false,
    experienceWithAdiu: true,
    notes: 'Provides secure escort coordination in difficult desert terrains.',
    perfCreditFacility: 10,
    perfProductQuality: 16,
    perfServiceQuality: 15,
    perfAvailability: 15,
    perfExperienceWithAdiu: 20
  }
];

// 5. Price Book Entries
export const INITIAL_PRICE_BOOK: PriceBookEntry[] = [
  { id: 'pb-01', code: 'PB-3T-CNR', itemDescription: '3-Ton Truck Flat Rate CNR Zone (Addis Ababa)', unit: 'Trip', unitPrice: 8500, effectiveDate: '2026-01-01', expiryDate: '2026-12-31', status: 'Active', supplierId: 'sup-01', itemCategoryId: 'cat-01', remark: 'Standard local trip rate' },
  { id: 'pb-02', code: 'PB-5T-CNR', itemDescription: '5-Ton Truck Flat Rate CNR Zone (Addis Ababa)', unit: 'Trip', unitPrice: 12500, effectiveDate: '2026-01-01', expiryDate: '2026-12-31', status: 'Active', supplierId: 'sup-01', itemCategoryId: 'cat-01', remark: 'Standard local trip rate' },
  { id: 'pb-03', code: 'PB-10T-CNR', itemDescription: '10-Ton Truck Flat Rate CNR Zone (Addis Ababa)', unit: 'Trip', unitPrice: 24000, effectiveDate: '2026-01-01', expiryDate: '2026-12-31', status: 'Active', supplierId: 'sup-01', itemCategoryId: 'cat-01', remark: 'Standard local trip rate' },
  { id: 'pb-04', code: 'PB-10T-NWR', itemDescription: '10-Ton Cross-Country Route CNR-NWR (Addis to Bahir Dar)', unit: 'Trip', unitPrice: 78000, effectiveDate: '2026-02-01', expiryDate: '2026-12-31', status: 'Active', supplierId: 'sup-01', itemCategoryId: 'cat-02', remark: 'Asphalt road route' },
  { id: 'pb-05', code: 'PB-10T-ER', itemDescription: '10-Ton Cross-Country Route CNR-ER (Addis to Dire Dawa)', unit: 'Trip', unitPrice: 62000, effectiveDate: '2026-02-01', expiryDate: '2026-12-31', status: 'Active', supplierId: 'sup-02', itemCategoryId: 'cat-02', remark: 'Expressway inclusive' },
  { id: 'pb-06', code: '350000142584', itemDescription: 'Cherrypicker', unit: 'Site', unitPrice: 28685.42, effectiveDate: '2026-01-01', expiryDate: '2026-12-31', status: 'Active', supplierId: 'sup-01', itemCategoryId: 'cat-01', remark: 'Daily equipment rental rate' }
];

export const INITIAL_PRICE_CONFIGS: PriceThresholdConfig[] = [
  { supplierId: 'sup-01', thresholdAmount: 150000, alertThresholdPercent: 12 },
  { supplierId: 'sup-02', thresholdAmount: 100000, alertThresholdPercent: 10 }
];

// 6. Vehicles
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    plateNumber: 'ET-3-A98412',
    supplierId: 'sup-01',
    tonCapacity: 10,
    ageCategory: '0-5 yrs',
    model: 'Sino Truck Hohan 2022',
    lastQehsCheck: '2026-05-15',
    status: 'Compliant',
    driverName: 'Elias Teklu',
    driverId: 'DL-8914562',
    driverPhone: '+251911998877',
    assignedRoute: 'Addis to Bahir Dar',
    qehsInsurance: true,
    qehsRoadWorthy: true,
    qehsDriverLicence: true,
    qehsLoadSecurity: true,
    qehsFireExtinguisher: true,
    qehsFirstAid: true,
    qehsGpsTracker: true,
    qehsVehiclePhotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
    qehsDriverIdPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    rejectionReason: ''
  },
  {
    plateNumber: 'ET-3-B10423',
    supplierId: 'sup-02',
    tonCapacity: 5,
    ageCategory: '6-10 yrs',
    model: 'Isuzu FSR 2018',
    lastQehsCheck: '2026-06-01',
    status: 'Compliant',
    driverName: 'Kebede Haile',
    driverId: 'DL-9041285',
    driverPhone: '+251920112233',
    assignedRoute: 'Addis to Adama',
    qehsInsurance: true,
    qehsRoadWorthy: true,
    qehsDriverLicence: true,
    qehsLoadSecurity: true,
    qehsFireExtinguisher: true,
    qehsFirstAid: false,
    qehsGpsTracker: true,
    qehsVehiclePhotoUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400',
    qehsDriverIdPhotoUrl: '',
    rejectionReason: ''
  },
  {
    plateNumber: 'ET-3-C88145',
    supplierId: 'sup-03',
    tonCapacity: 3,
    ageCategory: '10+ yrs',
    model: 'Toyota Dyna 2012',
    lastQehsCheck: '2026-02-12',
    status: 'Non-compliant',
    driverName: 'Mustefa Hassen',
    driverId: 'DL-1102941',
    driverPhone: '+251915667788',
    assignedRoute: 'Jijiga Town Deliveries',
    qehsInsurance: true,
    qehsRoadWorthy: false,
    qehsDriverLicence: true,
    qehsLoadSecurity: false,
    qehsFireExtinguisher: false,
    qehsFirstAid: false,
    qehsGpsTracker: false,
    qehsVehiclePhotoUrl: '',
    qehsDriverIdPhotoUrl: '',
    rejectionReason: 'Expired road-worthy certificate, missing mandatory fire extinguisher and first aid kit. GPS tracker not fitted.'
  }
];

// 7. MR Requests (Material Transport Requests)
export const INITIAL_MRS: MR[] = [
  {
    mrNumber: 'MR-2026-0412',
    poNumber: 'PO-99124018',
    vendorClient: 'Ethio Telecom / Ericsson',
    requestDate: '2026-06-20',
    handoverDate: '2026-06-22',
    assignedTim: 'Yonas Berhe',
    assignedTl: 'Solomon Tekle',
    notes: 'Critical site upgrade for Bole Medhanialem High. Deliveries should be coordinated carefully with the local civil engineering subcontractor.',
    status: 'Approved',
    lineItems: [
      {
        id: 'li-01',
        siteId: 'ET-ADD-1024',
        siteName: 'Bole Medhanialem High',
        latitude: 9.0012,
        longitude: 38.7845,
        mwLinks: '4.5G LTE Link',
        town: 'Addis Ababa',
        projectScope: 'LTE Expansion & MW Upgrade',
        zoneManager: 'Mulugeta Alene',
        implementationPriority: 'High',
        distance: 12,
        truck: '3-ton',
        itemCategory: 'RF-ANT'
      }
    ],
    circleName: 'SER',
    warehouseName: 'Akaki Warehouse Network-6',
    requestArrivedSiteTime: '2026-06-28',
    subcontractor: 'ZTE',
    submitterName: 'Abraham Aydere',
    submitterTitle: 'Roll-Out Manager',
    submitterCompany: 'ZTE',
    siteAddress: '244856',
    requisitionItems: [
      {
        id: 'req-li-1',
        packageName: '150Ah LiFe Battery',
        packageDescription: '150Ah LiFe Battery',
        bomCode: '180000513847',
        description: 'ZXESM R421 R02M01 Lithium-ion Battery',
        etItemCode: 'PW03.05603',
        quantity: 4,
        uom: 'KIT',
        remarksBoq: ''
      },
      {
        id: 'req-li-2',
        packageName: '150Ah LiFe Battery',
        packageDescription: '150Ah LiFe Battery',
        bomCode: '180000011452',
        description: 'H07V-K&RV Red 1x25mm2 Wire(VDE/CE/CCC)',
        etItemCode: 'PW03.05741',
        quantity: 8,
        uom: 'm',
        remarksBoq: ''
      },
      {
        id: 'req-li-3',
        packageName: '150Ah LiFe Battery',
        packageDescription: '150Ah LiFe Battery',
        bomCode: '180000011455',
        description: 'H07V-K&RV Blue 1x25mm2 Wire(VDE/CE/CCC)',
        etItemCode: 'NW16.00916',
        quantity: 8,
        uom: 'm',
        remarksBoq: ''
      },
      {
        id: 'req-li-4',
        packageName: 'M43 Fullrack',
        packageDescription: 'M43 Full Rack',
        bomCode: '180000210112',
        description: 'ZXDUPA-RS485 Cable 10m',
        etItemCode: 'PW05.03005',
        quantity: 1,
        uom: 'PCS',
        remarksBoq: ''
      },
      {
        id: 'req-li-5',
        packageName: 'M43 Fullrack',
        packageDescription: 'M43 Full Rack',
        bomCode: '180000011450',
        description: '16sq.mm bare connecting terminal',
        etItemCode: 'PW03.02793',
        quantity: 4,
        uom: 'PCS',
        remarksBoq: ''
      },
      {
        id: 'req-li-6',
        packageName: 'M43 Fullrack',
        packageDescription: 'M43 Full Rack',
        bomCode: '180000011456',
        description: '25sq.mm bare connecting terminal',
        etItemCode: 'PW03.02792',
        quantity: 20,
        uom: 'PCS',
        remarksBoq: ''
      },
      {
        id: 'req-li-7',
        packageName: 'ZXD 4000 Rectifiers',
        packageDescription: 'ZXEPS R4875F1 Rectifier',
        bomCode: '180000491044',
        description: 'ZXEPS R4875F1 Rectifier',
        etItemCode: 'PW05.01312',
        quantity: 4,
        uom: 'KIT',
        remarksBoq: ''
      },
      {
        id: 'req-li-8',
        packageName: 'Site Survey Auxiliary Material',
        packageDescription: 'ZXDTXN E001-Install',
        bomCode: '180000503201',
        description: 'Communication Power System Site Survey Auxiliary Material',
        etItemCode: '',
        quantity: 1,
        uom: 'KIT',
        remarksBoq: '1 Box'
      }
    ]
  },
  {
    mrNumber: 'MR-2026-0413',
    poNumber: 'PO-99124019',
    vendorClient: 'Safaricom Ethiopia',
    requestDate: '2026-06-22',
    handoverDate: '2026-06-24',
    assignedTim: 'Aster Assefa',
    assignedTl: 'Biniyam Girma',
    notes: 'Bahir Dar Giyorgis swap requirements. Extreme care for MW dishes.',
    status: 'Delivered',
    lineItems: [
      {
        id: 'li-02',
        siteId: 'ET-BAH-0982',
        siteName: 'Bahir Dar Giyorgis',
        latitude: 11.5942,
        longitude: 37.3854,
        mwLinks: 'MW Dish 0.6m + ODU',
        town: 'Bahir Dar',
        projectScope: 'Modernization RF Swap',
        zoneManager: 'Biniyam Girma',
        implementationPriority: 'High',
        distance: 565,
        truck: '10-ton',
        itemCategory: 'MW-EQP'
      }
    ]
  },
  {
    mrNumber: 'MR-2026-0414',
    poNumber: 'PO-99124020',
    vendorClient: 'Ethio Telecom',
    requestDate: '2026-06-25',
    handoverDate: '2026-06-28',
    assignedTim: 'Daniel Hailu',
    assignedTl: 'Hana Worku',
    notes: 'Power backup overhaul at Dire Dawa Sabian High.',
    status: 'Received',
    lineItems: [
      {
        id: 'li-03',
        siteId: 'ET-DIR-3011',
        siteName: 'Dire Dawa Sabian High',
        latitude: 9.6124,
        longitude: 41.8541,
        mwLinks: 'None',
        town: 'Dire Dawa',
        projectScope: 'Batteries Backup Overhaul',
        zoneManager: 'Hana Worku',
        implementationPriority: 'Medium',
        distance: 450,
        truck: '10-ton',
        itemCategory: 'PWR-BAT'
      }
    ]
  }
];

// 8. Work Analysis
export const INITIAL_WORK_ANALYSIS: WorkAnalysis[] = [
  {
    id: 'WA-2026-0091',
    mrRef: 'MR-2026-0412',
    date: '2026-06-21',
    preparedBy: 'Solomon Tekle',
    sites: [
      {
        id: 'was-01',
        siteId: 'ET-ADD-1024',
        siteName: 'Bole Medhanialem High',
        latitude: 9.0012,
        longitude: 38.7845,
        mwLinks: '4.5G LTE Link',
        town: 'Addis Ababa',
        projectScope: 'LTE Expansion & MW Upgrade',
        zoneManager: 'Mulugeta Alene',
        implementationPriority: 'High',
        distance: 12,
        recommendedTruck: '3-ton'
      }
    ],
    truckTypeRecommended: '3-ton',
    totalSites: 1,
    totalDistance: 12,
    estimatedTrips: 1,
    specialRequirements: ['Last-mile labour'],
    keyRisks: 'Congested area near Bole Medhanialem. Unloading can only take place during off-peak hours or at night to avoid municipal traffic citations.',
    scopeNegotiationNotes: 'Negotiated with local site manager to allow nighttime delivery (8 PM - 11 PM). Off-loading team will be standing by.',
    validatedBy: 'Yonas Berhe',
    validationDate: '2026-06-21',
    status: 'Validated'
  },
  {
    id: 'WA-2026-0092',
    mrRef: 'MR-2026-0413',
    date: '2026-06-23',
    preparedBy: 'Biniyam Girma',
    sites: [
      {
        id: 'was-02',
        siteId: 'ET-BAH-0982',
        siteName: 'Bahir Dar Giyorgis',
        latitude: 11.5942,
        longitude: 37.3854,
        mwLinks: 'MW Dish 0.6m + ODU',
        town: 'Bahir Dar',
        projectScope: 'Modernization RF Swap',
        zoneManager: 'Biniyam Girma',
        implementationPriority: 'High',
        distance: 565,
        recommendedTruck: '10-ton'
      }
    ],
    truckTypeRecommended: '10-ton',
    totalSites: 1,
    totalDistance: 565,
    estimatedTrips: 1,
    specialRequirements: ['Security escort'],
    keyRisks: 'Long distance travel, security checks in intermediate zones.',
    scopeNegotiationNotes: 'Requires police security escort clearing on the Blue Nile route section.',
    validatedBy: 'Aster Assefa',
    validationDate: '2026-06-23',
    status: 'Validated'
  }
];

// 9. Profitability Analysis
export const INITIAL_PAS: ProfitabilityAnalysis[] = [
  {
    paNumber: 'PA-2026-0210',
    mrRef: 'MR-2026-0412',
    supplierId: 'sup-01',
    date: '2026-06-21',
    quoteComparison: [
      { supplierId: 'sup-01', supplierName: 'Abyssinia Logistics Plc', truckType: '3-ton', routeZone: 'CNR', quotedPrice: 8500, budget: 9000, variance: -500, variancePercent: -5.5, status: 'Approved' },
      { supplierId: 'sup-02', supplierName: 'Lucy Freight & Transit Plc', truckType: '3-ton', routeZone: 'CNR', quotedPrice: 9500, budget: 9000, variance: 500, variancePercent: 5.5, status: 'Pending' }
    ],
    selectedSupplierId: 'sup-01',
    workOrderNumber: 'WO-2026-8801',
    issuedDate: '2026-06-21',
    specialInstructions: 'Ensure driver completes the QEHS checklist prior to loading. Night delivery protocol approved.',
    comment: 'Abyssinia offered competitive rates within our standard budget for Bole.',
    approvalStatus: 'Approved'
  },
  {
    paNumber: 'PA-2026-0211',
    mrRef: 'MR-2026-0413',
    supplierId: 'sup-01',
    date: '2026-06-23',
    quoteComparison: [
      { supplierId: 'sup-01', supplierName: 'Abyssinia Logistics Plc', truckType: '10-ton', routeZone: 'NWR', quotedPrice: 78000, budget: 75000, variance: 3000, variancePercent: 4.0, status: 'Approved' },
      { supplierId: 'sup-02', supplierName: 'Lucy Freight & Transit Plc', truckType: '10-ton', routeZone: 'NWR', quotedPrice: 82000, budget: 75000, variance: 7000, variancePercent: 9.3, status: 'Rejected' }
    ],
    selectedSupplierId: 'sup-01',
    workOrderNumber: 'WO-2026-8802',
    issuedDate: '2026-06-23',
    specialInstructions: 'Blue Nile crossing security escort mandatory. GPS location should be reported every 4 hours.',
    comment: 'Quote is 4% negative variance which requires TL & TIM validation. Approved due to security escort coordination capability.',
    approvalStatus: 'Approved'
  }
];

// 10. Deliveries
export const INITIAL_DELIVERIES: DeliveryJob[] = [
  {
    mrRef: 'MR-2026-0412',
    siteId: 'ET-ADD-1024',
    supplierId: 'sup-01',
    truck: 'ET-3-A98412 (10-Ton)',
    driver: 'Elias Teklu (+251911998877)',
    status: 'In transit',
    loadingTime: '2026-06-25T14:30:00Z',
    loadingPhotoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400',
    loadingConfirmed: true,
    inTransitGpsStatus: 'GPS Signal Active: Currently near Meskel Square, Addis Ababa',
    inTransitEta: '2026-06-26T20:30:00Z',
    signedMrConfirmed: false,
    supervisorUnavailable: false,
    lastMileRequired: true,
    lastMileApprovalStatus: 'Approved',
    lastMileMethod: 'Labour',
    lastMileCost: 2500,
    lastMilePhotoUrl: 'https://images.unsplash.com/photo-1521791136368-1a46827d0adb?auto=format&fit=crop&q=80&w=400'
  },
  {
    mrRef: 'MR-2026-0413',
    siteId: 'ET-BAH-0982',
    supplierId: 'sup-01',
    truck: 'ET-3-A98412 (10-Ton)',
    driver: 'Elias Teklu (+251911998877)',
    status: 'Delivered',
    loadingTime: '2026-06-23T08:00:00Z',
    loadingPhotoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400',
    loadingConfirmed: true,
    inTransitGpsStatus: 'Off',
    inTransitEta: 'Delivered',
    deliveryTime: '2026-06-24T17:45:00Z',
    deliveryPhotoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400',
    signedMrPhotoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
    signedMrConfirmed: true,
    supervisorUnavailable: false,
    lastMileRequired: false,
    lastMileApprovalStatus: 'Pending',
    lastMileMethod: '',
    lastMileCost: 0
  }
];

// 10b. GPS Tracking, Route Execution & Mobile Operations (FR-020 to FR-025)
export const INITIAL_TRACKING: TripTracking[] = [
  {
    mrRef: 'MR-2026-0412',
    vehiclePlate: 'ET-3-A98412',
    driver: 'Elias Teklu (+251911998877)',
    tripStatus: 'Active',
    connectivity: 'Online',
    currentLat: 9.0107,
    currentLng: 38.7613,
    lastUpdateTime: '2026-06-26T09:42:00Z',
    lastCheckpointId: 'cp-412-2',
    plannedRoute: [
      { id: 'cp-412-1', sequence: 1, label: 'Addis Ababa Central Warehouse', type: 'Warehouse', latitude: 9.0192, longitude: 38.7525, geofenceZone: 'CNR', plannedArrival: '2026-06-25T14:00:00Z' },
      { id: 'cp-412-2', sequence: 2, label: 'Meskel Square Route Checkpoint', type: 'Checkpoint', latitude: 9.0107, longitude: 38.7613, geofenceZone: 'CNR', plannedArrival: '2026-06-25T15:30:00Z' },
      { id: 'cp-412-3', sequence: 3, label: 'Debre Berhan Route Checkpoint', type: 'Checkpoint', latitude: 9.6788, longitude: 39.5306, geofenceZone: 'NER', plannedArrival: '2026-06-25T18:30:00Z' },
      { id: 'cp-412-4', sequence: 4, label: 'Bahir Dar Giyorgis Site', type: 'Site', latitude: 11.5942, longitude: 37.3854, geofenceZone: 'NWR', plannedArrival: '2026-06-26T20:30:00Z' }
    ],
    milestones: [
      { id: 'ms-412-1', timestamp: '2026-06-25T14:05:00Z', status: 'Arrived at Warehouse', user: 'Elias Teklu', note: 'Truck staged at bay 3.', synced: true },
      { id: 'ms-412-2', timestamp: '2026-06-25T14:30:00Z', status: 'Loaded', user: 'Elias Teklu', note: 'Full load per MR line items, tarpaulin secured.', photoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400', synced: true },
      { id: 'ms-412-3', timestamp: '2026-06-25T14:45:00Z', status: 'En Route', user: 'Elias Teklu', note: 'Departed warehouse toward Bahir Dar corridor.', synced: true }
    ],
    geofenceEvents: [
      { id: 'gf-412-1', timestamp: '2026-06-25T14:05:00Z', checkpointId: 'cp-412-1', checkpointLabel: 'Addis Ababa Central Warehouse', geofenceZone: 'CNR', eventType: 'Entered' },
      { id: 'gf-412-2', timestamp: '2026-06-25T14:45:00Z', checkpointId: 'cp-412-1', checkpointLabel: 'Addis Ababa Central Warehouse', geofenceZone: 'CNR', eventType: 'Exited' },
      { id: 'gf-412-3', timestamp: '2026-06-25T15:28:00Z', checkpointId: 'cp-412-2', checkpointLabel: 'Meskel Square Route Checkpoint', geofenceZone: 'CNR', eventType: 'Entered' }
    ],
    alerts: [
      {
        id: 'al-412-1',
        timestamp: '2026-06-26T09:40:00Z',
        type: 'Route Deviation',
        message: 'Vehicle ET-3-A98412 is approximately 6.4 km off the planned Debre Berhan corridor for 22 minutes.',
        acknowledged: false
      }
    ]
  },
  {
    mrRef: 'MR-2026-0413',
    vehiclePlate: 'ET-3-A98412',
    driver: 'Elias Teklu (+251911998877)',
    tripStatus: 'Completed',
    connectivity: 'Online',
    currentLat: 11.5942,
    currentLng: 37.3854,
    lastUpdateTime: '2026-06-24T17:45:00Z',
    lastCheckpointId: 'cp-413-3',
    plannedRoute: [
      { id: 'cp-413-1', sequence: 1, label: 'Addis Ababa Central Warehouse', type: 'Warehouse', latitude: 9.0192, longitude: 38.7525, geofenceZone: 'CNR', plannedArrival: '2026-06-23T08:00:00Z' },
      { id: 'cp-413-2', sequence: 2, label: 'Debre Berhan Route Checkpoint', type: 'Checkpoint', latitude: 9.6788, longitude: 39.5306, geofenceZone: 'NER', plannedArrival: '2026-06-23T11:30:00Z' },
      { id: 'cp-413-3', sequence: 3, label: 'Bahir Dar Giyorgis Site', type: 'Site', latitude: 11.5942, longitude: 37.3854, geofenceZone: 'NWR', plannedArrival: '2026-06-24T17:00:00Z' }
    ],
    milestones: [
      { id: 'ms-413-1', timestamp: '2026-06-23T07:55:00Z', status: 'Arrived at Warehouse', user: 'Elias Teklu', synced: true },
      { id: 'ms-413-2', timestamp: '2026-06-23T08:00:00Z', status: 'Loaded', user: 'Elias Teklu', photoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400', synced: true },
      { id: 'ms-413-3', timestamp: '2026-06-23T08:15:00Z', status: 'En Route', user: 'Elias Teklu', synced: true },
      { id: 'ms-413-4', timestamp: '2026-06-24T17:20:00Z', status: 'Arrived at Site', user: 'Elias Teklu', note: 'Checked in with site receiver Getachew Belay.', offlineCaptured: true, synced: true },
      { id: 'ms-413-5', timestamp: '2026-06-24T17:45:00Z', status: 'Delivered', user: 'Elias Teklu', photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400', synced: true }
    ],
    geofenceEvents: [
      { id: 'gf-413-1', timestamp: '2026-06-23T07:55:00Z', checkpointId: 'cp-413-1', checkpointLabel: 'Addis Ababa Central Warehouse', geofenceZone: 'CNR', eventType: 'Entered' },
      { id: 'gf-413-2', timestamp: '2026-06-23T08:15:00Z', checkpointId: 'cp-413-1', checkpointLabel: 'Addis Ababa Central Warehouse', geofenceZone: 'CNR', eventType: 'Exited' },
      { id: 'gf-413-3', timestamp: '2026-06-24T17:18:00Z', checkpointId: 'cp-413-3', checkpointLabel: 'Bahir Dar Giyorgis Site', geofenceZone: 'NWR', eventType: 'Entered' }
    ],
    alerts: [
      {
        id: 'al-413-1',
        timestamp: '2026-06-23T13:10:00Z',
        type: 'Prolonged Stoppage',
        message: 'Vehicle ET-3-A98412 stationary near Debre Berhan checkpoint for 48 minutes without status update.',
        acknowledged: true,
        acknowledgedBy: 'Solomon Tekle',
        acknowledgedDate: '2026-06-23T13:25:00Z'
      }
    ]
  }
];

// 11. WCC & Closure
export const INITIAL_WCC_CLOSURES: WccClosure[] = [
  {
    mrRef: 'MR-2026-0413',
    docMrSigned: true,
    docDeliveryPhoto: true,
    docWorkOrderCopy: true,
    docGrn: true,
    docSupplierInvoice: true,
    basecampStatus: 'Closed on Basecamp',
    poNumber: 'PO-99124019',
    poAmount: 78000,
    supplierInvoiceAmount: 78000,
    poVariance: 0,
    poVariancePercent: 0,
    wccStatus: 'Approved'
  },
  {
    mrRef: 'MR-2026-0412',
    docMrSigned: false,
    docDeliveryPhoto: true,
    docWorkOrderCopy: true,
    docGrn: false,
    docSupplierInvoice: false,
    basecampStatus: 'Active',
    poNumber: 'PO-99124018',
    poAmount: 8500,
    supplierInvoiceAmount: 8500,
    poVariance: 0,
    poVariancePercent: 0,
    wccStatus: 'Not applied'
  }
];

// 12. Drivers
export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'DL-8914562',
    name: 'Elias Teklu',
    phone: '+251911998877',
    licenseNumber: 'L-ET-8914562',
    licenseClass: 'Dry Cargo (Grade 3)',
    licenseExpiryDate: '2028-11-20',
    status: 'Active',
    assignedVehiclePlate: 'ET-3-A98412',
    experienceYears: 6,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'DL-9041285',
    name: 'Kebede Haile',
    phone: '+251920112233',
    licenseNumber: 'L-ET-9041285',
    licenseClass: 'Dry Cargo (Grade 5)',
    licenseExpiryDate: '2027-04-15',
    status: 'Active',
    assignedVehiclePlate: 'ET-3-B10423',
    experienceYears: 12,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'DL-1102941',
    name: 'Mustefa Hassen',
    phone: '+251915667788',
    licenseNumber: 'L-ET-1102941',
    licenseClass: 'Dry Cargo (Grade 3)',
    licenseExpiryDate: '2026-09-10',
    status: 'Active',
    assignedVehiclePlate: 'ET-3-C88145',
    experienceYears: 4,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400'
  }
];

export const INITIAL_PROJECTS = [
  {
    id: 'prj-zte-north',
    name: 'ZTE LTE Expansion North Region',
    code: 'PRJ-ZTE-2026-N',
    projectManager: 'Mustefa Kemal',
    client: 'Ethio Telecom / ZTE',
    status: 'Active' as const,
    assignedSites: ['ET-BAH-0982'],
    budgetEtb: 1500000
  },
  {
    id: 'prj-et-central',
    name: 'Ethio Telecom Central Fiber Overhaul',
    code: 'PRJ-ET-2026-C',
    projectManager: 'Solomon Tekle',
    client: 'Ethio Telecom',
    status: 'Active' as const,
    assignedSites: ['ET-ADD-1024'],
    budgetEtb: 2800000
  }
];

export const INITIAL_QUOTATIONS: SupplierQuotation[] = [
  {
    id: 'q-01',
    supplierId: 'sup-01',
    supplierName: 'Abyssinia Logistics Plc',
    priceBookCode: 'PB-3T-CNR',
    itemDescription: '3-Ton Truck Flat Rate CNR Zone (Addis Ababa)',
    quantity: 1,
    unitPrice: 8500,
    totalPrice: 8500,
    workAnalysisId: 'WA-2026-0091',
    mrRef: 'MR-2026-0412'
  },
  {
    id: 'q-02',
    supplierId: 'sup-02',
    supplierName: 'Lucy Freight & Transit Plc',
    priceBookCode: 'PB-5T-CNR',
    itemDescription: '5-Ton Truck Flat Rate CNR Zone (Addis Ababa)',
    quantity: 1,
    unitPrice: 12500,
    totalPrice: 12500,
    workAnalysisId: 'WA-2026-0091',
    mrRef: 'MR-2026-0412'
  },
  {
    id: 'q-03',
    supplierId: 'sup-03',
    supplierName: 'Danakil Transport Services',
    priceBookCode: 'CUSTOM-01',
    itemDescription: '3-Ton Truck Flat Rate Custom Service',
    quantity: 1,
    unitPrice: 10000,
    totalPrice: 10000,
    workAnalysisId: 'WA-2026-0091',
    mrRef: 'MR-2026-0412'
  },
  {
    id: 'q-04',
    supplierId: 'sup-01',
    supplierName: 'Abyssinia Logistics Plc',
    priceBookCode: 'PB-10T-NWR',
    itemDescription: '10-Ton Cross-Country Route CNR-NWR (Addis to Bahir Dar)',
    quantity: 1,
    unitPrice: 78000,
    totalPrice: 78000,
    workAnalysisId: 'WA-2026-0092',
    mrRef: 'MR-2026-0413'
  },
  {
    id: 'q-05',
    supplierId: 'sup-02',
    supplierName: 'Lucy Freight & Transit Plc',
    priceBookCode: 'CUSTOM-02',
    itemDescription: '10-Ton Cross-Country Custom NWR Route',
    quantity: 1,
    unitPrice: 82000,
    totalPrice: 82000,
    workAnalysisId: 'WA-2026-0092',
    mrRef: 'MR-2026-0413'
  },
  {
    id: 'q-06',
    supplierId: 'sup-03',
    supplierName: 'Danakil Transport Services',
    priceBookCode: 'CUSTOM-03',
    itemDescription: '10-Ton Cross-Country Desert Route',
    quantity: 1,
    unitPrice: 85000,
    totalPrice: 85000,
    workAnalysisId: 'WA-2026-0092',
    mrRef: 'MR-2026-0413'
  }
];


// 15. Incident Management — theft, loss, damage, delay, deviation, compliance, and documentation cases
export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-001',
    type: 'Damage',
    severity: 'High',
    status: 'In Progress',
    title: 'Cracked equipment casing found at delivery',
    description: 'Two units in the consignment arrived with visible casing damage. Driver reports rough road conditions near Debre Markos as a possible cause.',
    reportedBy: 'Aster Assefa',
    reportedDate: '2026-06-18',
    mrRef: 'MR-2026-0413',
    vehiclePlate: 'ET-3-A98412',
    driverId: 'DL-8914562',
    supplierId: 'sup-01',
    siteId: 'ET-BAH-0982',
    assignedRole: 'QEHS',
    assignedTo: 'Yonas Berhe',
    dueDate: '2026-06-25',
    rootCause: '',
    correctiveAction: '',
    escalated: false,
    escalatedTo: '',
    escalatedDate: '',
    resolutionNotes: '',
    closedBy: '',
    closedDate: '',
    log: [
      { id: 'log-001-1', timestamp: '2026-06-18T09:12:00', user: 'Aster Assefa', action: 'Case opened', comment: 'Damage discrepancy flagged during item confirmation at site.' },
      { id: 'log-001-2', timestamp: '2026-06-18T11:40:00', user: 'Yonas Berhe', action: 'Assigned to QEHS', comment: 'Requesting vehicle load-securing inspection.' },
      { id: 'log-001-3', timestamp: '2026-06-19T08:05:00', user: 'Yonas Berhe', action: 'Status changed to In Progress', comment: 'Photos of damaged casing requested from SDT.' }
    ]
  },
  {
    id: 'INC-2026-002',
    type: 'Theft',
    severity: 'Critical',
    status: 'Open',
    title: 'Missing item units after warehouse staging',
    description: '3 pack units recorded at staging are unaccounted for at loading confirmation. No forced-entry evidence at warehouse yet reviewed.',
    reportedBy: 'Selamawit Kebede',
    reportedDate: '2026-07-02',
    mrRef: 'MR-2026-0412',
    vehiclePlate: 'ET-3-B10423',
    driverId: 'DL-9041285',
    supplierId: 'sup-02',
    siteId: 'ET-ADD-1024',
    assignedRole: 'Security',
    assignedTo: 'Security Duty Officer',
    dueDate: '2026-07-05',
    rootCause: '',
    correctiveAction: '',
    escalated: true,
    escalatedTo: 'ST&PIM Manager',
    escalatedDate: '2026-07-02',
    resolutionNotes: '',
    closedBy: '',
    closedDate: '',
    log: [
      { id: 'log-002-1', timestamp: '2026-07-02T14:20:00', user: 'Selamawit Kebede', action: 'Case opened', comment: 'Quantity mismatch found during loading confirmation against validated MR.' },
      { id: 'log-002-2', timestamp: '2026-07-02T14:45:00', user: 'Selamawit Kebede', action: 'Escalated to ST&PIM Manager', comment: 'Critical severity — possible theft, escalated per policy.' },
      { id: 'log-002-3', timestamp: '2026-07-02T16:00:00', user: 'Security Duty Officer', action: 'Assigned to Security', comment: 'Warehouse CCTV footage requested for the staging window.' }
    ]
  },
  {
    id: 'INC-2026-003',
    type: 'Compliance Breach',
    severity: 'Medium',
    status: 'Resolved',
    title: 'Vehicle dispatched with expired road-worthy certificate',
    description: 'QEHS review found the assigned vehicle had an expired road-worthy certificate at the point of dispatch readiness check.',
    reportedBy: 'Yonas Berhe',
    reportedDate: '2026-05-20',
    vehiclePlate: 'ET-3-C88145',
    driverId: 'DL-1102941',
    supplierId: 'sup-03',
    assignedRole: 'QEHS',
    assignedTo: 'Yonas Berhe',
    dueDate: '2026-05-27',
    rootCause: 'Supplier fleet document renewal was not tracked before assignment.',
    correctiveAction: 'Vehicle rejected and returned to assignment pool; supplier required to submit renewed certificate before future dispatch.',
    escalated: false,
    escalatedTo: '',
    escalatedDate: '',
    resolutionNotes: 'Vehicle blocked from dispatch; replacement vehicle sourced from same supplier with valid documents.',
    closedBy: '',
    closedDate: '',
    log: [
      { id: 'log-003-1', timestamp: '2026-05-20T10:00:00', user: 'Yonas Berhe', action: 'Case opened', comment: 'Raised directly from QEHS compliance gate rejection.' },
      { id: 'log-003-2', timestamp: '2026-05-20T10:05:00', user: 'Yonas Berhe', action: 'Assigned to QEHS', comment: '' },
      { id: 'log-003-3', timestamp: '2026-05-21T09:30:00', user: 'Yonas Berhe', action: 'Root cause and corrective action recorded', comment: '' },
      { id: 'log-003-4', timestamp: '2026-05-21T09:31:00', user: 'Yonas Berhe', action: 'Status changed to Resolved', comment: 'Replacement vehicle dispatched; original supplier notified.' }
    ]
  },
  {
    id: 'INC-2026-004',
    type: 'Route Deviation',
    severity: 'Low',
    status: 'Closed',
    title: 'Unplanned route deviation near Adama checkpoint',
    description: 'GPS trace showed the vehicle deviating from the planned route for approximately 40 minutes before rejoining the main route.',
    reportedBy: 'Daniel Hailu',
    reportedDate: '2026-04-11',
    mrRef: 'MR-2026-0414',
    vehiclePlate: 'ET-3-B10423',
    driverId: 'DL-9041285',
    supplierId: 'sup-02',
    assignedRole: 'Transport',
    assignedTo: 'Daniel Hailu',
    dueDate: '2026-04-14',
    rootCause: 'Driver diverted for fuel stop without prior notification.',
    correctiveAction: 'Driver briefed on route-notification requirement; no repeat incidents recorded since.',
    escalated: false,
    escalatedTo: '',
    escalatedDate: '',
    resolutionNotes: 'No cargo impact confirmed. Driver coached; case closed with no further action required.',
    closedBy: 'Daniel Hailu',
    closedDate: '2026-04-15',
    log: [
      { id: 'log-004-1', timestamp: '2026-04-11T13:10:00', user: 'Daniel Hailu', action: 'Case opened', comment: 'Auto-flagged from route deviation alert.' },
      { id: 'log-004-2', timestamp: '2026-04-12T09:00:00', user: 'Daniel Hailu', action: 'Root cause and corrective action recorded', comment: '' },
      { id: 'log-004-3', timestamp: '2026-04-15T08:20:00', user: 'Daniel Hailu', action: 'Status changed to Resolved', comment: '' },
      { id: 'log-004-4', timestamp: '2026-04-15T08:22:00', user: 'Daniel Hailu', action: 'Case closed', comment: 'Confirmed no cargo or schedule impact.' }
    ]
  }
];

import { TransportRequestItem, LoadingConfirmationData } from './types';

// 16. Item Tracking & POD
export const INITIAL_ITEM_TRACKING: TransportRequestItem[] = [
  {
    tripId: 'TRP-001',
    mrRef: 'MR-2026-0412',
    customer: 'Ethio Telecom / Ericsson',
    originWarehouse: 'Akaki Warehouse Network-6',
    destination: 'Bole Medhanialem High',
    itemGroup: 'Telecom Equipment',
    totalItems: 48,
    loadedQuantity: 48,
    inTransitQuantity: 48,
    deliveredQuantity: 0,
    missingQuantity: 0,
    damagedQuantity: 0,
    returnedQuantity: 0,
    deliveryStatus: 'In Transit',
    reconciliationStatus: 'Clear',
    vehicle: 'ET-3-A98412 (10-Ton)',
    driver: 'Elias Teklu',
    dispatchDate: '2026-06-25',
    items: [
      {
        id: 'req-li-1',
        itemCode: 'PW03.05603',
        itemName: 'ZXESM R421 R02M01 Lithium-ion Battery',
        itemGroup: 'Power',
        barcode: 'BC-991001',
        serialNumber: 'SN-001-A2',
        uom: 'KIT',
        expectedQuantity: 4,
        loadedQuantity: 4,
        deliveredQuantity: 0,
        returnedQuantity: 0,
        damagedQuantity: 0,
        missingQuantity: 0,
        status: 'In Transit',
        barcodeScanned: true,
        serialVerified: true
      },
      {
        id: 'req-li-2',
        itemCode: 'PW03.05741',
        itemName: 'H07V-K&RV Red 1x25mm2 Wire(VDE/CE/CCC)',
        itemGroup: 'Cables',
        barcode: 'BC-991002',
        serialNumber: 'SN-002-B4',
        uom: 'm',
        expectedQuantity: 8,
        loadedQuantity: 8,
        deliveredQuantity: 0,
        returnedQuantity: 0,
        damagedQuantity: 0,
        missingQuantity: 0,
        status: 'In Transit',
        barcodeScanned: true,
        serialVerified: true
      }
    ]
  },
  {
    tripId: 'TRP-002',
    mrRef: 'MR-2026-0413',
    customer: 'Safaricom Ethiopia',
    originWarehouse: 'Addis Ababa Central Warehouse',
    destination: 'Bahir Dar Giyorgis',
    itemGroup: 'MW-EQP',
    totalItems: 12,
    loadedQuantity: 12,
    inTransitQuantity: 0,
    deliveredQuantity: 10,
    missingQuantity: 1,
    damagedQuantity: 1,
    returnedQuantity: 0,
    deliveryStatus: 'Exceptions',
    reconciliationStatus: 'Open Case',
    vehicle: 'ET-3-A98412 (10-Ton)',
    driver: 'Elias Teklu',
    dispatchDate: '2026-06-23',
    items: [
      {
        id: 'req-li-1',
        itemCode: 'MW-0091',
        itemName: 'MW Dish 0.6m',
        itemGroup: 'Antennas',
        barcode: 'BC-882190',
        serialNumber: 'SN-409-Z1',
        uom: 'PCS',
        expectedQuantity: 6,
        loadedQuantity: 6,
        deliveredQuantity: 5,
        returnedQuantity: 0,
        damagedQuantity: 1,
        missingQuantity: 0,
        status: 'Damaged',
        barcodeScanned: true,
        serialVerified: true
      },
      {
        id: 'req-li-2',
        itemCode: 'MW-0092',
        itemName: 'ODU Module',
        itemGroup: 'Antennas',
        barcode: 'BC-882191',
        serialNumber: 'SN-409-Z2',
        uom: 'PCS',
        expectedQuantity: 6,
        loadedQuantity: 6,
        deliveredQuantity: 5,
        returnedQuantity: 0,
        damagedQuantity: 0,
        missingQuantity: 1,
        status: 'Missing',
        barcodeScanned: true,
        serialVerified: true
      }
    ]
  }
];

export const INITIAL_LOADING_CONFIRMATIONS: LoadingConfirmationData[] = [
  {
    tripId: 'TRP-001',
    operatorName: 'Selamawit Kebede',
    operatorId: 'OP-1002',
    confirmationTime: '2026-06-25T14:30:00Z',
    status: 'Confirmed',
    notes: 'All items scanned and verified.'
  }
];
