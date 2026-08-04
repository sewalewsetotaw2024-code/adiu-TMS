# Transport Management System Frontend

This is the React frontend for the Transport Management System, built as a single-page application to manage planning, execution, compliance, and delivery tracking for transport operations.

## Overview

The frontend supports the following transport workflows:
- Project, site, and MR/GRF onboarding
- Work analysis and supplier quotation
- Profitability analysis and variance approvals
- Work order issuing and transporter assignment
- QEHS compliance validation
- Dispatch, loading confirmation, enroute tracking, incident logging, and proof of delivery
- Last-mile request and payment request workflows

## Key features

- Dashboard with operational KPIs and status summaries
- Material Request (MR) and Work Analysis management
- Supplier quotation capture and profitability review
- Transport Lead workflows for dispatch, loading, and WCC
- Compliance flow for QEHS review and approval
- Proof of Delivery capture with receiver details and evidence uploads
- Multi-image upload support for POD and loading evidence
- Payment request and last-mile delivery request handling

## Tech stack

- React 19
- TypeScript
- Vite
- Lucide React icons
- Motion animations
- XLSX for spreadsheet-style data handling

## Repository structure

- `src/App.tsx` - main app shell, global state, and screen routing
- `src/components/` - screen-level UI components and workflow pages
- `src/data.ts` - initial sample data and seed records for demo use
- `src/types.ts` - shared TypeScript models and domain definitions
- `src/index.css` - global styling

## Setup and development

Install dependencies and start the development server:

```bash
cd transport-management-system-frontend
npm install
npm run dev
```

Open the app in your browser at `http://localhost:3000`.

## Build and validation

Run a production build:

```bash
npm run build
```

Type-check the workspace:

```bash
npm run lint
```

## Workflow notes

- The current implementation uses local in-memory sample data for demo workflows.
- The frontend is designed to support a future backend integration for persistence and shared business logic.
- Key role flows reflected in the app include:
  - TIM (Telecom Implementation Manager)
  - ST&PIM M (Sourcing, Transport and PIM Manager)
  - TL (Transport Lead)
  - SCD (Supply Chain Director)
  - QEHSM (Quality, Environment, Health & Safety Manager)

## Recommended extension points

- API integration for persistent data storage
- Authentication and user-role management
- External QEHS compliance system integration
- File upload backend support for POD and last-mile evidence

## Notes

This frontend is focused on demonstrating the transport workflow, approval routing, and evidence capture UX. It is a strong foundation for a full Transport Management System when connected to backend services.
