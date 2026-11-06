// src/utils/workOrderExcel.ts
import * as XLSX from 'xlsx';
import { ProfitabilityAnalysis, Supplier, WorkAnalysis, MR } from '../types';
import { numberToBirrWords } from './numberToWords';

export interface WorkOrderExportData {
  pa: ProfitabilityAnalysis;
  supplier: Supplier;
  workAnalysis?: WorkAnalysis;
  mr?: MR;
}

export async function generateAdiuWorkOrderExcel({ pa, supplier, workAnalysis, mr }: WorkOrderExportData): Promise<void> {
  const winnerQuote = pa.quoteComparison.find(q => q.supplierId === (pa.selectedSupplierId || pa.supplierId));
  const totalPrice = winnerQuote ? winnerQuote.quotedPrice : 0;
  const outboundDate = pa.issuedDate || pa.date || new Date().toISOString().split('T')[0];
  const truckType = workAnalysis?.truckTypeRecommended || '5 Ton(Isuzu)';
  const sites = workAnalysis?.sites && workAnalysis.sites.length > 0 
    ? workAnalysis.sites 
    : (mr?.lineItems as any[]) || [];

  try {
    // 1. Try to load the official ADIU WORK ORDER Template.xlsx from public/templates
    const response = await fetch('/templates/ADIU_WORK_ORDER_Template.xlsx');
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets['Sheet1'];

      if (ws) {
        // Document Header & Work Order No
        ws['L2'] = { t: 's', v: `Work Order No.: ${pa.workOrderNumber}` };
        ws['L3'] = { t: 's', v: `Date: ${outboundDate}` };

        // Transporter Details
        ws['C4'] = { t: 's', v: supplier.name };
        ws['G4'] = { t: 's', v: supplier.tin || '________________' };
        ws['C5'] = { t: 's', v: supplier.contactPerson || '________________' };
        ws['G5'] = { t: 's', v: supplier.phone || '________________' };
        ws['C6'] = { t: 's', v: supplier.address || '________________' };
        ws['G6'] = { t: 's', v: supplier.licenseNo || 'AGR-2026-TR-ADIU' };

        // Transportation Assignment Rows
        // Template has rows 10 to 27 for assignments
        const startRow = 10;
        const maxTemplateRows = 18; // rows 10 to 27

        const displaySites = sites.length > 0 ? sites : [
          {
            siteId: 'Direct',
            siteName: workAnalysis?.route || 'Direct Delivery',
            longitude: null,
            latitude: null,
            town: workAnalysis?.route || 'Addis Ababa',
            region: 'SWR',
            projectScope: 'WL',
            distance: workAnalysis?.totalDistance || 0
          }
        ];

        // Clear existing template rows
        for (let r = 10; r <= 27; r++) {
          ['A','B','C','D','E','F','G','H','I','J','K','L'].forEach(col => {
            delete ws[`${col}${r}`];
          });
        }

        // Populate actual sites
        displaySites.slice(0, maxTemplateRows).forEach((site: any, idx: number) => {
          const r = startRow + idx;
          const sitePrice = idx === 0 ? totalPrice : undefined; // Lump-sum winning price on primary line

          ws[`A${r}`] = { t: 'n', v: idx + 1 };
          ws[`B${r}`] = { t: 's', v: String(site.siteId || site.id || '') };
          if (site.siteName) ws[`C${r}`] = { t: 's', v: String(site.siteName) };
          if (site.longitude != null) ws[`D${r}`] = { t: 'n', v: Number(site.longitude) };
          if (site.latitude != null) ws[`E${r}`] = { t: 'n', v: Number(site.latitude) };
          ws[`F${r}`] = { t: 's', v: String(site.town || site.circleName || '') };
          ws[`G${r}`] = { t: 's', v: String(site.region || site.geofenceZone || 'SWR') };
          ws[`H${r}`] = { t: 's', v: String(site.projectScope || 'WL') };
          ws[`I${r}`] = { t: 'n', v: Number(site.distance || 0) };
          ws[`J${r}`] = { t: 's', v: truckType };
          ws[`K${r}`] = { t: 's', v: outboundDate };
          if (sitePrice != null) ws[`L${r}`] = { t: 'n', v: Number(sitePrice) };
        });

        // Total Row (Row 28)
        ws['K28'] = { t: 's', v: 'Total' };
        ws['L28'] = { t: 'n', v: totalPrice, f: 'SUM(L10:L27)' };

        // Amount in words (Row 29)
        ws['F29'] = { t: 's', v: 'Amount in words: ' };
        ws['G29'] = { t: 's', v: numberToBirrWords(totalPrice) };

        // Signatures (Row 44 to 47)
        ws['A44'] = { t: 's', v: 'Name: Transport Officer' };
        ws['C44'] = { t: 's', v: 'Name: Transport Lead' };
        ws['E44'] = { t: 's', v: `Name: ${pa.approverName || 'Supply Chain Director'}` };
        ws['G44'] = { t: 's', v: `Name: ${supplier.contactPerson || supplier.name}` };

        ws['A47'] = { t: 's', v: `Date: ${pa.date}` };
        ws['C47'] = { t: 's', v: `Date: ${pa.date}` };
        ws['E47'] = { t: 's', v: `Date: ${outboundDate}` };
        ws['G47'] = { t: 's', v: 'Date: __________' };

        XLSX.writeFile(wb, `ADIU_WORK_ORDER_${pa.workOrderNumber}.xlsx`);
        return;
      }
    }
  } catch (err) {
    console.warn('Template fetch failed or running offline, generating programmatically:', err);
  }

  // 2. Programmatic Fallback: generates full workbook matching ADIU – SCM – F042 structure
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [];

  // Row 1-7
  rows.push([null, null, "ADIU COMMUNICATION SERVICE PLC\r\nTRANSPORT WORK ORDER SHEET", null, null, null, null, null, null, null, null, "Document No.: ADIU – SCM – F042"]);
  rows.push([null, null, null, null, null, null, null, null, null, null, null, `Work Order No.: ${pa.workOrderNumber}`]);
  rows.push(["TRANSPORTER DETAILS", null, null, null, null, null, null, null, null, null, null, `Date: ${outboundDate}`]);
  rows.push(["Transporter / Supplier:", null, supplier.name, null, null, "TIN No.:", supplier.tin || "________________"]);
  rows.push(["Contact Person:", null, supplier.contactPerson || "________________", null, null, "Mobile:", supplier.phone || "________________"]);
  rows.push(["Address:", null, supplier.address || "________________", null, null, "Agreement / Contract No.:", supplier.licenseNo || "________________"]);
  rows.push(["Payment Terms:", null, "Upon completed delivery & verified documents", null, null, "Payment Method:", "Bank transfer"]);

  // Row 8-9: Table Headers
  rows.push(["TRANSPORTATION ASSIGNMENT"]);
  rows.push([
    "No", "Site ID", "Site Name", "Longitude", "Latitude", "Town", " Region", "Scope", "Distance", "Truck Type", "Expected Outbound Date ", "Transportation Price"
  ]);

  // Site rows
  const displaySites = sites.length > 0 ? sites : [
    { siteId: '1', siteName: workAnalysis?.route || 'Direct Delivery', town: 'Addis Ababa', region: 'SWR', projectScope: 'WL', distance: 0 }
  ];

  displaySites.forEach((site: any, idx: number) => {
    rows.push([
      idx + 1,
      site.siteId || site.id || '',
      site.siteName || '',
      site.longitude || null,
      site.latitude || null,
      site.town || site.circleName || '',
      site.region || site.geofenceZone || 'SWR',
      site.projectScope || 'WL',
      site.distance || 0,
      truckType,
      outboundDate,
      idx === 0 ? totalPrice : null
    ]);
  });

  // Total & Amount in words
  rows.push([null, null, null, null, null, null, null, null, null, null, "Total", totalPrice]);
  rows.push([null, null, null, null, null, "Amount in words: ", numberToBirrWords(totalPrice)]);

  // Blank row & Terms & Conditions
  rows.push([]);
  rows.push(["TERMS & CONDITIONS"]);
  rows.push(["1. Scope & Authorization: This Work Order authorizes only the assignments, destinations, scope, truck types, rates, and dates stated herein."]);
  rows.push(["2. Vehicle & Personnel: The Transporter shall provide roadworthy vehicles, qualified drivers, valid licenses, permits, and required documents"]);
  rows.push(["3. Delivery & Proof: Delivery is complete upon signed delivery note/waybill or other ADIU-approved proof of delivery from an authorized recipient"]);
  rows.push(["4. Payment: Payment is subject to completed service, verification/approval, and submission of supporting documents. No advance is due unless approved in writing"]);
  rows.push(["5. Price & Additional Charges: Rates include transportation-related costs unless stated otherwise. Additional charges or assignments require prior written ADIU approval"]);
  rows.push(["6. Custody & Liability: Transporter is responsible for safe handling and delivery and for loss, damage, or shortage attributable to its negligence, misconduct, or breach"]);
  rows.push(["7. Delay / Incident: Transporter shall promptly notify ADIU of delays, breakdowns, incidents, or delivery constraints and mitigate where reasonably possible"]);
  rows.push(["8. Compliance: Transporter shall comply with Ethiopian laws, traffic and safety requirements, and applicable ADIU instructions"]);
  rows.push(["9. Changes / Cancellation: Amendment, reassignment, or cancellation requires written approval from an authorized ADIU representative"]);
  rows.push(["10. Acceptance: Signature confirms acceptance of this Work Order, assigned services, rates, payment conditions, and terms herein"]);

  // Signatures
  rows.push([]);
  rows.push(["AUTHORIZATION & ACKNOWLEDGMENT"]);
  rows.push(["Prepared By", null, "Reviewed By", null, "Approved By", null, "Transporter Acceptance"]);
  rows.push(["Name: Transport Officer", null, "Name: Transport Lead", null, `Name: ${pa.approverName || 'Supply Chain Director'}`, null, `Name: ${supplier.contactPerson || supplier.name}`]);
  rows.push(["Position/Company: ADIU", null, "Position/Company: ADIU", null, "Position/Company: ADIU", null, `Position/Company: ${supplier.name}`]);
  rows.push(["Signature: __________", null, "Signature: __________", null, "Signature: __________", null, "Signature: __________"]);
  rows.push([`Date: ${pa.date}`, null, `Date: ${pa.date}`, null, `Date: ${outboundDate}`, null, "Date: __________"]);

  rows.push([]);
  rows.push(["Rev. No.: 01/26", null, null, "EXTERNAL COPY", null, null, null, null, null, null, null, "1 of 1"]);
  rows.push(["ENRICHING LIVES"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `ADIU_WORK_ORDER_${pa.workOrderNumber}.xlsx`);
}
