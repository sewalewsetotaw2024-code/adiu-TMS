import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Import Screens
import DashboardScreen from './components/DashboardScreen';
import MrScreen from './components/MrScreen';
import WorkAnalysisScreen from './components/WorkAnalysisScreen';
import SupplierScreen from './components/SupplierScreen';
import PriceBookScreen from './components/PriceBookScreen';
import VehicleScreen from './components/VehicleScreen';
import DispatchComplianceScreen from './components/DispatchCompliance';
import DriverScreen from './components/DriverScreen';
import SitesScreen from './components/SitesScreen';
import ItemCategoryScreen from './components/ItemCategoryScreen';
import ProfitabilityScreen from './components/ProfitabilityScreen';
import SupplierQuotationScreen from './components/SupplierQuotationScreen';
import ItemTrackingScreen from './components/ItemTrackingScreen';
import LoadingConfirmationScreen from './components/LoadingConfirmationScreen';
import WccScreen from './components/WccScreen';
import IncidentScreen from './components/IncidentScreen';
import SettingsScreen from './components/SettingsScreen';
import TrackingScreen from './components/TrackingScreen';

// Types & Initial Data
import { 
  MR, 
  WorkAnalysis, 
  Supplier, 
  PriceBookEntry, 
  PriceThresholdConfig, 
  Vehicle, 
  ProjectSite, 
  StoreCluster, 
  ItemCategory, 
  ProfitabilityAnalysis, 
  DeliveryJob, 
  WccClosure,
  Driver,
  Project,
  SupplierQuotation,
  Incident,
  TripTracking,
  TransportRequestItem,
  LoadingConfirmationData
} from './types';

import {
  INITIAL_MRS,
  INITIAL_WORK_ANALYSIS,
  INITIAL_SUPPLIERS,
  INITIAL_PRICE_BOOK,
  INITIAL_PRICE_CONFIGS,
  INITIAL_VEHICLES,
  INITIAL_SITES,
  INITIAL_CLUSTERS,
  INITIAL_CATEGORIES,
  INITIAL_PAS,
  INITIAL_DELIVERIES,
  INITIAL_WCC_CLOSURES,
  INITIAL_DRIVERS,
  INITIAL_PROJECTS,
  INITIAL_QUOTATIONS,
  INITIAL_INCIDENTS,
  INITIAL_TRACKING,
  INITIAL_ITEM_TRACKING,
  INITIAL_LOADING_CONFIRMATIONS
} from './data';

