# Transport Management System User Journey

## 1. Project and MR/GRF Setup
- TIM creates a new **Project** and its related **Site**.
- TIM imports the **Material Requisition (MR)** or **Goods Receipt Form (GRF)** into the system.
- The system records the project, site, and MR/GRF details for planning.

## 2. Assignment and Planning
- ST&PIM Manager assigns a **Transport Lead (TL)** to the project.
- The TL receives the job assignment and begins transport planning.

## 3. Work Analysis
- TL performs **Work Analysis** for the MR and site.
- TL reviews the MR quantities, loading requirements, and route logistics.
- TL documents the analysis in the system.

## 4. Supplier Quotation
- TL creates a **Supplier Quotation** and links it to the MR.
- The quotation is stored in the system for cost comparison and approval.

## 5. Profitability Analysis
- TL performs **Profitability Analysis**.
- The system compares supplier costs, transport cost, and expected revenue.
- Any variance against targets is flagged for review.

## 6. Variance Approval
- The appropriate team reviews the profitability and quotation variance.
- Approval is required before issuing the work order.
- Approval rules follow variance thresholds:
  - **Variance = 0 or positive**: proceed directly to work order issuance.
  - **Negative variance ≤ 10%**: TL approval required.
  - **Negative variance > 10% and ≤ 20%**: ST&PIM Manager approval required.
  - **Negative variance > 20%**: SCD approval required.
- The system documents each approval decision before the work order is issued.

## 7. Work Order Issuance
- TL issues the **Work Order** once approvals are complete.
- The work order is published to relevant teams, including QEHS and Transport.
- Generated work order documents are expected to be sent to the transporter automatically.

## 8. QEHS Compliance
- QEHS reviews compliance requirements before dispatch.
- If the system is integrated with the QEHS platform, an API request is sent to the QEHS system and the external response is returned to TMS.
- If the system runs in standalone mode, a user with the QEHS role can log in and approve compliance directly within TMS.
- QEHS verifies safety, documentation, and site readiness.
- QEHS marks the shipment as compliant in the system.

## 9. Transport Execution
- Transporter or SDT checks the MR and site details.
- The transporter loads the item according to MR requirements.
- The system records the transport status through:
  - **Dispatch**: loading finalized
  - **Enroute**: in movement
  - **Arrival**: reached site and offloading begins

## 10. Site Arrival and Incident Handling
- Upon arrival, the transporter confirms delivery at the destination.
- If an incident occurs, it is logged in the system immediately.
- Incidents may include damage, delay, offload issues, or other exceptions.
- If the trip includes a list of sites or a cluster, TL performs **WCC** at the last site.

## 11. Proof of Delivery (POD)
- TL/transporter captures POD details at delivery:
  - Signed MR
  - Time-stamped item photo(s)
  - Receiver name
  - Receiver contact details
- If the delivery includes last-mile delivery, last-mile evidence of both **photo and video** is required.
- The system stores these records as delivery evidence.

## 12. Trip Closure
- After successful offload and POD capture, the trip is marked as **closed**.
- The system updates the trip status to complete.

## 13. Payment Request
- Following trip closure, the transporter submits a **Payment Request**.
- The request includes amount details and supporting evidence.

## 14. Last-Mile Delivery Request
- If last-mile delivery distance is more than **100 meters**, the transporter requests last-mile support.
- The transporter submits:
  - **Site ID**
  - **Transport amount**
- The request is routed for TL approval.

## 15. Last-Mile Approval and Evidence
- TL reviews and approves the last-mile delivery request.
- TL attaches the approved document to the request.
- The transporter performs the last-mile activity.
- The transporter then uploads last-mile evidence:
  - Photo or video proof
  - Delivery proof with last-mile evidence

## 16. Final Closeout
- After approval and evidence submission, the transport event is fully closed.
- Payment processing begins based on the approved request and submitted proof.

## Notes
- Admin functions are assumed to be handled by the system.
- This journey tracks all major handoffs and approvals from TIM, ST&PIM M, TL, SCD, QEHSM, and Transporter/SDT.
- Evidence and approvals are captured at each critical milestone for audit and compliance.

## Role Abbreviations
- **TIM**: Telecom Implementation Manager
- **ST&PIM M**: Sourcing, Transport and PIM Manager
- **TL**: Transport Lead
- **SCD**: Supply Chain Director
- **QEHSM**: Quality, Environment, Health & Safety Manager
- **SDT**: Sorting & Delivery Team 

