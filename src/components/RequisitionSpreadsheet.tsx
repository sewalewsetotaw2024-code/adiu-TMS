import React, { useState, useRef } from 'react';
import { MR, RequisitionItem } from '../types';
import { Download, Upload, Copy, RefreshCw, Plus, Trash2, Check, FileSpreadsheet, X, FileUp } from 'lucide-react';
import * as XLSX from 'xlsx';

interface RequisitionSpreadsheetProps {
  mr: MR;
  onUpdateMr: (updatedMr: MR) => void;
}

export default function RequisitionSpreadsheet({ mr, onUpdateMr }: RequisitionSpreadsheetProps) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read metadata fields without hardcoded defaults
  const circleName = mr.circleName || '';
  const warehouseName = mr.warehouseName || '';
  const requestArrivedSiteTime = mr.requestArrivedSiteTime || mr.requestDate || '';
  const subcontractor = mr.subcontractor || '';
  const submitterName = mr.submitterName || '';
  const submitterTitle = mr.submitterTitle || '';
  const submitterCompany = mr.submitterCompany || '';
  const siteAddress = mr.siteAddress || mr.lineItems?.[0]?.siteId || '';
  const siteId = mr.lineItems?.[0]?.siteId || '';
  const poNo = mr.poNumber || '';

  const items = mr.requisitionItems || [];

  // Metadata update helper
  const updateMetaField = (field: string, value: string) => {
    onUpdateMr({
      ...mr,
      [field]: value
    });
  };

  // Items update helper
  const updateItems = (newItems: RequisitionItem[]) => {
    onUpdateMr({
      ...mr,
      requisitionItems: newItems
    });
  };

  const handleCellChange = (itemId: string, field: keyof RequisitionItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          [field]: field === 'quantity' ? Number(value) || 0 : value
        };
      }
      return item;
    });
    updateItems(updated);
  };

  const handleAddRow = () => {
    const newItem: RequisitionItem = {
      id: `req-li-${Date.now()}`,
      packageName: 'Installation&Accessory',
      packageDescription: 'for Full Rack',
      bomCode: '',
      description: '',
      etItemCode: '',
      quantity: 1,
      uom: 'PCS',
      remarksBoq: ''
    };
    updateItems([...items, newItem]);
  };

  const handleRemoveRow = (id: string) => {
    updateItems(items.filter(item => item.id !== id));
  };

  // Reset to the exact sample image data
  const handleLoadImageSample = () => {
    const sampleItems: RequisitionItem[] = [
      {
        id: 'sample-1',
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
        id: 'sample-2',
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
        id: 'sample-3',
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
        id: 'sample-4',
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
        id: 'sample-5',
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
        id: 'sample-6',
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
        id: 'sample-7',
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
        id: 'sample-8',
        packageName: 'Site Survey Auxiliary Material',
        packageDescription: 'ZXDTXN E001-Install',
        bomCode: '180000503201',
        description: 'Communication Power System Site Survey Auxiliary Material',
        etItemCode: '',
        quantity: 1,
        uom: 'KIT',
        remarksBoq: '1 Box'
      }
    ];

    onUpdateMr({
      ...mr,
      circleName: 'SER',
      warehouseName: 'Akaki Warehouse Network-6',
      requestArrivedSiteTime: '2026-06-28',
      subcontractor: 'ZTE',
      submitterName: 'Abraham Aydere',
      submitterTitle: 'Roll-Out Manager',
      submitterCompany: 'ZTE',
      siteAddress: '244856',
      requisitionItems: sampleItems
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    // Header section CSV rows
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `"MATERIAL REQUISITION"\n`;
    csvContent += `"Site ID","${siteId}","Circle Name","${circleName}","Site Address","${siteAddress}"\n`;
    csvContent += `"Warehouse Name","${warehouseName}","PO No","${poNo}","Subcontractor","${subcontractor}"\n`;
    csvContent += `"Request Shipment Time","${mr.requestDate}","Request Arrived Site Time","${requestArrivedSiteTime}","ERP Req/ISO no.","MR No: ${mr.mrNumber}"\n\n`;
    
    // Table section
    csvContent += `"Package Name","Package Description","BoM Code","Description","ET Item Code","Quantity","UOM","REMARKS/BOQ"\n`;
    items.forEach(item => {
      csvContent += `"${item.packageName}","${item.packageDescription}","${item.bomCode}","${item.description}","${item.etItemCode}","${item.quantity}","${item.uom}","${item.remarksBoq}"\n`;
    });

    csvContent += `\n"Company Name","Submitter Name","Submitter Title"\n`;
    csvContent += `"${submitterCompany}","${submitterName}","${submitterTitle}"\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZTE_Ethio_Requisition_${mr.mrNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      mrNumber: mr.mrNumber,
      poNumber: poNo,
      circleName,
      warehouseName,
      requestArrivedSiteTime,
      subcontractor,
      submitterName,
      submitterTitle,
      submitterCompany,
      siteAddress,
      requisitionItems: items
    }, null, 2));

    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `ZTE_Ethio_Requisition_${mr.mrNumber}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Tabular Data for Excel
  const handleCopyToClipboard = () => {
    let tsv = "Package Name\tPackage Description\tBoM Code\tDescription\tET Item Code\tQuantity\tUOM\tREMARKS/BOQ\n";
    items.forEach(item => {
      tsv += `${item.packageName}\t${item.packageDescription}\t${item.bomCode}\t${item.description}\t${item.etItemCode}\t${item.quantity}\t${item.uom}\t${item.remarksBoq}\n`;
    });
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Import Handler (File-based)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const result = evt.target?.result;
        if (!result) return;

        // If JSON
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(result as string);
          const importedItems: RequisitionItem[] = parsed.requisitionItems || parsed;
          
          if (Array.isArray(importedItems)) {
            const validatedItems = importedItems.map((item: any, i) => ({
              id: item.id || `imported-${Date.now()}-${i}`,
              packageName: item.packageName || item['Package Name'] || '',
              packageDescription: item.packageDescription || item['Package Description'] || '',
              bomCode: String(item.bomCode || item['BoM Code'] || ''),
              description: item.description || item['Description'] || '',
              etItemCode: String(item.etItemCode || item['ET Item Code'] || ''),
              quantity: Number(item.quantity || item['Quantity'] || 1),
              uom: item.uom || item['UOM'] || 'PCS',
              remarksBoq: item.remarksBoq || item['REMARKS/BOQ'] || ''
            }));

            onUpdateMr({
              ...mr,
              circleName: parsed.circleName || circleName,
              warehouseName: parsed.warehouseName || warehouseName,
              requestArrivedSiteTime: parsed.requestArrivedSiteTime || requestArrivedSiteTime,
              subcontractor: parsed.subcontractor || subcontractor,
              submitterName: parsed.submitterName || submitterName,
              submitterTitle: parsed.submitterTitle || submitterTitle,
              submitterCompany: parsed.submitterCompany || submitterCompany,
              siteAddress: parsed.siteAddress || siteAddress,
              requisitionItems: validatedItems
            });
            return;
          }
        }

        // CSV/XLSX handling
        let data: any[][];
        
        if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
          const text = result as string;
          const delimiter = file.name.endsWith('.tsv') ? '\t' : ',';
          data = text.split('\n').map(line => line.split(delimiter).map(cell => cell.trim().replace(/^"(.*)"$/, '$1')));
        } else {
          // Excel
          const dataBytes = new Uint8Array(result as ArrayBuffer);
          const workbook = XLSX.read(dataBytes, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        }

        // Process tabular data
        const validatedItems: RequisitionItem[] = [];
        data.forEach((parts, i) => {
          if (!parts || parts.length < 4) return;
          const lineStr = parts.join(' ').toLowerCase();
          if (i === 0 && (lineStr.includes('package') || lineStr.includes('bom'))) return;
          
          validatedItems.push({
            id: `imported-csv-${Date.now()}-${i}`,
            packageName: String(parts[0] || 'Imported Package'),
            packageDescription: String(parts[1] || ''),
            bomCode: String(parts[2] || ''),
            description: String(parts[3] || ''),
            etItemCode: String(parts[4] || ''),
            quantity: Number(parts[5]) || 1,
            uom: String(parts[6] || 'PCS'),
            remarksBoq: String(parts[7] || '')
          });
        });

        if (validatedItems.length > 0) {
          updateItems(validatedItems);
          alert('Import successful!');
        } else {
          alert('No valid items found in the file.');
        }
      } catch (e: any) {
        alert(`Parse error: ${e.message}`);
      }
    };

    if (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6" id="requisition-spreadsheet-module">
      
      {/* Refined Import / Export Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm mt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1D9E75]/10 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-[#1D9E75]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2C2C2A] uppercase tracking-wider font-sans">
              Material Requisition Spreadsheets
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Manage and import raw BoQ material lists.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Load Sample button */}
          <button
            onClick={handleLoadImageSample}
            title="Load the exact items shown in the Sample picture"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition-colors border border-gray-200 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
            Load Sample
          </button>

          {/* Import Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".csv, .tsv, .json, .xlsx, .xls"
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] hover:bg-[#168561] text-white rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import File
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>

          {/* Copy Tabular */}
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition-colors border border-gray-200 cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
            {copied ? 'Copied!' : 'Copy Data'}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2A] hover:bg-black text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-gray-300" />
            CSV
          </button>
        </div>
      </div>

      {/* Modernized SpreadSheet Grid */}
      <div className="bg-white border border-[#D3D1C7] p-8 rounded-xl shadow-sm overflow-x-auto select-none font-sans mt-6">
        <div className="min-w-[1000px] space-y-6">
          
          {/* Header Row */}
          <div className="flex justify-between items-center border-b-[3px] border-gray-800 pb-4">
            {/* Generic Logo / Client */}
            <div className="flex items-center gap-3 w-1/3">
              <div className="w-12 h-12 bg-[#1D9E75] rounded-full flex items-center justify-center p-1 border-2 border-white shadow-sm">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#1D9E75]">
                  {mr.vendorClient ? mr.vendorClient.substring(0, 2).toUpperCase() : 'MR'}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-gray-900 text-lg tracking-tight leading-none uppercase">
                  {mr.vendorClient || 'Client Name'}
                </span>
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Vendor / Client</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center flex flex-col justify-center w-1/3">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 leading-none">MATERIAL REQUISITION</h1>
              <div className="w-20 h-1 bg-gray-900 mx-auto mt-3"></div>
            </div>

            {/* Generic Subcontractor */}
            <div className="flex items-center justify-end gap-3 w-1/3">
              <div className="flex flex-col text-right">
                <span className="font-extrabold text-gray-800 text-lg tracking-tight leading-none uppercase">
                  {subcontractor || 'Company'}
                </span>
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Subcontractor</span>
              </div>
            </div>
          </div>

          {/* Form Requisition Grid (Matching the photo block style) */}
          <div className="grid grid-cols-12 border border-gray-300 text-sm font-sans rounded-lg overflow-hidden">
            
            {/* Row 1 */}
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 flex items-center">
              Site ID
            </div>
            <div className="col-span-2 p-2 border-r border-b border-gray-300 flex items-center bg-white font-mono font-bold">
              <input
                type="text"
                className="w-full bg-transparent border-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 rounded px-1"
                value={siteId}
                disabled
                placeholder="244856"
              />
            </div>
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 flex items-center">
              Circle Name
            </div>
            <div className="col-span-2 p-2 border-r border-b border-gray-300 flex items-center bg-white">
              <input
                type="text"
                className="w-full bg-transparent border-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 rounded px-1 font-semibold"
                value={circleName}
                onChange={(e) => updateMetaField('circleName', e.target.value)}
                placeholder="SER"
              />
            </div>
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 flex items-center">
              Site Address
            </div>
            <div className="col-span-2 p-2 border-b border-gray-300 flex items-center bg-white font-mono">
              <input
                type="text"
                className="w-full bg-transparent border-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 rounded px-1"
                value={siteAddress}
                onChange={(e) => updateMetaField('siteAddress', e.target.value)}
                placeholder="244856"
              />
            </div>

            {/* Row 2 */}
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 flex items-center">
              Warehouse Name
            </div>
            <div className="col-span-6 p-2 border-r border-b border-gray-300 flex items-center bg-white">
              <input
                type="text"
                className="w-full bg-transparent border-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 rounded px-1 font-semibold"
                value={warehouseName}
                onChange={(e) => updateMetaField('warehouseName', e.target.value)}
                placeholder="Akaki Warehouse Network-6"
              />
            </div>
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 flex items-center">
              Subcontractor
            </div>
            <div className="col-span-2 p-2 border-b border-gray-300 flex items-center bg-white">
              <input
                type="text"
                className="w-full bg-transparent border-none text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 rounded px-1"
                value={subcontractor}
                onChange={(e) => updateMetaField('subcontractor', e.target.value)}
                placeholder="ZTE"
              />
            </div>

            {/* Row 3 */}
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 flex items-center">
              PO No
            </div>
            <div className="col-span-6 p-2 border-r border-b border-gray-300 flex items-center bg-white">
              <input
                type="text"
                className="w-full bg-transparent border-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 rounded px-1 font-mono font-bold"
                value={poNo}
                disabled
                placeholder="137414"
              />
            </div>
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 flex items-center">
              ERP Req/ISO no.
            </div>
            <div className="col-span-2 p-2 border-b border-gray-300 flex items-center bg-gray-50 font-mono text-xs font-bold text-gray-600 overflow-hidden truncate">
              MR No: {mr.mrNumber}
            </div>

            {/* Row 4 */}
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-gray-300 flex items-center">
              Shipment Time
            </div>
            <div className="col-span-4 p-2 border-r border-gray-300 flex items-center bg-white">
              <input
                type="date"
                className="w-full bg-transparent border-none text-gray-900 focus:outline-none font-mono"
                value={mr.requestDate}
                disabled
              />
            </div>
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-gray-300 flex items-center">
              Arrived Site Time
            </div>
            <div className="col-span-4 p-2 flex items-center bg-white">
              <input
                type="date"
                className="w-full bg-transparent border-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 rounded px-1 font-mono font-semibold"
                value={requestArrivedSiteTime}
                onChange={(e) => updateMetaField('requestArrivedSiteTime', e.target.value)}
              />
            </div>
          </div>

          {/* Table Container Segment Title */}
          <div className="bg-[#2C2C2A] text-white p-3 font-bold text-center uppercase tracking-widest text-sm rounded-t-lg mt-6 shadow-sm">
            Delivery Note (DN) Item Ledger
          </div>

          {/* Requisition Table Grid */}
          <div className="rounded-b-lg border border-gray-300 overflow-hidden shadow-sm">
            <table className="w-full border-collapse" id="requisition-items-table-grid">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold text-left text-xs uppercase tracking-wider border-b border-gray-300">
                  <th className="p-3 border-r border-gray-200">Package Name</th>
                  <th className="p-3 border-r border-gray-200">Package Description</th>
                  <th className="p-3 border-r border-gray-200">BoM Code</th>
                  <th className="p-3 border-r border-gray-200 w-[20%]">Description</th>
                  <th className="p-3 border-r border-gray-200 text-center">ET Item Code</th>
                  <th className="p-3 border-r border-gray-200 text-center">Qty</th>
                  <th className="p-3 border-r border-gray-200 text-center">UOM</th>
                  <th className="p-3 border-r border-gray-200">Remarks/BOQ</th>
                  <th className="p-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-gray-500 bg-gray-50">
                      <div className="flex flex-col items-center">
                        <FileSpreadsheet className="w-10 h-10 text-gray-300 mb-3" />
                        <span className="font-semibold text-gray-700 text-base">Spreadsheet is empty</span>
                        <span className="text-sm mt-1">Import from Excel or add a row manually to start.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 text-sm transition-colors group">
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="text"
                          className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[#1D9E75] focus:bg-white focus:ring-1 focus:ring-[#1D9E75] rounded px-2 py-1.5 transition-all text-gray-800 font-medium"
                          value={item.packageName}
                          onChange={(e) => handleCellChange(item.id, 'packageName', e.target.value)}
                        />
                      </td>
                      
                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="text"
                          className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[#1D9E75] focus:bg-white focus:ring-1 focus:ring-[#1D9E75] rounded px-2 py-1.5 transition-all text-gray-800"
                          value={item.packageDescription}
                          onChange={(e) => handleCellChange(item.id, 'packageDescription', e.target.value)}
                        />
                      </td>

                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="text"
                          className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[#1D9E75] focus:bg-white focus:ring-1 focus:ring-[#1D9E75] rounded px-2 py-1.5 transition-all font-mono text-gray-900 text-xs font-bold"
                          value={item.bomCode}
                          onChange={(e) => handleCellChange(item.id, 'bomCode', e.target.value)}
                        />
                      </td>

                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="text"
                          className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[#1D9E75] focus:bg-white focus:ring-1 focus:ring-[#1D9E75] rounded px-2 py-1.5 transition-all text-gray-700"
                          value={item.description}
                          onChange={(e) => handleCellChange(item.id, 'description', e.target.value)}
                        />
                      </td>

                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="text"
                          className="w-full text-center bg-transparent border border-transparent hover:border-gray-300 focus:border-[#1D9E75] focus:bg-white focus:ring-1 focus:ring-[#1D9E75] rounded px-2 py-1.5 transition-all font-mono text-gray-600 text-xs"
                          value={item.etItemCode}
                          onChange={(e) => handleCellChange(item.id, 'etItemCode', e.target.value)}
                        />
                      </td>

                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="number"
                          className="w-full text-center bg-transparent border border-transparent hover:border-gray-300 focus:border-[#1D9E75] focus:bg-white focus:ring-1 focus:ring-[#1D9E75] rounded px-2 py-1.5 transition-all font-bold text-gray-900"
                          value={item.quantity}
                          onChange={(e) => handleCellChange(item.id, 'quantity', e.target.value)}
                        />
                      </td>

                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="text"
                          className="w-full text-center bg-transparent border border-transparent hover:border-gray-300 focus:border-[#1D9E75] focus:bg-white focus:ring-1 focus:ring-[#1D9E75] rounded px-2 py-1.5 transition-all font-mono font-bold text-gray-600 uppercase text-xs"
                          value={item.uom}
                          onChange={(e) => handleCellChange(item.id, 'uom', e.target.value)}
                        />
                      </td>

                      <td className="p-2 border-r border-gray-200">
                        <input
                          type="text"
                          className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[#1D9E75] focus:bg-white focus:ring-1 focus:ring-[#1D9E75] rounded px-2 py-1.5 transition-all text-gray-600 text-xs italic"
                          value={item.remarksBoq}
                          onChange={(e) => handleCellChange(item.id, 'remarksBoq', e.target.value)}
                          placeholder="Notes"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveRow(item.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Add Row controller */}
            <div className="flex justify-between items-center bg-gray-50 p-4 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-mono font-medium bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm">
                Records: {items.length}
              </span>
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white rounded-lg text-sm font-bold cursor-pointer transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
          </div>

          {/* Signatures Panel */}
          <div className="grid grid-cols-12 border border-gray-300 rounded-lg mt-6 overflow-hidden font-sans shadow-sm">
            {/* Header row */}
            <div className="col-span-3 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 text-center">
              Company Name
            </div>
            <div className="col-span-5 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 text-center text-sm">
              MR Submitted by (Subcontractor)
            </div>
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-r border-b border-gray-300 text-center text-xs">
              MR Created by
            </div>
            <div className="col-span-2 bg-gray-100 p-3 font-bold text-gray-700 border-b border-gray-300 text-center text-xs">
              MR Approved by
            </div>

            {/* Field: Name */}
            <div className="col-span-3 bg-gray-50 p-3 border-r border-b border-gray-300 font-semibold text-gray-600 flex items-center justify-center">
              Name
            </div>
            <div className="col-span-5 p-2 border-r border-b border-gray-300 bg-white">
              <input
                type="text"
                className="w-full text-center bg-transparent border border-transparent focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] rounded py-1.5 text-gray-900 font-bold"
                value={submitterName}
                onChange={(e) => updateMetaField('submitterName', e.target.value)}
                placeholder="Abraham Aydere"
              />
            </div>
            <div className="col-span-2 p-3 border-r border-b border-gray-300 bg-emerald-50/50 font-bold text-[#1D9E75] text-center flex items-center justify-center text-sm">
              {mr.vendorClient || 'Client'}
            </div>
            <div className="col-span-2 p-3 border-b border-gray-300 bg-emerald-50/50 font-bold text-[#1D9E75] text-center flex items-center justify-center text-sm">
              {mr.vendorClient || 'Client'}
            </div>

            {/* Field: Title */}
            <div className="col-span-3 bg-gray-50 p-3 border-r border-gray-300 font-semibold text-gray-600 flex items-center justify-center">
              Title
            </div>
            <div className="col-span-5 p-2 border-r border-gray-300 bg-white">
              <input
                type="text"
                className="w-full text-center bg-transparent border border-transparent focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] rounded py-1.5 text-gray-700 text-sm"
                value={submitterTitle}
                onChange={(e) => updateMetaField('submitterTitle', e.target.value)}
                placeholder="Roll-Out Manager"
              />
            </div>
            <div className="col-span-2 p-3 border-r border-gray-300 bg-gray-50 text-gray-400 text-center italic text-xs flex items-center justify-center gap-1">
              <Check className="w-3 h-3"/> Verified
            </div>
            <div className="col-span-2 p-3 bg-gray-50 text-gray-400 text-center italic text-xs flex items-center justify-center gap-1">
              <Check className="w-3 h-3"/> Approved
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