import { Settings, ShieldCheck, Database, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  
  // Data State Pools
  const [mrs, setMrs] = useState<MR[]>(INITIAL_MRS);
  const [workAnalyses, setWorkAnalyses] = useState<WorkAnalysis[]>(INITIAL_WORK_ANALYSIS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [priceBook, setPriceBook] = useState<PriceBookEntry[]>(INITIAL_PRICE_BOOK);
  const [thresholdConfigs, setThresholdConfigs] = useState<PriceThresholdConfig[]>(INITIAL_PRICE_CONFIGS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [sites, setSites] = useState<ProjectSite[]>(INITIAL_SITES);
  const [clusters, setClusters] = useState<StoreCluster[]>(INITIAL_CLUSTERS);
  const [categories, setCategories] = useState<ItemCategory[]>(INITIAL_CATEGORIES);
  const [pas, setPas] = useState<ProfitabilityAnalysis[]>(INITIAL_PAS);
  const [deliveries, setDeliveries] = useState<DeliveryJob[]>(INITIAL_DELIVERIES);
  const [wccClosures, setWccClosures] = useState<WccClosure[]>(INITIAL_WCC_CLOSURES);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [quotations, setQuotations] = useState<SupplierQuotation[]>(INITIAL_QUOTATIONS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [tracking, setTracking] = useState<TripTracking[]>(INITIAL_TRACKING);
  const [itemTracking, setItemTracking] = useState<TransportRequestItem[]>(INITIAL_ITEM_TRACKING);
  const [loadingConfirmations, setLoadingConfirmations] = useState<LoadingConfirmationData[]>(INITIAL_LOADING_CONFIRMATIONS);

  // Cross-screen contextual references
  const [selectedMrRef, setSelectedMrRef] = useState<string | null>(null);

  // --- Callback State Modifiers ---

  const handleSaveProject = (updatedProject: Project) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === updatedProject.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedProject;
        return copy;
      } else {
        return [updatedProject, ...prev];
      }
    });
  };

  const handleRemoveProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleSaveMr = (updatedMr: MR) => {
    setMrs(prev => {
      const idx = prev.findIndex(m => m.mrNumber === updatedMr.mrNumber);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedMr;
        return copy;
      } else {
        return [updatedMr, ...prev];
      }
    });

    // Automatically create a corresponding blank Work Analysis when MR is raised
    const hasWa = workAnalyses.some(w => w.mrRef === updatedMr.mrNumber);
    if (!hasWa) {
      const distance = updatedMr.lineItems[0]?.distance || 150;
      const newWa: WorkAnalysis = {
        id: `WA-NEW-${Date.now()}`,
        mrRef: updatedMr.mrNumber,
        preparedBy: 'Solomon Tekle',
        date: new Date().toISOString().split('T')[0],
        sites: [
          {
            id: `was-add-${Date.now()}`,
            siteId: updatedMr.lineItems[0]?.siteId || 'ET-ADD-102',
            siteName: updatedMr.lineItems[0]?.siteName || 'Bole Medhanialem High',
            latitude: updatedMr.lineItems[0]?.latitude || 9.0,
            longitude: updatedMr.lineItems[0]?.longitude || 38.0,
            mwLinks: updatedMr.lineItems[0]?.mwLinks || '',
            town: updatedMr.lineItems[0]?.town || 'Addis Ababa',
            projectScope: updatedMr.lineItems[0]?.projectScope || '',
            zoneManager: updatedMr.lineItems[0]?.zoneManager || '',
            implementationPriority: updatedMr.lineItems[0]?.implementationPriority || 'Medium',
            distance: distance,
            recommendedTruck: '3-ton'
          }
        ],
        truckTypeRecommended: '3-ton',
        totalSites: 1,
        totalDistance: distance,
        estimatedTrips: 1,
        specialRequirements: ['Last-mile labour'],
        keyRisks: 'Standard transit risks.',
        scopeNegotiationNotes: '',
        validatedBy: 'Yonas Berhe',
        validationDate: '',
        status: 'Pending'
      };
      setWorkAnalyses(prev => [newWa, ...prev]);
    }
  };

  const handleSaveWorkAnalysis = (updatedWa: WorkAnalysis) => {
    setWorkAnalyses(prev => {
      const idx = prev.findIndex(w => w.mrRef === updatedWa.mrRef);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedWa;
        return copy;
      } else {
        return [updatedWa, ...prev];
      }
    });
  };

  const handleAddQuotation = (q: SupplierQuotation) => {
    setQuotations(prev => [...prev, q]);
  };

  const handleDeleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveSupplier = (updatedSup: Supplier) => {
    setSuppliers(prev => {
      const idx = prev.findIndex(s => s.id === updatedSup.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSup;
        return copy;
      } else {
        return [updatedSup, ...prev];
      }
    });
  };

  const handleSavePriceEntry = (entry: PriceBookEntry) => {
    setPriceBook(prev => {
      const idx = prev.findIndex(p => p.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      } else {
        return [entry, ...prev];
      }
    });
  };

  const handleRemovePriceEntry = (id: string) => {
    setPriceBook(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveThresholdConfig = (config: PriceThresholdConfig) => {
    setThresholdConfigs(prev => {
      const idx = prev.findIndex(t => t.supplierId === config.supplierId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = config;
        return copy;
      } else {
        return [config, ...prev];
      }
    });
  };

  const handleSaveVehicle = (vehicle: Vehicle) => {
    setVehicles(prev => {
      const idx = prev.findIndex(v => v.plateNumber === vehicle.plateNumber);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = vehicle;
        return copy;
      } else {
        return [vehicle, ...prev];
      }
    });

    // Sync back to drivers list
    if (vehicle.driverId) {
      setDrivers(prev => prev.map(d => {
        if (d.id === vehicle.driverId) {
          return { ...d, assignedVehiclePlate: vehicle.plateNumber, name: vehicle.driverName, phone: vehicle.driverPhone };
        }
        if (d.assignedVehiclePlate === vehicle.plateNumber && d.id !== vehicle.driverId) {
          return { ...d, assignedVehiclePlate: '' };
        }
        return d;
      }));
    } else {
      setDrivers(prev => prev.map(d => {
        if (d.assignedVehiclePlate === vehicle.plateNumber) {
          return { ...d, assignedVehiclePlate: '' };
        }
        return d;
      }));
    }
  };

  const handleSaveDriver = (updatedDriver: Driver) => {
    setDrivers(prev => {
      const idx = prev.findIndex(d => d.id === updatedDriver.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedDriver;
        return copy;
      } else {
        return [updatedDriver, ...prev];
      }
    });

    // Maintain relationship on vehicle
    if (updatedDriver.assignedVehiclePlate) {
      setVehicles(prev => prev.map(v => {
        if (v.plateNumber === updatedDriver.assignedVehiclePlate) {
          return {
            ...v,
            driverId: updatedDriver.id,
            driverName: updatedDriver.name,
            driverPhone: updatedDriver.phone
          };
        }
        if (v.driverId === updatedDriver.id && v.plateNumber !== updatedDriver.assignedVehiclePlate) {
          return {
            ...v,
            driverId: '',
            driverName: '',
            driverPhone: ''
          };
        }
        return v;
      }));
    } else {
      setVehicles(prev => prev.map(v => {
        if (v.driverId === updatedDriver.id) {
          return {
            ...v,
            driverId: '',
            driverName: '',
            driverPhone: ''
          };
        }
        return v;
      }));
    }
  };

  const handleRemoveDriver = (driverId: string) => {
    setDrivers(prev => prev.filter(d => d.id !== driverId));
    setVehicles(prev => prev.map(v => {
      if (v.driverId === driverId) {
        return {
          ...v,
          driverId: '',
          driverName: '',
          driverPhone: ''
        };
      }
      return v;
    }));
  };

  const handleSaveSite = (site: ProjectSite) => {
    setSites(prev => {
      const idx = prev.findIndex(s => s.siteId === site.siteId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = site;
        return copy;
      } else {
        return [site, ...prev];
      }
    });
  };

  const handleSaveCluster = (cluster: StoreCluster) => {
    setClusters(prev => {
      const idx = prev.findIndex(c => c.id === cluster.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = cluster;
        return copy;
      } else {
        return [cluster, ...prev];
      }
    });
  };

  const handleRemoveCluster = (id: string) => {
    setClusters(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveCategory = (cat: ItemCategory) => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === cat.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = cat;
        return copy;
      } else {
        return [cat, ...prev];
      }
    });
  };

  const handleRemoveCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleSavePa = (updatedPa: ProfitabilityAnalysis) => {
    setPas(prev => {
      const idx = prev.findIndex(p => p.paNumber === updatedPa.paNumber);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedPa;
        return copy;
      } else {
        return [updatedPa, ...prev];
      }
    });

    // If PA is approved, create delivery tracker job automatically
    if (updatedPa.approvalStatus === 'Approved') {
      const matchedMr = mrs.find(m => m.mrNumber === updatedPa.mrRef);
      const deliveryExists = deliveries.some(d => d.mrRef === updatedPa.mrRef);
      if (!deliveryExists && matchedMr) {
        const newDelivery: DeliveryJob = {
          mrRef: updatedPa.mrRef,
          siteId: matchedMr.lineItems[0]?.siteId || 'ET-ADD-102',
          supplierId: updatedPa.selectedSupplierId,
          truck: matchedMr.lineItems[0]?.truck || '3-ton',
          driver: 'Ashenafi Hailu (+251911928374)',
          status: 'Loading',
          loadingConfirmed: false,
          loadingPhotoUrl: '',
          loadingTime: '',
          inTransitGpsStatus: 'GPS Module Online. Position: Standard terminal.',
          inTransitEta: '3 hours remaining',
          deliveryPhotoUrl: '',
          deliveryTime: '',
          signedMrConfirmed: false,
          signedMrPhotoUrl: '',
          supervisorUnavailable: false,
          escalationNote: '',
          lastMileRequired: false,
          lastMileMethod: '',
          lastMileCost: 0,
          lastMileApprovalStatus: 'Pending',
          lastMilePhotoUrl: ''
        };
        setDeliveries(prev => [newDelivery, ...prev]);

        // Also create a WCC closure request automatically
        const wccExists = wccClosures.some(w => w.mrRef === updatedPa.mrRef);
        if (!wccExists) {
          const newWcc: WccClosure = {
            mrRef: updatedPa.mrRef,
            poNumber: `PO-88091-${updatedPa.paNumber.split('-')[2]}`,
            poAmount: matchedMr.lineItems[0]?.distance ? matchedMr.lineItems[0].distance * 110 + 7500 : 18000,
            supplierInvoiceAmount: matchedMr.lineItems[0]?.distance ? matchedMr.lineItems[0].distance * 110 + 7500 : 18000,
            poVariance: 0,
            poVariancePercent: 0,
            docMrSigned: false,
            docDeliveryPhoto: false,
            docWorkOrderCopy: false,
            docGrn: false,
            docSupplierInvoice: false,
            basecampStatus: 'Active',
            wccStatus: 'Not applied'
          };
          setWccClosures(prev => [newWcc, ...prev]);
        }
      }
    }
  };

  const handleSaveDelivery = (updatedDelivery: DeliveryJob) => {
    setDeliveries(prev => {
      const idx = prev.findIndex(d => d.mrRef === updatedDelivery.mrRef);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedDelivery;
        return copy;
      } else {
        return [updatedDelivery, ...prev];
      }
    });
  };

  const handleSaveItemTracking = (updatedTracking: TransportRequestItem) => {
    setItemTracking(prev => {
      const idx = prev.findIndex(t => t.tripId === updatedTracking.tripId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedTracking;
        return copy;
      } else {
        return [updatedTracking, ...prev];
      }
    });
  };

  const handleSaveLoadingConfirmation = (updatedConfirmation: LoadingConfirmationData) => {
    setLoadingConfirmations(prev => {
      const idx = prev.findIndex(c => c.tripId === updatedConfirmation.tripId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedConfirmation;
        return copy;
      } else {
        return [updatedConfirmation, ...prev];
      }
    });
  };

  const handleSaveWcc = (updatedWcc: WccClosure) => {
    setWccClosures(prev => {
      const idx = prev.findIndex(w => w.mrRef === updatedWcc.mrRef);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedWcc;
        return copy;
      } else {
        return [updatedWcc, ...prev];
      }
    });
  };

  const handleSaveTracking = (updatedTrip: TripTracking) => {
    setTracking(prev => {
      const idx = prev.findIndex(t => t.mrRef === updatedTrip.mrRef);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedTrip;
        return copy;
      } else {
        return [updatedTrip, ...prev];
      }
    });
  };

  const handleSaveIncident = (updatedIncident: Incident) => {
    setIncidents(prev => {
      const idx = prev.findIndex(i => i.id === updatedIncident.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedIncident;
        return copy;
      } else {
        return [updatedIncident, ...prev];
      }
    });
  };

  // Reset helper
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to restore default Adiu mock data sets?')) {
      setMrs(INITIAL_MRS);
      setWorkAnalyses(INITIAL_WORK_ANALYSIS);
      setSuppliers(INITIAL_SUPPLIERS);
      setPriceBook(INITIAL_PRICE_BOOK);
      setThresholdConfigs(INITIAL_PRICE_CONFIGS);
      setVehicles(INITIAL_VEHICLES);
      setSites(INITIAL_SITES);
      setClusters(INITIAL_CLUSTERS);
      setCategories(INITIAL_CATEGORIES);
      setPas(INITIAL_PAS);
      setDeliveries(INITIAL_DELIVERIES);
      setWccClosures(INITIAL_WCC_CLOSURES);
      setQuotations(INITIAL_QUOTATIONS);
      setIncidents(INITIAL_INCIDENTS);
      setTracking(INITIAL_TRACKING);
      setItemTracking(INITIAL_ITEM_TRACKING);
      setLoadingConfirmations(INITIAL_LOADING_CONFIRMATIONS);
      alert('Mock data successfully restored!');
    }
  };

  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    switch (currentScreen) {
      case 'dashboard': return ['Operations Dashboard', 'Main KPI view'];
      case 'mr': return ['Material Requests (MR)', 'Form & Dispatch Registry'];
      case 'work-analysis': return ['Work Analysis', 'Cost Calculations'];
      case 'suppliers': return ['Logistics Partners', 'Supplier Registry'];
      case 'price-book': return ['Price Book', 'Ex-VAT Standard Contracts'];
      case 'vehicles': return ['Vehicles & QEHS', 'Driver Auditing'];
      case 'sites': return ['Project Sites', 'Geofencing & Store Clusters'];
      case 'categories': return ['Material Classification', 'Item Categories'];
      case 'profitability': return ['Profitability Analysis', 'Quote Valuation & Work Order'];
      case 'item-tracking': return ['Item Tracking & POD', 'Line Item Dispatch & Delivery Proof'];
      case 'loading-confirmation': return ['Loading Confirmation', 'Warehouse Outbound Scan'];
      case 'tracking': return ['GPS Tracking & Route Execution', 'Live Position, Geofences & Alerts'];
      case 'incidents': return ['Incident Management', 'Investigation & Accountability'];
      case 'wcc': return ['WCC Closure', 'Document Audit & PO Reconciliation'];
      case 'settings': return ['Configuration', 'Database Parameters'];
      default: return ['Adiu TMS', 'Transport Management System'];
    }
  };

  // Render active screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen 
            mrs={mrs}
            pas={pas}
            deliveries={deliveries}
            wccClosures={wccClosures}
            setSelectedMrRef={setSelectedMrRef}
            setScreen={setCurrentScreen}
          />
        );
      case 'mr':
        return (
          <MrScreen 
            mrs={mrs}
            onSaveMr={handleSaveMr}
            selectedMrRef={selectedMrRef}
            setSelectedMrRef={setSelectedMrRef}
          />
        );
      case 'work-analysis':
        return (
          <WorkAnalysisScreen 
            workAnalyses={workAnalyses}
            mrs={mrs}
            onSaveWorkAnalysis={handleSaveWorkAnalysis}
            selectedMrRef={selectedMrRef}
          />
        );
      case 'suppliers':
        return (
          <SupplierScreen 
            suppliers={suppliers}
            onSaveSupplier={handleSaveSupplier}
          />
        );
      case 'price-book':
        return (
          <PriceBookScreen 
            priceBook={priceBook}
            suppliers={suppliers}
            categories={categories}
            thresholdConfigs={thresholdConfigs}
            onSavePriceEntry={handleSavePriceEntry}
            onSaveThresholdConfig={handleSaveThresholdConfig}
            onRemovePriceEntry={handleRemovePriceEntry}
          />
        );
      case 'vehicles':
        return (
          <VehicleScreen 
            vehicles={vehicles}
            suppliers={suppliers}
            drivers={drivers}
            onSaveVehicle={handleSaveVehicle}
          />
        );
      case 'compliance':
        return (
          <DispatchComplianceScreen 
            vehicles={vehicles}
            suppliers={suppliers}
            drivers={drivers}
            onSaveVehicle={handleSaveVehicle}
          />
        );
      case 'drivers':
        return (
          <DriverScreen 
            drivers={drivers}
            vehicles={vehicles}
            onSaveDriver={handleSaveDriver}
            onRemoveDriver={handleRemoveDriver}
          />
        );
      case 'sites':
        return (
          <SitesScreen 
            sites={sites}
            clusters={clusters}
            projects={projects}
            onSaveSite={handleSaveSite}
            onSaveCluster={handleSaveCluster}
            onRemoveCluster={handleRemoveCluster}
            onSaveProject={handleSaveProject}
            onRemoveProject={handleRemoveProject}
          />
        );
      case 'categories':
        return (
          <ItemCategoryScreen 
            categories={categories}
            onSaveCategory={handleSaveCategory}
            onRemoveCategory={handleRemoveCategory}
          />
        );
      case 'profitability':
        return (
          <ProfitabilityScreen 
            pas={pas}
            mrs={mrs}
            suppliers={suppliers}
            onSavePa={handleSavePa}
            selectedMrRef={selectedMrRef}
            setSelectedMrRef={setSelectedMrRef}
            priceBook={priceBook}
            workAnalyses={workAnalyses}
            quotations={quotations}
            setScreen={setCurrentScreen}
          />
        );
      case 'supplier-quotation':
        return (
          <SupplierQuotationScreen 
            suppliers={suppliers}
            priceBook={priceBook}
            workAnalyses={workAnalyses}
            mrs={mrs}
            quotations={quotations}
            onAddQuotation={handleAddQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            setScreen={setCurrentScreen}
            setSelectedMrRef={setSelectedMrRef}
          />
        );
      case 'item-tracking':
        return (
          <ItemTrackingScreen 
            itemTracking={itemTracking}
            onSaveItemTracking={handleSaveItemTracking}
            setScreen={setCurrentScreen}
          />
        );
      case 'loading-confirmation':
        return (
          <LoadingConfirmationScreen 
            itemTracking={itemTracking}
            loadingConfirmations={loadingConfirmations}
            onSaveLoadingConfirmation={handleSaveLoadingConfirmation}
            setScreen={setCurrentScreen}
          />
        );
      case 'tracking':
        return (
          <TrackingScreen
            tracking={tracking}
            onSaveTracking={handleSaveTracking}
          />
        );
      case 'incidents':
        return (
          <IncidentScreen
            incidents={incidents}
            onSaveIncident={handleSaveIncident}
            mrs={mrs}
            vehicles={vehicles}
            drivers={drivers}
            suppliers={suppliers}
            sites={sites}
            prefillMrRef={selectedMrRef}
          />
        );
      case 'wcc':
        return (
          <WccScreen 
            wccClosures={wccClosures}
            mrs={mrs}
            onSaveWcc={handleSaveWcc}
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            thresholdConfigs={thresholdConfigs}
            onSaveThresholdConfig={handleSaveThresholdConfig}
            onResetData={handleResetData}
          />
        );
      default:
        return <div className="text-xs text-[#5F5E5A] p-6">Active module is loading or unavailable.</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1EFE8] font-sans antialiased text-[#2C2C2A]" id="adiu-tms-app">
      
      {/* Sidebar Navigation (Fixed 240px width) */}
      <Sidebar 
        currentScreen={currentScreen} 
        setScreen={setCurrentScreen} 
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col pl-[240px] min-w-0">
        
        {/* Top Header bar */}
        <Header 
          currentScreen={currentScreen} 
        />

        {/* Inner Content Area */}
        <main className="p-6 flex-1 max-w-[1400px] w-full mx-auto" id="main-scroll-pane">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
