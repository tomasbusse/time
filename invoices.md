{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fmodern\fcharset0 Courier;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs26 \cf0 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 # AI Instructions: German Invoice Manager Enhancement\
\
## Project Overview\
\
You are working on an existing German invoice management system (`invoice-manager-de`) that is fully functional with:\
- Customer management (CRUD)\
- Product/service catalog\
- Invoice creation with automatic numbering\
- Tax calculations (19%, 7%, 0%)\
- Kleinunternehmer-Regelung (\'a719 UStG) support\
- PDF generation compliant with \'a714 UStG\
- Payment status tracking\
- Dashboard with statistics\
\
## Required Enhancements\
\
### 1. CSV Export Functionality\
\
**Requirement:** Implement DATEV-compatible CSV export for accounting software integration.\
\
**CSV Format Specifications:**\
- **Encoding:** ISO-8859-1 (Latin-1) - NOT UTF-8\
- **Delimiter:** Semicolon (`;`)\
- **Decimal Separator:** Comma (`,`) - German format\
- **Line Ending:** CRLF (`\\r\\n`)\
- **No Header Row:** Data starts immediately\
\
**CSV Column Structure (observed from sample):**\
1. Amount (e.g., `845,00`) - Bruttobetrag with German decimal format\
2. Debit/Credit indicator (`"H"` for Haben/Credit, `"S"` for Soll/Debit)\
3. Currency (`"EUR"`)\
4. Empty fields (positions 4-6)\
5. Account number (`4110` - revenue account)\
6. Customer number (e.g., `10694`)\
7. Empty field\
8. Cost center (`0109`)\
9. Invoice number (e.g., `"25/09/5058"`)\
10. Empty fields\
11. Customer name (e.g., `"advita Holding GmbH"`)\
12. Remaining fields mostly empty (reserved for additional DATEV fields)\
\
**Implementation Steps:**\
1. Add new tRPC endpoint `invoices.exportCSV` that accepts date range filter\
2. Query invoices within date range with customer data\
3. Format each invoice row according to DATEV specification\
4. Convert amounts to German format (comma decimal separator)\
5. Encode output as ISO-8859-1\
6. Return base64-encoded CSV for download\
7. Add "CSV Export" button to invoices list page with date range picker\
8. Generate filename format: `EXTF_Rechnungen_[CompanyName]_[YYYYMMDD]-[YYYYMMDD].csv`\
\
**Code Location:**\
- Backend: Add to `server/routers.ts` in `invoices` router\
- Frontend: Add export button to `client/src/pages/Invoices.tsx`\
- Utility: Create `server/csvExporter.ts` for formatting logic\
\
### 2. Custom Invoice Number Starting Point\
\
**Requirement:** Allow users to set a custom starting invoice number when migrating from another system.\
\
**Current Behavior:**\
- Invoice numbers auto-increment from 1\
- Format: `[prefix][5-digit number]` (e.g., `RE00001`)\
- Stored in `companySettings.nextInvoiceNumber`\
\
**Required Changes:**\
\
**Database:**\
- No schema changes needed - `nextInvoiceNumber` already exists in `companySettings` table\
\
**Backend (`server/routers.ts`):**\
- Add validation to `company.saveSettings` mutation to accept `nextInvoiceNumber` in input schema\
- Ensure number is positive integer\
- Add warning if number is lower than existing invoices (potential duplicate risk)\
\
**Frontend (`client/src/pages/Settings.tsx`):**\
- Add input field in "Rechnungsnummerierung" section:\
  ```\
  Label: "N\'e4chste Rechnungsnummer"\
  Type: Number input\
  Min: 1\
  Help text: "ACHTUNG: \'c4ndern Sie diese Nummer nur bei der Migration von einem anderen System. Stellen Sie sicher, dass keine Duplikate entstehen."\
  ```\
- Show current next number as read-only when not editing\
- Add confirmation dialog when changing to lower number\
\
**Validation Rules:**\
- Must be positive integer\
- Show warning if < highest existing invoice number\
- Prevent setting to 0\
\
### 3. Legal Archive System (10-Year Retention - GoBD Compliance)\
\
**Requirement:** Implement legally compliant archiving system per GoBD (Grunds\'e4tze zur ordnungsm\'e4\'dfigen F\'fchrung und Aufbewahrung von B\'fcchern, Aufzeichnungen und Unterlagen in elektronischer Form).\
\
**Legal Requirements:**\
- **Retention Period:** 10 years from end of calendar year\
- **Immutability:** Invoices cannot be changed after being marked as "sent" or "paid"\
- **Completeness:** All invoices must be archived\
- **Accessibility:** Quick retrieval by invoice number, customer, date range\
- **Audit Trail:** Track all status changes with timestamps\
- **PDF Preservation:** Store generated PDF at time of sending (immutable)\
\
**Database Schema Changes:**\
\
Add new table `archivedInvoices`:\
```sql\
CREATE TABLE archived_invoices (\
  id INT AUTO_INCREMENT PRIMARY KEY,\
  invoiceId INT NOT NULL,\
  userId INT NOT NULL,\
  invoiceNumber VARCHAR(50) NOT NULL,\
  pdfData LONGBLOB NOT NULL,  -- Store PDF binary\
  archivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\
  archiveReason ENUM('sent', 'paid', 'manual') NOT NULL,\
  retentionUntil DATE NOT NULL,  -- Calculated: year(archivedAt) + 10 years\
  INDEX idx_user_invoice (userId, invoiceNumber),\
  INDEX idx_retention (retentionUntil)\
);\
```\
\
Add new table `invoiceAuditLog`:\
```sql\
CREATE TABLE invoice_audit_log (\
  id INT AUTO_INCREMENT PRIMARY KEY,\
  invoiceId INT NOT NULL,\
  userId INT NOT NULL,\
  action VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'sent', 'paid', 'cancelled', 'archived'\
  oldStatus VARCHAR(20),\
  newStatus VARCHAR(20),\
  changedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\
  metadata TEXT,  -- JSON with additional details\
  INDEX idx_invoice (invoiceId),\
  INDEX idx_timestamp (changedAt)\
);\
```\
\
**Implementation Steps:**\
\
**Backend (`server/db.ts`):**\
- Add functions:\
  - `archiveInvoice(invoiceId, userId, pdfBuffer, reason)` - Store PDF and create archive record\
  - `getArchivedInvoice(invoiceId, userId)` - Retrieve archived PDF\
  - `logInvoiceAction(invoiceId, userId, action, oldStatus, newStatus, metadata)` - Audit trail\
  - `getInvoiceAuditLog(invoiceId, userId)` - Get history\
  - `getArchivableInvoices(userId)` - Find invoices needing archival\
\
**Backend (`server/routers.ts`):**\
- Modify `invoices.update` mutation:\
  - When status changes to 'sent' or 'paid', automatically generate and archive PDF\
  - Log all status changes to audit log\
  - Prevent editing if invoice is archived (status = 'sent', 'paid', 'cancelled')\
- Add new endpoints:\
  - `invoices.getAuditLog` - Get change history for an invoice\
  - `invoices.getArchivedPDF` - Retrieve original archived PDF\
  - `invoices.archiveManually` - Manual archive trigger for admin\
\
**Frontend:**\
- Add "Archiv" navigation item in sidebar\
- Create `client/src/pages/Archive.tsx`:\
  - List all archived invoices\
  - Filter by year, customer, status\
  - Show retention period end date\
  - Download original archived PDF (immutable)\
  - View audit log for each invoice\
- Modify `InvoiceDetail.tsx`:\
  - Show "Archived" badge if invoice is archived\
  - Display audit log timeline\
  - Disable edit buttons for archived invoices\
  - Show warning: "Diese Rechnung ist archiviert und kann nicht mehr ge\'e4ndert werden"\
\
**Immutability Rules:**\
- Once invoice status is 'sent', 'paid', or 'cancelled':\
  - Block all updates to invoice data\
  - Block deletion\
  - Only allow status progression (sent \uc0\u8594  paid)\
  - Store PDF snapshot at archival time\
- Show clear UI indicators for locked invoices\
\
**Archive Management:**\
- Automatic archival triggers:\
  - When invoice marked as 'sent'\
  - When invoice marked as 'paid'\
- Manual archival option for admin users\
- Retention calculation: `YEAR(archived_at) + 10` years from December 31st\
- After retention period: Invoices can be purged (add admin function)\
\
**Audit Log Display:**\
- Show timeline of all changes\
- Include: timestamp, action, user, old/new values\
- Export audit log to CSV for compliance reporting\
\
### 4. Additional GoBD Compliance Features\
\
**Invoice Number Gaps:**\
- Detect and report gaps in invoice sequence\
- Add endpoint `invoices.checkSequence` that returns missing numbers\
- Display warning in dashboard if gaps detected\
\
**Export for Tax Audit:**\
- Add "Steuerpr\'fcfung Export" function\
- Generate complete export package:\
  - All invoices as PDFs in folder structure by year\
  - CSV with all invoice data\
  - Audit log CSV\
  - Summary report (total revenue, tax amounts by rate)\
- ZIP file download\
\
**Backup Recommendations:**\
- Add info panel in Settings about backup requirements\
- Recommend external backup of database\
- Link to documentation about GoBD compliance\
\
## Implementation Priority\
\
1. **Custom Invoice Starting Number** (Quick win, needed for migration)\
2. **CSV Export** (Needed for accounting integration)\
3. **Archive System with Immutability** (Legal compliance - critical)\
4. **Audit Logging** (Legal compliance - critical)\
5. **Additional GoBD Features** (Nice to have, enhances compliance)\
\
## Testing Requirements\
\
**CSV Export:**\
- Test with German special characters (\'e4, \'f6, \'fc, \'df)\
- Verify ISO-8859-1 encoding\
- Test import into DATEV or similar accounting software\
- Verify decimal format (comma, not period)\
\
**Invoice Numbering:**\
- Test migration scenario (setting high starting number)\
- Verify no duplicates possible\
- Test with different prefixes\
\
**Archive System:**\
- Verify PDFs are truly immutable (stored separately)\
- Test that archived invoices cannot be edited\
- Verify 10-year retention calculation\
- Test audit log completeness\
- Verify archive retrieval performance with 1000+ invoices\
\
**GoBD Compliance:**\
- Verify no invoice number gaps\
- Test complete audit trail\
- Verify export package contains all required data\
\
## Code Style Guidelines\
\
- Follow existing TypeScript patterns in the project\
- Use tRPC for all API endpoints\
- Use Zod for input validation\
- Follow German naming in UI (already established)\
- Use existing UI components from shadcn/ui\
- Add German comments for legal/compliance code\
- Use proper error handling with toast notifications\
\
## Legal Disclaimer to Add\
\
Add to Settings page:\
```\
"Dieses System wurde nach bestem Wissen und Gewissen f\'fcr die Einhaltung von \'a714 UStG und GoBD entwickelt. \
F\'fcr die rechtssichere Nutzung konsultieren Sie bitte Ihren Steuerberater. \
Der Betreiber \'fcbernimmt keine Haftung f\'fcr steuerrechtliche Konsequenzen."\
```\
\
## Migration Guide for Users\
\
Create `MIGRATION.md` in project root with instructions:\
1. Export all invoices from old system\
2. Set next invoice number in Settings\
3. Import customer data (manual entry or future CSV import)\
4. Verify first invoice number is correct\
5. Begin using system\
\
## File Locations Summary\
\
**New Files to Create:**\
- `server/csvExporter.ts` - CSV formatting logic\
- `server/archiveManager.ts` - Archive and audit functions\
- `client/src/pages/Archive.tsx` - Archive viewer\
- `MIGRATION.md` - User migration guide\
\
**Files to Modify:**\
- `drizzle/schema.ts` - Add archive and audit tables\
- `server/db.ts` - Add archive and audit functions\
- `server/routers.ts` - Add CSV export, archive endpoints, modify update logic\
- `client/src/pages/Settings.tsx` - Add invoice number input\
- `client/src/pages/Invoices.tsx` - Add CSV export button\
- `client/src/pages/InvoiceDetail.tsx` - Add archive status, audit log\
- `client/src/components/DashboardLayout.tsx` - Add Archive menu item\
- `todo.md` - Track new features\
\
## Success Criteria\
\
\uc0\u9989  CSV export produces DATEV-compatible file\
\uc0\u9989  Invoice numbering can start at custom number\
\uc0\u9989  Invoices are immutable after being sent/paid\
\uc0\u9989  All changes are logged in audit trail\
\uc0\u9989  PDFs are archived and retrievable for 10 years\
\uc0\u9989  System prevents editing of archived invoices\
\uc0\u9989  Export package ready for tax audit (Steuerpr\'fcfung)\
\uc0\u9989  No invoice number gaps or duplicates possible\
\
\
---\
\
## Sample Invoice Analysis - English Lessons Business\
\
### Business Context\
**Company:** Sprachdienste Simmonds (Language Services)\
**Service:** English lessons (Englischunterricht)\
**Location:** Schaufelder Stra\'dfe 11, 30167 Hannover\
**Tax Status:** Tax-exempt under \'a74 Nr 21 Buchstabe a) Doppelbuchstabe bb) UStG (educational services)\
\
### Key Invoice Details from Sample\
\
**Company Information:**\
- Business Name: Sprachdienste Simmonds\
- Owner: James Simmonds\
- Address: Schaufelder Stra\'dfe 11, 30167 Hannover\
- Website: www.englisch-lehrer.com\
- Email: James@englisch-lehrer.com\
- Phone 1: 0511/4739339\
- Phone 2: 030/57703118\
- Tax Number (Steuer-Nr.): 24/107/00882\
- VAT ID (USt-IdNr.): DE259109260\
- Bank: Commerzbank\
- BIC: DRESDEFF 250\
- IBAN: DE77 2508 0020 0106 9196 02\
\
**Invoice Format:**\
- Invoice Number: 25/09/5060 (Format: YY/MM/sequential)\
- Customer Number: 10566\
- Date: 01.09.2025\
- Customer: Industrieausr\'fcstungen e. K., Herrn Ralf K\'f6nnecke, Abbeile 16, 31311 Uetze\
\
**Service Line Items Format:**\
Each lesson is a separate line item with:\
- Position number (1, 2, 3, 4)\
- Article Number: Date and time (e.g., "10.08.25, 12.45-14.15 Uhr")\
- Description: "Englischunterricht \'e0 42,50 Euro Ustd." (English lessons at 42.50 Euro per lesson hour)\
- Quantity: "2 Ustd." (2 lesson hours = Unterrichtsstunden)\
- Unit Price: 42,50 \'80\
- Total: 85,00 \'80\
\
**Tax Treatment:**\
- Tax Rate: 0% (Umsatzsteuer 0%)\
- Tax Amount: 0,00 \'80\
- Legal Notice: "Diese Leistung ist von der Umsatzsteuer befreit gem\'e4\'df \'a7 4 Nr 21 Buchstabe a) Doppelbuchstabe bb) UStG."\
- Net Amount = Gross Amount (340,00 \'80)\
\
**Payment Terms:**\
"Ich bitte um \'dcberweisung des Rechnungsbetrages bis zum 15.09.2025 an die unten genannte Bankverbindung."\
(Please transfer the invoice amount by 15.09.2025 to the bank account below)\
\
**Footer:**\
- Page numbers: "Seite 1/2", "Seite 2/2"\
- Payment recipient: James Simmonds\
- Bank details repeated at bottom\
\
---\
\
## Required Feature: Flexible Service Entry for Lessons\
\
### Problem Statement\
The current system requires creating products/services in advance. For lesson-based businesses, each lesson has:\
- **Variable date/time** (e.g., "10.08.25, 12.45-14.15 Uhr")\
- **Variable duration** (e.g., 1.5 hours, 2 hours)\
- **Fixed hourly rate** (e.g., 42,50 \'80 per Ustd.)\
\
Creating a separate product for each date/time is impractical.\
\
### Solution: Flexible Line Item Entry\
\
**Database Schema - NO CHANGES NEEDED**\
The current `invoiceItems` table already supports this:\
- `description` (TEXT) - Can store date/time + service description\
- `quantity` (INT) with `quantityDecimals` - Supports decimal quantities like 1.5, 2.0 hours\
- `unit` (VARCHAR) - Can be "Ustd." (Unterrichtsstunden)\
- `pricePerUnitInCents` - Hourly rate\
\
**Frontend Changes Required:**\
\
### 1. Modify Invoice Creation Form (`client/src/pages/CreateInvoice.tsx`)\
\
**Add "Entry Mode" Toggle for Each Line Item:**\
```typescript\
enum EntryMode \{\
  FROM_CATALOG = "catalog",  // Select from products\
  MANUAL = "manual"          // Free-form entry\
\}\
```\
\
**Manual Entry Fields:**\
- **Article Number / Date-Time** (optional text field)\
  - Placeholder: "z.B. 10.08.25, 12.45-14.15 Uhr"\
  - Stored in description prefix\
- **Service Description** (text field)\
  - Default: "Englischunterricht \'e0 [price] Euro Ustd."\
  - Fully editable\
- **Duration (Hours)** (decimal number)\
  - Label: "Dauer (Ustd.)"\
  - Step: 0.25 (allows 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, etc.)\
  - Stored as quantity with 2 decimal places\
- **Rate per Hour** (currency)\
  - Label: "Stundensatz (\'80)"\
  - Default from settings or last used\
- **Tax Rate** (dropdown: 0%, 7%, 19%)\
  - Default: 0% for educational services\
\
**Combined Description Format:**\
```\
[Article Number/DateTime] - [Service Description]\
\
Example:\
"10.08.25, 12.45-14.15 Uhr - Englischunterricht \'e0 42,50 Euro Ustd."\
```\
\
**UI Layout for Line Item:**\
```\
\uc0\u9484 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9488 \
\uc0\u9474  Position 1                                    [Remove]  \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Entry Mode: \u9898  From Catalog  \u9899  Manual Entry            \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Article Number / Date-Time (optional)                   \u9474 \
\uc0\u9474  [10.08.25, 12.45-14.15 Uhr                           ] \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Service Description                                     \u9474 \
\uc0\u9474  [Englischunterricht \'e0 42,50 Euro Ustd.               ] \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Duration (Ustd.)  \u9474  Rate/Hour (\'80)  \u9474  Tax Rate          \u9474 \
\uc0\u9474  [2.00          ]  \u9474  [42,50      ]  \u9474  [0% \u9660 ]           \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Total: 85,00 \'80                                          \u9474 \
\uc0\u9492 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9496 \
```\
\
### 2. Add Default Hourly Rate Setting\
\
**In Company Settings (`client/src/pages/Settings.tsx`):**\
\
Add new section "Service Settings":\
```\
\uc0\u9484 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9488 \
\uc0\u9474  Service-Einstellungen                                   \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Standard-Stundensatz (\'80)                                \u9474 \
\uc0\u9474  [42,50                                               ]  \u9474 \
\uc0\u9474  Wird als Vorschlag bei manueller Eingabe verwendet     \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Standard-Einheit                                        \u9474 \
\uc0\u9474  [Ustd.                                               ]  \u9474 \
\uc0\u9474  z.B. "Ustd." (Unterrichtsstunden), "Std.", "h"         \u9474 \
\uc0\u9492 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9496 \
```\
\
**Database Schema Addition:**\
Add to `companySettings` table:\
```sql\
ALTER TABLE company_settings \
ADD COLUMN defaultHourlyRateCents INT DEFAULT 0,\
ADD COLUMN defaultServiceUnit VARCHAR(50) DEFAULT 'Ustd.';\
```\
\
### 3. PDF Generation Updates (`server/pdfGenerator.ts`)\
\
**Article Number Column:**\
Currently the PDF shows "Pos." (Position) only. Update to show:\
- **Column 1:** Pos. (Position number)\
- **Column 2:** Art-Nr. (Article Number - extracted from description if format matches)\
- **Column 3:** Bezeichnung (Description)\
\
**Parsing Logic:**\
```typescript\
// Extract article number if description contains " - "\
const parts = item.description.split(' - ');\
const articleNumber = parts.length > 1 ? parts[0] : '';\
const description = parts.length > 1 ? parts.slice(1).join(' - ') : item.description;\
```\
\
**Updated Table Header:**\
```\
Pos | Art-Nr.              | Bezeichnung                    | Menge | Einzelpreis | MwSt. | Gesamt\
1   | 10.08.25,           | Englischunterricht \'e0 42,50     | 2 Ustd| 42,50      | 0%    | 85,00 \'80\
    | 12.45-14.15 Uhr     | Euro Ustd.                     |       |            |       |\
```\
\
### 4. Tax-Exempt Educational Services\
\
**Add Preset Tax Exemption Reasons:**\
\
In Settings, add dropdown for tax exemption:\
```\
\uc0\u9484 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9488 \
\uc0\u9474  Steuerbefreiung                                         \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  \u9745  Steuerbefreiung anwenden                              \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Rechtsgrundlage                                         \u9474 \
\uc0\u9474  [\'a74 Nr 21 Buchstabe a) Doppelbuchstabe bb) UStG \u9660 ]     \u9474 \
\uc0\u9474                                                           \u9474 \
\uc0\u9474  Options:                                                \u9474 \
\uc0\u9474  - \'a74 Nr 21 a) bb) UStG (Bildungsleistungen)           \u9474 \
\uc0\u9474  - \'a719 UStG (Kleinunternehmer)                          \u9474 \
\uc0\u9474  - Andere (benutzerdefiniert)                           \u9474 \
\uc0\u9500 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9508 \
\uc0\u9474  Hinweistext auf Rechnung                               \u9474 \
\uc0\u9474  [Diese Leistung ist von der Umsatzsteuer befreit      \u9474 \
\uc0\u9474   gem\'e4\'df \'a7 4 Nr 21 Buchstabe a) Doppelbuchstabe bb)     \u9474 \
\uc0\u9474   UStG.                                                 ] \u9474 \
\uc0\u9492 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9496 \
```\
\
**Database Schema Addition:**\
```sql\
ALTER TABLE company_settings \
ADD COLUMN taxExemptionEnabled BOOLEAN DEFAULT FALSE,\
ADD COLUMN taxExemptionLegalBasis VARCHAR(255),\
ADD COLUMN taxExemptionNoticeText TEXT;\
```\
\
**PDF Generation:**\
- If `taxExemptionEnabled = true`, show custom notice instead of Kleinunternehmer text\
- Override tax rate to 0% for all items if enabled\
- Display custom legal basis text\
\
### 5. Quick Templates for Common Services\
\
**Add "Service Templates" Feature:**\
\
Allow saving frequently used service descriptions as templates:\
\
**New Database Table:**\
```sql\
CREATE TABLE service_templates (\
  id INT AUTO_INCREMENT PRIMARY KEY,\
  userId INT NOT NULL,\
  name VARCHAR(255) NOT NULL,\
  description TEXT NOT NULL,\
  defaultQuantity INT DEFAULT 100,  -- 1.00 with 2 decimals\
  quantityDecimals INT DEFAULT 2,\
  unit VARCHAR(50) DEFAULT 'Ustd.',\
  pricePerUnitInCents INT NOT NULL,\
  taxRate INT DEFAULT 0,\
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\
  INDEX idx_user (userId)\
);\
```\
\
**UI in Invoice Creation:**\
```\
\uc0\u9484 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9488 \
\uc0\u9474  Quick Template: [Englischunterricht 2 Std. \u9660 ]          \u9474 \
\uc0\u9474                                                           \u9474 \
\uc0\u9474  Templates:                                              \u9474 \
\uc0\u9474  - Englischunterricht 2 Std. (2.0 Ustd. \'e0 42,50\'80)      \u9474 \
\uc0\u9474  - Englischunterricht 1.5 Std. (1.5 Ustd. \'e0 42,50\'80)    \u9474 \
\uc0\u9474  - Konversationstraining (1.0 Ustd. \'e0 50,00\'80)          \u9474 \
\uc0\u9474  + Neue Vorlage erstellen                               \u9474 \
\uc0\u9492 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9472 \u9496 \
```\
\
**Template Management Page:**\
Create `client/src/pages/ServiceTemplates.tsx`:\
- List all templates\
- Create/Edit/Delete templates\
- Set default values\
- Quick apply to invoice\
\
---\
\
## Implementation Summary for Flexible Services\
\
### Priority 1: Manual Entry Mode\
1. Add entry mode toggle to invoice line items\
2. Add manual entry fields (article number, description, duration, rate)\
3. Update description format to support "Article - Description"\
4. Add default hourly rate to company settings\
\
### Priority 2: PDF Formatting\
1. Update PDF table to show Art-Nr. column\
2. Parse article number from description\
3. Format multi-line article numbers properly\
\
### Priority 3: Tax Exemption\
1. Add tax exemption settings to company settings\
2. Add custom legal basis and notice text\
3. Update PDF generation to show custom exemption notice\
4. Auto-apply 0% tax when exemption enabled\
\
### Priority 4: Service Templates\
1. Create service_templates table\
2. Add template management UI\
3. Add quick template selector to invoice creation\
4. Allow saving current line item as template\
\
---\
\
## Example Data for Testing\
\
**Company Settings (Sprachdienste Simmonds):**\
```json\
\{\
  "companyName": "Sprachdienste Simmonds",\
  "ownerName": "James Simmonds",\
  "street": "Schaufelder Stra\'dfe 11",\
  "postalCode": "30167",\
  "city": "Hannover",\
  "taxNumber": "24/107/00882",\
  "vatId": "DE259109260",\
  "email": "James@englisch-lehrer.com",\
  "phone": "0511/4739339",\
  "website": "www.englisch-lehrer.com",\
  "bankName": "Commerzbank",\
  "iban": "DE77 2508 0020 0106 9196 02",\
  "bic": "DRESDEFF 250",\
  "isSmallBusiness": false,\
  "taxExemptionEnabled": true,\
  "taxExemptionLegalBasis": "\'a74 Nr 21 Buchstabe a) Doppelbuchstabe bb) UStG",\
  "taxExemptionNoticeText": "Diese Leistung ist von der Umsatzsteuer befreit gem\'e4\'df \'a7 4 Nr 21 Buchstabe a) Doppelbuchstabe bb) UStG.",\
  "defaultHourlyRateCents": 4250,\
  "defaultServiceUnit": "Ustd.",\
  "invoicePrefix": "25/"\
\}\
```\
\
**Sample Invoice Line Items:**\
```json\
[\
  \{\
    "description": "10.08.25, 12.45-14.15 Uhr - Englischunterricht \'e0 42,50 Euro Ustd.",\
    "quantity": 200,\
    "quantityDecimals": 2,\
    "unit": "Ustd.",\
    "pricePerUnitInCents": 4250,\
    "taxRate": 0\
  \},\
  \{\
    "description": "17.08.25, 12.45-14.15 Uhr - Englischunterricht \'e0 42,50 Euro Ustd.",\
    "quantity": 200,\
    "quantityDecimals": 2,\
    "unit": "Ustd.",\
    "pricePerUnitInCents": 4250,\
    "taxRate": 0\
  \}\
]\
```\
\
**Payment Terms:**\
"Ich bitte um \'dcberweisung des Rechnungsbetrages bis zum [DueDate] an die unten genannte Bankverbindung."\
\
---\
\
## Updated Success Criteria\
\
\uc0\u9989  Manual entry mode allows flexible service descriptions\
\uc0\u9989  Article numbers (date/time) display correctly in PDF\
\uc0\u9989  Decimal hours (1.5, 2.0) calculate correctly\
\uc0\u9989  Default hourly rate pre-fills from settings\
\uc0\u9989  Tax exemption with custom legal basis works\
\uc0\u9989  Custom tax exemption notice appears on PDF\
\uc0\u9989  Service templates can be saved and reused\
\uc0\u9989  PDF matches sample invoice format exactly\
\uc0\u9989  Educational services default to 0% tax with proper notice\
}