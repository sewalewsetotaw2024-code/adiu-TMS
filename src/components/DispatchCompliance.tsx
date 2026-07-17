import React, { useState, useMemo } from 'react';
import { Vehicle, Supplier, Driver } from '../types';
import { 
  Search, 
  RefreshCw, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  FileText, 
  Plus, 
  Edit, 
  Filter, 
  Clock, 
  ArrowRight, 
  Bell, 
  User, 
  File, 
  Truck, 
  AlertTriangle, 
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

// Custom interfaces for the TMS Module
interface TMSTrip {
  id: string;
  route: string;
  warehouse: string;
  customer: string;
  plateNumber: string;
  vehicleType: string;
  driverName: string;
  driverId: string;
  driverPhone: string;
  driverLicense: string;
  capacity: string;
  dispatchDate: string;
  qehsStatus: 'Pending' | 'Approved' | 'Rejected';
  loadingReadiness: 'Ready' | 'Not Ready' | 'In Progress';
  dispatchStatus: 'Pending' | 'Ready' | 'Delayed' | 'Dispatched';
  
  // Document statuses & expiries
  docRegistration: { status: 'Valid' | 'Expiring Soon' | 'Expired'; expiry: string; fileUrl: string };
  docInsurance: { status: 'Valid' | 'Expiring Soon' | 'Expired'; expiry: string; fileUrl: string };
  docInspection: { status: 'Valid' | 'Expiring Soon' | 'Expired'; expiry: string; fileUrl: string };
  docLicense: { status: 'Valid' | 'Expiring Soon' | 'Expired'; expiry: string; fileUrl: string };

  // Checklist item statuses
  checklist: {
    vehicleInspection: { status: 'Pass' | 'Fail'; comment: string };
    tireCondition: { status: 'Pass' | 'Fail'; comment: string };
    brakeSystem: { status: 'Pass' | 'Fail'; comment: string };
    lights: { status: 'Pass' | 'Fail'; comment: string };
    fireExtinguisher: { status: 'Pass' | 'Fail'; comment: string };
    firstAidKit: { status: 'Pass' | 'Fail'; comment: string };
    reflectiveTriangle: { status: 'Pass' | 'Fail'; comment: string };
    driverLicenseValid: { status: 'Pass' | 'Fail'; comment: string };
    medicalCertificate: { status: 'Pass' | 'Fail'; comment: string };
    ppeAvailable: { status: 'Pass' | 'Fail'; comment: string };
    loadSafetyCheck: { status: 'Pass' | 'Fail'; comment: string };
  };
  reviewerName: string;
  reviewDate: string;
  generalComments: string;
  rejectionReason?: string;
  correctiveAction?: string;

  // Dispatch readiness details
  loadingStagingComplete: boolean;
  scheduledArrivalTime: string;
  warehouseAccessNotes: string;
  loadingSupervisor: string;
  exceptionApprovalRequired: boolean;
}

interface TMSNotification {
  id: string;
  type: 'Approved' | 'Rejected' | 'Replaced' | 'Delayed' | 'QEHS_Completed';
  tripId: string;
  timestamp: string;
  description: string;
  read: boolean;
}

interface VehicleScreenProps {
  vehicles: Vehicle[];
  suppliers: Supplier[];
  drivers: Driver[];
  onSaveVehicle: (vehicle: Vehicle) => void;
}

const INITIAL_TRIPS: TMSTrip[] = [
  {
    id: 'TRIP-2026-0810',
    route: 'Addis Ababa (Akaki) → Hawassa Central',
    warehouse: 'Akaki Hub Gate 3',
    customer: 'Heineken Breweries S.C.',
    plateNumber: 'ET-3-B48810',
    vehicleType: '10-Ton Box Truck',
    driverName: 'Kebede Alemu',
    driverId: 'DRV-102',
    driverPhone: '+251-911-234567',
    driverLicense: 'DL-ETH-78904',
    capacity: '10 Tons',
    dispatchDate: '2026-07-17',
    qehsStatus: 'Pending',
    loadingReadiness: 'In Progress',
    dispatchStatus: 'Pending',
    docRegistration: { status: 'Valid', expiry: '2027-02-14', fileUrl: 'REG_ET_3_B48810_2026.pdf' },
    docInsurance: { status: 'Expiring Soon', expiry: '2026-08-05', fileUrl: 'INS_ET_3_B48810_2026.pdf' },
    docInspection: { status: 'Valid', expiry: '2026-11-20', fileUrl: 'INSP_ET_3_B48810_2026.pdf' },
    docLicense: { status: 'Valid', expiry: '2028-04-10', fileUrl: 'LIC_DRV_102.pdf' },
    checklist: {
      vehicleInspection: { status: 'Pass', comment: 'Wiper and tires look fully robust.' },
      tireCondition: { status: 'Pass', comment: 'All tread depths > 4mm.' },
      brakeSystem: { status: 'Pass', comment: 'Air brake pressure stable.' },
      lights: { status: 'Pass', comment: 'All indicators and tail lights functional.' },
      fireExtinguisher: { status: 'Pass', comment: 'Pressure gauge green. Exp: 2027.' },
      firstAidKit: { status: 'Pass', comment: 'Fully stocked and sealed.' },
      reflectiveTriangle: { status: 'Pass', comment: 'Two units placed in cabin.' },
      driverLicenseValid: { status: 'Pass', comment: 'Validated Class 5 license.' },
      medicalCertificate: { status: 'Pass', comment: 'Valid for next 12 months.' },
      ppeAvailable: { status: 'Pass', comment: 'Vest, helmet, steel-toes verified.' },
      loadSafetyCheck: { status: 'Pass', comment: 'Ratchet straps pre-anchored.' }
    },
    reviewerName: 'Melaku Teshome',
    reviewDate: '2026-07-16',
    generalComments: 'Vehicle has undergone pre-dispatch mechanical evaluation.',
    loadingStagingComplete: false,
    scheduledArrivalTime: '08:30 AM',
    warehouseAccessNotes: 'Enter via Akaki Gate 2, present custom gate pass. Driver must wear orange high-vis vest.',
    loadingSupervisor: 'Abebe Tesfaye',
    exceptionApprovalRequired: false
  },
  {
    id: 'TRIP-2026-0811',
    route: 'Addis Ababa (Bole) → Adama Logistics Hub',
    warehouse: 'Bole Terminal A',
    customer: 'Diageo PLC (Meta)',
    plateNumber: 'ET-3-C51204',
    vehicleType: '5-Ton Covered Van',
    driverName: 'Abebe Bekele',
    driverId: 'DRV-104',
    driverPhone: '+251-922-876543',
    driverLicense: 'DL-ETH-89012',
    capacity: '5 Tons',
    dispatchDate: '2026-07-17',
    qehsStatus: 'Approved',
    loadingReadiness: 'Ready',
    dispatchStatus: 'Ready',
    docRegistration: { status: 'Valid', expiry: '2027-05-18', fileUrl: 'REG_ET_3_C51204_2026.pdf' },
    docInsurance: { status: 'Valid', expiry: '2026-12-01', fileUrl: 'INS_ET_3_C51204_2026.pdf' },
    docInspection: { status: 'Valid', expiry: '2026-10-30', fileUrl: 'INSP_ET_3_C51204_2026.pdf' },
    docLicense: { status: 'Valid', expiry: '2029-01-15', fileUrl: 'LIC_DRV_104.pdf' },
    checklist: {
      vehicleInspection: { status: 'Pass', comment: 'Excellent body condition.' },
      tireCondition: { status: 'Pass', comment: 'New Michelins fitted.' },
      brakeSystem: { status: 'Pass', comment: 'Inspected and certified.' },
      lights: { status: 'Pass', comment: 'All lights operational.' },
      fireExtinguisher: { status: 'Pass', comment: 'Gauge optimal.' },
      firstAidKit: { status: 'Pass', comment: 'Present and certified.' },
      reflectiveTriangle: { status: 'Pass', comment: 'Available.' },
      driverLicenseValid: { status: 'Pass', comment: 'Verified.' },
      medicalCertificate: { status: 'Pass', comment: 'Validated.' },
      ppeAvailable: { status: 'Pass', comment: 'All items verified.' },
      loadSafetyCheck: { status: 'Pass', comment: 'Straps tensioned.' }
    },
    reviewerName: 'Melaku Teshome',
    reviewDate: '2026-07-16',
    generalComments: 'Passed on first inspection attempt.',
    loadingStagingComplete: true,
    scheduledArrivalTime: '09:00 AM',
    warehouseAccessNotes: 'Proceed direct to loading bay 5.',
    loadingSupervisor: 'Tewodros Kassaye',
    exceptionApprovalRequired: false
  },
  {
    id: 'TRIP-2026-0812',
    route: 'Addis Ababa (Kality) → Gondar Store',
    warehouse: 'Kality Cold Chain',
    customer: 'East African Bottling (Coca-Cola)',
    plateNumber: 'ET-3-A12245',
    vehicleType: '15-Ton Trailer',
    driverName: 'Girma Kassa',
    driverId: 'DRV-108',
    driverPhone: '+251-913-456789',
    driverLicense: 'DL-ETH-45612',
    capacity: '15 Tons',
    dispatchDate: '2026-07-18',
    qehsStatus: 'Rejected',
    loadingReadiness: 'Not Ready',
    dispatchStatus: 'Delayed',
    docRegistration: { status: 'Valid', expiry: '2026-09-12', fileUrl: 'REG_ET_3_A12245_2026.pdf' },
    docInsurance: { status: 'Expired', expiry: '2026-07-01', fileUrl: 'INS_ET_3_A12245_2026.pdf' },
    docInspection: { status: 'Expired', expiry: '2026-06-15', fileUrl: 'INSP_ET_3_A12245_2026.pdf' },
    docLicense: { status: 'Valid', expiry: '2027-08-20', fileUrl: 'LIC_DRV_108.pdf' },
    checklist: {
      vehicleInspection: { status: 'Fail', comment: 'Engine oil leak detected.' },
      tireCondition: { status: 'Fail', comment: 'Rear left tire is bald.' },
      brakeSystem: { status: 'Pass', comment: 'Acceptable response.' },
      lights: { status: 'Fail', comment: 'Right headlight indicator broken.' },
      fireExtinguisher: { status: 'Pass', comment: 'Valid.' },
      firstAidKit: { status: 'Fail', comment: 'Empty/Missing basic supplies.' },
      reflectiveTriangle: { status: 'Pass', comment: 'Verified.' },
      driverLicenseValid: { status: 'Pass', comment: 'Verified.' },
      medicalCertificate: { status: 'Pass', comment: 'Validated.' },
      ppeAvailable: { status: 'Pass', comment: 'Available.' },
      loadSafetyCheck: { status: 'Fail', comment: 'Straps are torn.' }
    },
    reviewerName: 'Yosef Alemu',
    reviewDate: '2026-07-15',
    generalComments: 'Vehicle rejected due to multiple critical safety non-conformances.',
    rejectionReason: 'Critical mechanical leaks and tire wear combined with expired safety check certificates.',
    correctiveAction: 'Replace bald rear tire, repair right headlight indicator, renew insurance and inspection papers.',
    loadingStagingComplete: false,
    scheduledArrivalTime: '11:30 AM',
    warehouseAccessNotes: 'Hold at outer security zone until cleared.',
    loadingSupervisor: 'Meron Belay',
    exceptionApprovalRequired: true
  },
  {
    id: 'TRIP-2026-0813',
    route: 'Adama Terminal → Awash Depot',
    warehouse: 'Adama Storage Facility',
    customer: 'BGI Ethiopia S.C.',
    plateNumber: 'ET-3-D60714',
    vehicleType: '10-Ton Flatbed',
    driverName: 'Daniel Tesfaye',
    driverId: 'DRV-110',
    driverPhone: '+251-914-112233',
    driverLicense: 'DL-ETH-24510',
    capacity: '10 Tons',
    dispatchDate: '2026-07-18',
    qehsStatus: 'Pending',
    loadingReadiness: 'Not Ready',
    dispatchStatus: 'Pending',
    docRegistration: { status: 'Valid', expiry: '2027-01-20', fileUrl: 'REG_ET_3_D60714_2026.pdf' },
    docInsurance: { status: 'Valid', expiry: '2026-10-14', fileUrl: 'INS_ET_3_D60714_2026.pdf' },
    docInspection: { status: 'Valid', expiry: '2026-09-05', fileUrl: 'INSP_ET_3_D60714_2026.pdf' },
    docLicense: { status: 'Expiring Soon', expiry: '2026-08-01', fileUrl: 'LIC_DRV_110.pdf' },
    checklist: {
      vehicleInspection: { status: 'Pass', comment: 'Body intact.' },
      tireCondition: { status: 'Pass', comment: 'Treads look normal.' },
      brakeSystem: { status: 'Pass', comment: 'Brakes functional.' },
      lights: { status: 'Pass', comment: 'Lights functional.' },
      fireExtinguisher: { status: 'Pass', comment: 'Available.' },
      firstAidKit: { status: 'Pass', comment: 'Equipped.' },
      reflectiveTriangle: { status: 'Pass', comment: 'Present.' },
      driverLicenseValid: { status: 'Pass', comment: 'Expires in 15 days.' },
      medicalCertificate: { status: 'Pass', comment: 'Valid.' },
      ppeAvailable: { status: 'Pass', comment: 'Equipped.' },
      loadSafetyCheck: { status: 'Pass', comment: 'Verified.' }
    },
    reviewerName: 'Melaku Teshome',
    reviewDate: '2026-07-16',
    generalComments: 'Requires validation of expiring license soon.',
    loadingStagingComplete: false,
    scheduledArrivalTime: '01:00 PM',
    warehouseAccessNotes: 'Gate clearance at central dispatch post.',
    loadingSupervisor: 'Alemayehu Shiferaw',
    exceptionApprovalRequired: false
  },
  {
    id: 'TRIP-2026-0814',
    route: 'Addis Ababa (Megenagna) → Mekelle Hub',
    warehouse: 'Megenagna Warehouse B',
    customer: 'Dangote Cement Ethiopia S.C.',
    plateNumber: 'ET-3-C99812',
    vehicleType: '20-Ton Heavy Trailer',
    driverName: 'Samuel Hailu',
    driverId: 'DRV-112',
    driverPhone: '+251-925-554433',
    driverLicense: 'DL-ETH-11224',
    capacity: '20 Tons',
    dispatchDate: '2026-07-19',
    qehsStatus: 'Approved',
    loadingReadiness: 'Ready',
    dispatchStatus: 'Ready',
    docRegistration: { status: 'Valid', expiry: '2027-08-01', fileUrl: 'REG_ET_3_C99812_2026.pdf' },
    docInsurance: { status: 'Valid', expiry: '2027-01-30', fileUrl: 'INS_ET_3_C99812_2026.pdf' },
    docInspection: { status: 'Valid', expiry: '2026-12-15', fileUrl: 'INSP_ET_3_C99812_2026.pdf' },
    docLicense: { status: 'Valid', expiry: '2030-03-12', fileUrl: 'LIC_DRV_112.pdf' },
    checklist: {
      vehicleInspection: { status: 'Pass', comment: 'Excellent mechanical state.' },
      tireCondition: { status: 'Pass', comment: 'New heavy-duty tires.' },
      brakeSystem: { status: 'Pass', comment: 'Tested on grade ramps.' },
      lights: { status: 'Pass', comment: 'Full system OK.' },
      fireExtinguisher: { status: 'Pass', comment: '2 units present.' },
      firstAidKit: { status: 'Pass', comment: 'Fully supplied.' },
      reflectiveTriangle: { status: 'Pass', comment: 'Checked.' },
      driverLicenseValid: { status: 'Pass', comment: 'Validated.' },
      medicalCertificate: { status: 'Pass', comment: 'Up to date.' },
      ppeAvailable: { status: 'Pass', comment: 'Verified.' },
      loadSafetyCheck: { status: 'Pass', comment: 'Pre-tensioners locked.' }
    },
    reviewerName: 'Yosef Alemu',
    reviewDate: '2026-07-16',
    generalComments: 'Passed detailed state mechanical clearance.',
    loadingStagingComplete: true,
    scheduledArrivalTime: '07:00 AM',
    warehouseAccessNotes: 'Proceed to heavy vehicle bay 1.',
    loadingSupervisor: 'Meron Belay',
    exceptionApprovalRequired: false
  }
];

const INITIAL_NOTIFICATIONS: TMSNotification[] = [
  {
    id: 'NOT-001',
    type: 'Approved',
    tripId: 'TRIP-2026-0811',
    timestamp: '10 mins ago',
    description: 'Trip TRIP-2026-0811 has passed QEHS check and vehicle approved.',
    read: false
  },
  {
    id: 'NOT-002',
    type: 'Rejected',
    tripId: 'TRIP-2026-0812',
    timestamp: '2 hours ago',
    description: 'Vehicle ET-3-A12245 rejected. Multiple safety checklists failed.',
    read: false
  },
  {
    id: 'NOT-003',
    type: 'Delayed',
    tripId: 'TRIP-2026-0812',
    timestamp: '3 hours ago',
    description: 'Dispatch delayed for Gondar Store due to non-compliant vehicle.',
    read: true
  }
];

export default function DispatchComplianceScreen({ vehicles, suppliers, drivers, onSaveVehicle }: VehicleScreenProps) {
  // TMS state variables
  const [trips, setTrips] = useState<TMSTrip[]>(INITIAL_TRIPS);
  const [selectedTripId, setSelectedTripId] = useState<string>(INITIAL_TRIPS[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [notifications, setNotifications] = useState<TMSNotification[]>(INITIAL_NOTIFICATIONS);
  const [showNotificationsCenter, setShowNotificationsCenter] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal active triggers
  const [activeModal, setActiveModal] = useState<'qehs' | 'documents' | 'reject' | 'replace' | 'readiness' | null>(null);
  
  // Document Viewing state helper (used inside documents modal)
  const [viewedDocType, setViewedDocType] = useState<'registration' | 'insurance' | 'inspection' | 'license' | null>(null);

  // Rejection intermediate form state variables
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');

  // Local copy of checklist during editing
  const [editingChecklist, setEditingChecklist] = useState<TMSTrip['checklist'] | null>(null);
  const [editingReviewer, setEditingReviewer] = useState('');
  const [editingGeneralComments, setEditingGeneralComments] = useState('');

  // Selected Trip Object Getter
  const selectedTrip = useMemo(() => {
    return trips.find(t => t.id === selectedTripId) || trips[0] || null;
  }, [trips, selectedTripId]);

  // Unique list values for Filter Dropdowns
  const uniqueWarehouses = useMemo(() => {
    return Array.from(new Set(trips.map(t => t.warehouse.split(' ')[0])));
  }, [trips]);

  const uniqueDrivers = useMemo(() => {
    return Array.from(new Set(trips.map(t => t.driverName)));
  }, [trips]);

  // Filter & Search Logic
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        t.id.toLowerCase().includes(query) ||
        t.route.toLowerCase().includes(query) ||
        t.customer.toLowerCase().includes(query) ||
        t.plateNumber.toLowerCase().includes(query) ||
        t.driverName.toLowerCase().includes(query);
      
      const matchesStatus = statusFilter ? t.qehsStatus === statusFilter : true;
      
      // Date filter logic (Today vs Tomorrow/Upcoming)
      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = t.dispatchDate === '2026-07-17';
      } else if (dateFilter === 'Upcoming') {
        matchesDate = t.dispatchDate > '2026-07-17';
      }

      const matchesWarehouse = warehouseFilter ? t.warehouse.includes(warehouseFilter) : true;
      const matchesDriver = driverFilter ? t.driverName === driverFilter : true;

      return matchesSearch && matchesStatus && matchesDate && matchesWarehouse && matchesDriver;
    });
  }, [trips, searchQuery, statusFilter, dateFilter, warehouseFilter, driverFilter]);

  // Paginated lists
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrips.slice(start, start + itemsPerPage);
  }, [filteredTrips, currentPage]);

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage) || 1;

  // KPI Calculations
  const kpiAwaitingQehs = useMemo(() => trips.filter(t => t.qehsStatus === 'Pending').length, [trips]);
  const kpiApproved = useMemo(() => trips.filter(t => t.qehsStatus === 'Approved').length, [trips]);
  const kpiRejected = useMemo(() => trips.filter(t => t.qehsStatus === 'Rejected').length, [trips]);
  const kpiDelayed = useMemo(() => trips.filter(t => t.dispatchStatus === 'Delayed').length, [trips]);
  const kpiReadyForLoading = useMemo(() => trips.filter(t => t.loadingReadiness === 'In Progress' || t.loadingReadiness === 'Ready').length, [trips]);

  // Handlers
  const handleRefresh = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
    setWarehouseFilter('');
    setDriverFilter('');
    setCurrentPage(1);
    setTrips(INITIAL_TRIPS);
    alert('Transportation database refreshed successfully!');
  };

  const handleExport = () => {
    const csvContent = "Trip ID,Route,Customer,Plate,Driver,Capacity,Dispatch Date,QEHS,Dispatch Status\n" + 
      filteredTrips.map(t => `"${t.id}","${t.route}","${t.customer}","${t.plateNumber}","${t.driverName}","${t.capacity}","${t.dispatchDate}","${t.qehsStatus}","${t.dispatchStatus}"`).join("\n");
    
    // Simple download trigger
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `TMS_Dispatch_Readiness_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  // Open checklist editor modal
  const openQehsModal = (trip: TMSTrip) => {
    setEditingChecklist(JSON.parse(JSON.stringify(trip.checklist)));
    setEditingReviewer(trip.reviewerName || 'Melaku Teshome');
    setEditingGeneralComments(trip.generalComments || '');
    setSelectedTripId(trip.id);
    setActiveModal('qehs');
  };

  // Save Approved QEHS State
  const handleApproveQehs = () => {
    if (!selectedTrip || !editingChecklist) return;

    const updatedChecklist = { ...editingChecklist };
    // Set all to pass for approval
    Object.keys(updatedChecklist).forEach((key) => {
      const k = key as keyof TMSTrip['checklist'];
      updatedChecklist[k].status = 'Pass';
    });

    setTrips(prev => prev.map(t => {
      if (t.id === selectedTrip.id) {
        return {
          ...t,
          qehsStatus: 'Approved',
          dispatchStatus: t.loadingReadiness === 'Ready' ? 'Ready' : 'Pending',
          checklist: updatedChecklist,
          reviewerName: editingReviewer,
          reviewDate: new Date().toISOString().split('T')[0],
          generalComments: editingGeneralComments,
          rejectionReason: '',
          correctiveAction: ''
        };
      }
      return t;
    }));

    // Add Notification
    const newNotif: TMSNotification = {
      id: `NOT-${Date.now()}`,
      type: 'Approved',
      tripId: selectedTrip.id,
      timestamp: 'Just now',
      description: `Trip ${selectedTrip.id} vehicle approved by ${editingReviewer} after QEHS review.`,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    setActiveModal(null);
  };

  // Save Rejected QEHS State
  const handleInitiateRejection = () => {
    setRejectionReason('');
    setCorrectiveAction('');
    setActiveModal('reject');
  };

  const handleConfirmRejection = () => {
    if (!selectedTrip || !rejectionReason.trim()) {
      alert('Please fill in the required rejection reason.');
      return;
    }

    setTrips(prev => prev.map(t => {
      if (t.id === selectedTrip.id) {
        // Find failed checklist items or flag first few as Fail
        const updatedChecklist = { ...t.checklist };
        updatedChecklist.vehicleInspection.status = 'Fail';
        updatedChecklist.tireCondition.status = 'Fail';

        return {
          ...t,
          qehsStatus: 'Rejected',
          dispatchStatus: 'Delayed',
          loadingReadiness: 'Not Ready',
          checklist: updatedChecklist,
          rejectionReason: rejectionReason,
          correctiveAction: correctiveAction || 'No corrective action listed.',
          reviewerName: editingReviewer,
          reviewDate: new Date().toISOString().split('T')[0]
        };
      }
      return t;
    }));

    // Add Notification
    const newNotif: TMSNotification = {
      id: `NOT-${Date.now()}`,
      type: 'Rejected',
      tripId: selectedTrip.id,
      timestamp: 'Just now',
      description: `Trip ${selectedTrip.id} rejected. Reason: ${rejectionReason}`,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    setActiveModal(null);
  };

  // Replace vehicle trigger
  const handleReplaceVehicle = (newPlateNumber: string) => {
    const selectedVeh = vehicles.find(v => v.plateNumber === newPlateNumber);
    if (!selectedVeh) return;

    // Find driver matching this vehicle or assign a random driver
    const driverForVeh = drivers.find(d => d.assignedVehiclePlate === newPlateNumber) || drivers[0];

    setTrips(prev => prev.map(t => {
      if (t.id === selectedTripId) {
        return {
          ...t,
          plateNumber: selectedVeh.plateNumber,
          capacity: `${selectedVeh.tonCapacity} Tons`,
          vehicleType: `${selectedVeh.tonCapacity}-Ton Box Truck`,
          driverName: driverForVeh ? driverForVeh.name : 'Allocated Driver',
          driverId: driverForVeh ? driverForVeh.id : 'DRV-NEW',
          driverPhone: driverForVeh ? driverForVeh.phone : '+251-900-000000',
          driverLicense: driverForVeh ? driverForVeh.licenseNumber : 'DL-ETH-NEW',
          qehsStatus: 'Pending', // reset QEHS verification for new vehicle
          dispatchStatus: 'Pending',
          // Randomize document validity slightly to make it highly realistic
          docRegistration: { status: 'Valid', expiry: '2027-04-10', fileUrl: 'REG_NEW.pdf' },
          docInsurance: { status: 'Valid', expiry: '2026-11-25', fileUrl: 'INS_NEW.pdf' },
          docInspection: { status: 'Valid', expiry: '2026-12-05', fileUrl: 'INSP_NEW.pdf' }
        };
      }
      return t;
    }));

    // Add Notification
    const newNotif: TMSNotification = {
      id: `NOT-${Date.now()}`,
      type: 'Replaced',
      tripId: selectedTripId,
      timestamp: 'Just now',
      description: `Vehicle replaced on ${selectedTripId} with ${newPlateNumber}. QEHS reset to Pending.`,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    setActiveModal(null);
    alert(`Vehicle successfully swapped to ${newPlateNumber} with driver ${driverForVeh?.name}!`);
  };

  // Toggle Loading Staging Complete
  const handleToggleStaging = (checked: boolean) => {
    if (!selectedTrip) return;
    setTrips(prev => prev.map(t => {
      if (t.id === selectedTrip.id) {
        const nextLoading: TMSTrip['loadingReadiness'] = checked ? 'Ready' : 'In Progress';
        const nextDispatch: TMSTrip['dispatchStatus'] = (t.qehsStatus === 'Approved' && checked) ? 'Ready' : 'Pending';
        return {
          ...t,
          loadingStagingComplete: checked,
          loadingReadiness: nextLoading,
          dispatchStatus: nextDispatch
        };
      }
      return t;
    }));
  };

  // Mark all notifications as read
  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Helper Badge Color Mappers
  const getQehsStatusBadge = (status: TMSTrip['qehsStatus']) => {
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]"><Check className="w-3.5 h-3.5" /> Approved</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]"><X className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082]"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  const getDispatchBadge = (status: TMSTrip['dispatchStatus']) => {
    switch (status) {
      case 'Ready':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E3F2FD] text-[#0D47A1] border border-[#90CAF9]">Ready</span>;
      case 'Delayed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">Delayed</span>;
      case 'Dispatched':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">Dispatched</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECEFF1] text-[#37474F] border border-[#B0BEC5]">Pending</span>;
    }
  };

  const getDocBadgeColor = (status: 'Valid' | 'Expiring Soon' | 'Expired') => {
    switch (status) {
      case 'Valid':
        return 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]';
      case 'Expiring Soon':
        return 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]';
      case 'Expired':
        return 'bg-[#FFEBEE] text-[#C62828] border-[#EF9A9A]';
    }
  };

  return (
    <div className="space-y-6 select-none bg-[#F8F9FA] p-1 rounded-2xl" id="tms-module-root">
      
      {/* SECTION 1: TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">Pending QEHS Review</span>
            <div className="text-2xl font-bold text-slate-900">{kpiAwaitingQehs}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FFF8E1] flex items-center justify-center text-[#F57F17]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">Approved for Dispatch</span>
            <div className="text-2xl font-bold text-slate-900">{kpiApproved}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">Rejected Vehicles</span>
            <div className="text-2xl font-bold text-slate-900">{kpiRejected}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FFEBEE] flex items-center justify-center text-[#C62828]">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">Dispatch Delays</span>
            <div className="text-2xl font-bold text-slate-900">{kpiDelayed}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FFF3E0] flex items-center justify-center text-[#E65100]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">Ready for Loading</span>
            <div className="text-2xl font-bold text-slate-900">{kpiReadyForLoading}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#E3F2FD] flex items-center justify-center text-[#0D47A1]">
            <Truck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* SECTION 2: CONTROLS & TABLE & SIDE PANEL GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* LEFT 3 COLS: TRIP REGISTRY & MAIN PAGE TABLE */}
        <div className="xl:col-span-3 space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Header & Notification Center button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Dispatch Readiness Console</h2>
              <p className="text-xs text-slate-500">Monitor vehicle safety compliance logs and staging milestones.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotificationsCenter(!showNotificationsCenter)}
                className="relative h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors"
              >
                <Bell className="w-4 h-4 text-slate-500" />
                <span>Alerts</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white font-sans text-[10px] font-bold flex items-center justify-center border border-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <button
                onClick={handleRefresh}
                className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors"
                title="Refresh Database"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={handleExport}
                className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search trip, route, driver..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-8 pl-8 pr-2 rounded-md border border-slate-200 bg-white font-sans text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All QEHS Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Filter Date */}
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Dates</option>
              <option value="Today">Today (July 17)</option>
              <option value="Upcoming">Upcoming</option>
            </select>

            {/* Filter Warehouse */}
            <select
              value={warehouseFilter}
              onChange={(e) => { setWarehouseFilter(e.target.value); setCurrentPage(1); }}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Warehouses</option>
              {uniqueWarehouses.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            {/* Filter Driver */}
            <select
              value={driverFilter}
              onChange={(e) => { setDriverFilter(e.target.value); setCurrentPage(1); }}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Drivers</option>
              {uniqueDrivers.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* DYNAMIC NOTIFICATIONS CENTER PANEL DRAWER (IF OPEN) */}
          {showNotificationsCenter && (
            <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                  <Bell className="w-4 h-4 text-blue-600" /> Notifications Stream
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleMarkNotificationsRead}
                    className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Mark all as read
                  </button>
                  <button 
                    onClick={() => setShowNotificationsCenter(false)}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No recent logistical events logged.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-2.5 rounded-lg border flex items-start gap-3 justify-between text-xs transition-colors ${
                        notif.read ? 'bg-white/50 border-slate-100' : 'bg-white border-blue-200 shadow-xs font-medium'
                      }`}
                    >
                      <div className="flex gap-2 items-start">
                        {notif.type === 'Approved' ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : notif.type === 'Rejected' ? (
                          <div className="w-5 h-5 rounded-full bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                            <X className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                            <Truck className="w-3 h-3" />
                          </div>
                        )}
                        <div>
                          <p className="text-slate-800">{notif.description}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp} | Trip: {notif.tripId}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedTripId(notif.tripId);
                          // mark single as read
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                        }}
                        className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MAIN TABLE */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3">Trip ID</th>
                  <th className="p-3">Client & Route</th>
                  <th className="p-3">Plate No</th>
                  <th className="p-3">Driver Name</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">Dispatch Date</th>
                  <th className="p-3 text-center">QEHS Status</th>
                  <th className="p-3 text-center">Loading Status</th>
                  <th className="p-3 text-center">Dispatch Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedTrips.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                      No matching dispatch trips found with the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedTrips.map((trip) => {
                    const isSelected = selectedTripId === trip.id;
                    return (
                      <tr 
                        key={trip.id} 
                        onClick={() => setSelectedTripId(trip.id)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-slate-900">{trip.id}</td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{trip.customer}</p>
                          <span className="text-[10px] text-slate-500 block">{trip.route}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{trip.plateNumber}</td>
                        <td className="p-3">
                          <p className="font-medium text-slate-800">{trip.driverName}</p>
                          <span className="text-[10px] text-slate-400 block">{trip.driverPhone}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">{trip.capacity}</td>
                        <td className="p-3 font-mono text-slate-600">{trip.dispatchDate}</td>
                        <td className="p-3 text-center">{getQehsStatusBadge(trip.qehsStatus)}</td>
                        <td className="p-3 text-center">
                          {trip.loadingReadiness === 'Ready' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Ready</span>
                          ) : trip.loadingReadiness === 'In Progress' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Staging</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Not Staged</span>
                          )}
                        </td>
                        <td className="p-3 text-center">{getDispatchBadge(trip.dispatchStatus)}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openQehsModal(trip)}
                              className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold cursor-pointer transition-colors"
                              title="Audit compliance checklist"
                            >
                              Review QEHS
                            </button>
                            
                            <button
                              onClick={() => { setSelectedTripId(trip.id); setActiveModal('readiness'); }}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold cursor-pointer transition-colors"
                              title="Update Loading Readiness & Steps"
                            >
                              Readiness
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredTrips.length} entries filtered)
            </span>
            
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT 1 COL: ASSIGNED VEHICLE & DRIVER PANEL */}
        <div className="space-y-4">
          
          {/* VEHICLE & DRIVER CARD */}
          {selectedTrip ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Active Vehicle Specs</span>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span>Plate: {selectedTrip.plateNumber}</span>
                </h3>
              </div>

              {/* Vehicle Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Vehicle Type</span>
                  <span className="font-semibold text-slate-700">{selectedTrip.vehicleType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Max Payload</span>
                  <span className="font-semibold text-slate-700">{selectedTrip.capacity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Driver Name</span>
                  <span className="font-semibold text-slate-700">{selectedTrip.driverName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Driver ID</span>
                  <span className="font-semibold text-slate-700 font-mono">{selectedTrip.driverId}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase">Phone Number</span>
                  <span className="font-semibold text-slate-700 font-mono">{selectedTrip.driverPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase">License Number</span>
                  <span className="font-semibold text-slate-700 font-mono">{selectedTrip.driverLicense}</span>
                </div>
              </div>

              {/* Document Validity Status */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Document Compliance Status</span>
                
                <div className="space-y-1.5">
                  {/* Registration */}
                  <div className="flex items-center justify-between text-xs p-1 rounded hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Vehicle Registration</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getDocBadgeColor(selectedTrip.docRegistration.status)}`}>
                      {selectedTrip.docRegistration.status}
                    </span>
                  </div>

                  {/* Insurance */}
                  <div className="flex items-center justify-between text-xs p-1 rounded hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Insurance Policy</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getDocBadgeColor(selectedTrip.docInsurance.status)}`}>
                      {selectedTrip.docInsurance.status}
                    </span>
                  </div>

                  {/* Inspection */}
                  <div className="flex items-center justify-between text-xs p-1 rounded hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Inspection Cert.</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getDocBadgeColor(selectedTrip.docInspection.status)}`}>
                      {selectedTrip.docInspection.status}
                    </span>
                  </div>

                  {/* License */}
                  <div className="flex items-center justify-between text-xs p-1 rounded hover:bg-slate-50">
                    <span className="text-slate-600 font-medium">Driver's License</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getDocBadgeColor(selectedTrip.docLicense.status)}`}>
                      {selectedTrip.docLicense.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side Card Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => { setViewedDocType(null); setActiveModal('documents'); }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <File className="w-3.5 h-3.5" />
                  <span>View Docs</span>
                </button>

                <button
                  onClick={() => setActiveModal('replace')}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Swap Veh.</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400 italic text-xs">
              Select a trip to load assigned vehicle specs.
            </div>
          )}

          {/* DISPATCH PROGRESS CARD */}
          {selectedTrip && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dispatch Milestones</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => setActiveModal('readiness')}>
                  Config Info
                </span>
              </div>

              {/* Progress Steps */}
              <div className="relative pl-6 space-y-4 text-xs font-medium">
                {/* Visual Line connector */}
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>

                {/* Step 1 */}
                <div className="relative flex items-center gap-2">
                  <div className="absolute -left-[22px] w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border border-white">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="text-slate-800">Vehicle Assigned</p>
                    <span className="text-[9px] text-slate-400 font-mono">{selectedTrip.plateNumber}</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-center gap-2">
                  <div className="absolute -left-[22px] w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border border-white">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="text-slate-800">Driver Assigned</p>
                    <span className="text-[9px] text-slate-400 font-mono">{selectedTrip.driverName}</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-center gap-2">
                  <div className={`absolute -left-[22px] w-4 h-4 rounded-full flex items-center justify-center border border-white ${
                    selectedTrip.qehsStatus === 'Approved' ? 'bg-emerald-500 text-white' : 
                    selectedTrip.qehsStatus === 'Rejected' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
                  }`}>
                    {selectedTrip.qehsStatus === 'Approved' ? <Check className="w-2.5 h-2.5" /> : 
                     selectedTrip.qehsStatus === 'Rejected' ? <X className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                  </div>
                  <div>
                    <p className="text-slate-800">QEHS Approved</p>
                    <span className="text-[9px] text-slate-400 font-mono">Status: {selectedTrip.qehsStatus}</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative flex items-center gap-2">
                  <div className={`absolute -left-[22px] w-4 h-4 rounded-full flex items-center justify-center border border-white ${
                    selectedTrip.loadingReadiness === 'Ready' ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'
                  }`}>
                    {selectedTrip.loadingReadiness === 'Ready' ? <Check className="w-2.5 h-2.5" /> : <Truck className="w-2.5 h-2.5" />}
                  </div>
                  <div>
                    <p className="text-slate-800">Loading Ready</p>
                    <span className="text-[9px] text-slate-400 font-mono">Status: {selectedTrip.loadingReadiness}</span>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="relative flex items-center gap-2">
                  <div className={`absolute -left-[22px] w-4 h-4 rounded-full flex items-center justify-center border border-white ${
                    selectedTrip.dispatchStatus === 'Ready' ? 'bg-blue-600 text-white font-mono text-[9px]' : 'bg-slate-300 text-white'
                  }`}>
                    {selectedTrip.dispatchStatus === 'Ready' ? '✓' : '5'}
                  </div>
                  <div>
                    <p className="text-slate-800">Dispatch Ready</p>
                    <span className="text-[9px] text-slate-400 font-mono">Status: {selectedTrip.dispatchStatus}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* ================= MODAL WINDOWS SYSTEM ================= */}

      {/* MODAL 1: REVIEW QEHS CHECKLIST */}
      {activeModal === 'qehs' && selectedTrip && editingChecklist && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-zoomIn">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">QEHS Compliance Audit Checklist</h3>
                  <p className="text-xs text-slate-400">Trip Ref: {selectedTrip.id} | Vehicle Plate: {selectedTrip.plateNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Logistical Safety Parameters</span>
              
              <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                {Object.keys(editingChecklist).map((key) => {
                  const checkKey = key as keyof TMSTrip['checklist'];
                  const checkObj = editingChecklist[checkKey];
                  
                  // Friendly Name parser
                  const friendlyName = checkKey
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());

                  return (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-700">{friendlyName}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Selector toggles */}
                        <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingChecklist(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  [checkKey]: { ...prev[checkKey], status: 'Pass' }
                                };
                              });
                            }}
                            className={`px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
                              checkObj.status === 'Pass' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingChecklist(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  [checkKey]: { ...prev[checkKey], status: 'Fail' }
                                };
                              });
                            }}
                            className={`px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
                              checkObj.status === 'Fail' ? 'bg-red-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            Fail
                          </button>
                        </div>

                        {/* Comment box */}
                        <input 
                          type="text" 
                          placeholder="Add comment..."
                          value={checkObj.comment}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingChecklist(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                [checkKey]: { ...prev[checkKey], comment: val }
                              };
                            });
                          }}
                          className="h-8 px-2 rounded border border-slate-200 bg-white font-sans text-[11px] text-slate-700 w-44 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Audit Metadata */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Reviewer Name</label>
                <input 
                  type="text" 
                  value={editingReviewer} 
                  onChange={(e) => setEditingReviewer(e.target.value)}
                  className="h-9 px-3 border border-slate-200 rounded-md bg-white text-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Review Date</label>
                <input 
                  type="text" 
                  disabled 
                  value={new Date().toISOString().split('T')[0]} 
                  className="h-9 px-3 border border-slate-200 rounded-md bg-slate-100 text-slate-500 font-mono font-bold"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">General Comments</label>
                <textarea 
                  rows={2}
                  value={editingGeneralComments} 
                  onChange={(e) => setEditingGeneralComments(e.target.value)}
                  placeholder="Mechanical parameters look fully calibrated. Re-verify brake tensioning certificates at Akaki gate pass..."
                  className="p-2 border border-slate-200 rounded-md bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-[11px] text-slate-500 italic">
                * Approved vehicles are cleared automatically for freight loading.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInitiateRejection}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Vehicle</span>
                </button>

                <button
                  onClick={handleApproveQehs}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Vehicle</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: VIEW VEHICLE DOCUMENTS */}
      {activeModal === 'documents' && selectedTrip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <File className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Supporting Compliance Docs</h3>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setViewedDocType(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Select Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setViewedDocType('registration')}
                className={`p-3 border rounded-xl font-bold flex flex-col items-start gap-1 justify-between transition-colors ${
                  viewedDocType === 'registration' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-slate-500 font-normal">Vehicle Registration</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] border font-bold ${getDocBadgeColor(selectedTrip.docRegistration.status)}`}>
                  {selectedTrip.docRegistration.status}
                </span>
              </button>

              <button
                onClick={() => setViewedDocType('insurance')}
                className={`p-3 border rounded-xl font-bold flex flex-col items-start gap-1 justify-between transition-colors ${
                  viewedDocType === 'insurance' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-slate-500 font-normal">Insurance Policy</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] border font-bold ${getDocBadgeColor(selectedTrip.docInsurance.status)}`}>
                  {selectedTrip.docInsurance.status}
                </span>
              </button>

              <button
                onClick={() => setViewedDocType('inspection')}
                className={`p-3 border rounded-xl font-bold flex flex-col items-start gap-1 justify-between transition-colors ${
                  viewedDocType === 'inspection' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-slate-500 font-normal">Inspection Cert.</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] border font-bold ${getDocBadgeColor(selectedTrip.docInspection.status)}`}>
                  {selectedTrip.docInspection.status}
                </span>
              </button>

              <button
                onClick={() => setViewedDocType('license')}
                className={`p-3 border rounded-xl font-bold flex flex-col items-start gap-1 justify-between transition-colors ${
                  viewedDocType === 'license' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="text-slate-500 font-normal">Driver's License</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] border font-bold ${getDocBadgeColor(selectedTrip.docLicense.status)}`}>
                  {selectedTrip.docLicense.status}
                </span>
              </button>
            </div>

            {/* Document Details Frame Preview */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center space-y-3 min-h-[180px]">
              {viewedDocType ? (
                <div className="space-y-2 w-full text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                      {viewedDocType.toUpperCase()} CERTIFICATE PREVIEW
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">PDF Document</span>
                  </div>
                  
                  {/* Mock content representation */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs font-mono">
                    <p className="text-slate-500">Document Name: <span className="text-slate-800 font-semibold">{
                      viewedDocType === 'registration' ? selectedTrip.docRegistration.fileUrl :
                      viewedDocType === 'insurance' ? selectedTrip.docInsurance.fileUrl :
                      viewedDocType === 'inspection' ? selectedTrip.docInspection.fileUrl :
                      selectedTrip.docLicense.fileUrl
                    }</span></p>
                    <p className="text-slate-500">Expiry Date: <span className="text-slate-800 font-semibold">{
                      viewedDocType === 'registration' ? selectedTrip.docRegistration.expiry :
                      viewedDocType === 'insurance' ? selectedTrip.docInsurance.expiry :
                      viewedDocType === 'inspection' ? selectedTrip.docInspection.expiry :
                      selectedTrip.docLicense.expiry
                    }</span></p>
                    <p className="text-slate-500">Issuer: Ministry of Transport & Logistics S.C.</p>
                    <div className="h-2 bg-slate-100 rounded"></div>
                    <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    File has been electronically verified with the National Logistics Agency portal API.
                  </p>
                </div>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-slate-300 animate-pulse" />
                  <div className="max-w-xs">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Document Selected</p>
                    <p className="text-[11px] text-slate-400 mt-1">Select one of the four certificates above to view the scanned PDF document.</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => { setActiveModal(null); setViewedDocType(null); }}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Close Documents
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: REJECT VEHICLE INPUT (FORM TRIGGER) */}
      {activeModal === 'reject' && selectedTrip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-zoomIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Confirm Vehicle Rejection</h3>
              </div>
              <button 
                onClick={() => setActiveModal('qehs')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Rejecting vehicle <strong>{selectedTrip.plateNumber}</strong> will block its staging process and alert the warehouse loading team.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-500 uppercase">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Bald tires on front axle and missing certified dry-powder fire extinguisher."
                  className="p-2 border border-slate-200 rounded-md bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-500 uppercase">Corrective Action Needed</label>
                <textarea
                  rows={2}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="e.g. Fit new front tires and equip verified 2kg carbon dioxide extinguisher."
                  className="p-2 border border-slate-200 rounded-md bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                onClick={() => setActiveModal('qehs')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Return to Checklist
              </button>

              <button
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Confirm Rejection
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: REPLACE ASSIGNED VEHICLE */}
      {activeModal === 'replace' && selectedTrip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-zoomIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Truck className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Replace Allocated Vehicle</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Choose an alternative compliant fleet vehicle from our master database. Swap handles direct driver allocation.
            </p>

            {/* Vehicles selector list */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {vehicles.map((v) => {
                const isCurrent = v.plateNumber === selectedTrip.plateNumber;
                return (
                  <div 
                    key={v.plateNumber}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs ${
                      isCurrent ? 'bg-slate-50/50 border-slate-200 pointer-events-none opacity-50' : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{v.plateNumber}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({v.model})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-500 mt-1">
                        <span>Payload: {v.tonCapacity} Tons</span>
                        <span>Route: {v.assignedRoute || 'No designated route'}</span>
                        <span>Driver: {v.driverName}</span>
                        <span>Status: <span className={v.status === 'Compliant' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{v.status}</span></span>
                      </div>
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => handleReplaceVehicle(v.plateNumber)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold cursor-pointer transition-colors"
                      >
                        Allocate
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel Swap
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: DISPATCH READINESS DETAILS */}
      {activeModal === 'readiness' && selectedTrip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-zoomIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <SlidersHorizontal className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Dispatch Readiness Details</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Loading Readiness Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3.5 text-xs">
              
              {/* Toggle 1: Loading Staging Complete */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100">
                <div>
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">Loading Staging Complete</span>
                  <span className="text-[10px] text-slate-400">Mark all palettes staged and secured on dock.</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleToggleStaging(!selectedTrip.loadingStagingComplete)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    selectedTrip.loadingStagingComplete ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      selectedTrip.loadingStagingComplete ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Warehouse Details Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Scheduled Arrival Time</span>
                  <span className="font-semibold text-slate-700">{selectedTrip.scheduledArrivalTime}</span>
                </div>
                
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Loading Supervisor</span>
                  <span className="font-semibold text-slate-700">{selectedTrip.loadingSupervisor}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase">Warehouse Access Notes</span>
                  <p className="font-semibold text-slate-600 italic bg-white p-2 rounded border border-slate-100 mt-1">
                    "{selectedTrip.warehouseAccessNotes}"
                  </p>
                </div>
              </div>

              {/* Exception Approval */}
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-100">
                <input 
                  type="checkbox" 
                  id="exc-checkbox" 
                  checked={selectedTrip.exceptionApprovalRequired}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTrips(prev => prev.map(t => t.id === selectedTrip.id ? { ...t, exceptionApprovalRequired: checked } : t));
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="exc-checkbox" className="text-slate-600 font-semibold cursor-pointer select-none">
                  Exception Approval Required (Bypass default checklist logs)
                </label>
              </div>

              {/* Current Readiness badge */}
              <div className="flex items-center justify-between p-2.5 bg-blue-100/50 rounded-lg text-blue-900 border border-blue-200">
                <span className="font-bold uppercase tracking-wider text-[10px]">Readiness Status</span>
                <span className="font-bold text-xs">
                  {selectedTrip.qehsStatus === 'Approved' && selectedTrip.loadingStagingComplete ? 'CLEAR FOR DISPATCH' : 'READINESS PENDING'}
                </span>
              </div>

            </div>

            <div className="flex items-center justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Save & Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
