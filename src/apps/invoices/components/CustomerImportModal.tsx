import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CustomerImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    onImportComplete: () => void;
}

interface ColumnMapping {
    excelColumn: string;
    customerField: string;
}

export default function CustomerImportModal({
    isOpen,
    onClose,
    workspaceId,
    onImportComplete,
}: CustomerImportModalProps) {
    const currentUser = useQuery(api.users.getCurrentUser); // Added currentUser query
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
    const [importProgress, setImportProgress] = useState(0);

    const createCustomer = useMutation(api.customers.createCustomer);
    const createImportBatch = useMutation(
        (api as any).customerImports.createImportBatch
    );

    const customerFieldOptions = [
        { value: "", label: "-- Skip Column --" },
        { value: "name", label: "Display Name" },
        { value: "companyName", label: "Company Name" },
        { value: "salutation", label: "Salutation (Herr/Frau)" },
        { value: "title", label: "Title (Dr./Prof.)" },
        { value: "firstName", label: "First Name (Vorname)" },
        { value: "lastName", label: "Last Name (Nachname)" },
        { value: "email", label: "Email" },
        { value: "contactPerson", label: "Contact Person" },
        { value: "street", label: "Street/Number (Straße)" },
        { value: "supplement1", label: "Address Supplement 1" },
        { value: "supplement2", label: "Address Supplement 2" },
        { value: "zipCode", label: "ZIP Code (PLZ)" },
        { value: "city", label: "City (Ort)" },
        { value: "state", label: "State (Bundesland)" },
        { value: "country", label: "Country (Land)" },
        { value: "phone1", label: "Phone 1 (Telefon)" },
        { value: "phone2", label: "Phone 2" },
        { value: "vatId", label: "VAT ID (USt-IdNr.)" },
        { value: "taxNumber", label: "Tax Number (Steuernr.)" },
        { value: "customerNumber", label: "Customer Number" },
        { value: "notes", label: "Notes" },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);

        // Parse CSV
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split("\n").filter((line) => line.trim());

            if (lines.length === 0) return;

            // Auto-detect delimiter: check if semicolon or comma is more common in first line
            const firstLine = lines[0];
            const semicolonCount = (firstLine.match(/;/g) || []).length;
            const commaCount = (firstLine.match(/,/g) || []).length;
            const delimiter = semicolonCount > commaCount ? ";" : ",";

            // Helper function to parse a CSV line with proper quote handling
            const parseCsvLine = (line: string): string[] => {
                const result: string[] = [];
                let current = "";
                let inQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];

                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === delimiter && !inQuotes) {
                        result.push(current.trim());
                        current = "";
                    } else {
                        current += char;
                    }
                }
                result.push(current.trim());
                return result;
            };

            // Parse header
            const headerLine = parseCsvLine(lines[0]);
            setHeaders(headerLine);

            // Initialize column mapping with auto-detection
            const initialMapping: ColumnMapping[] = headerLine.map((header) => {
                const lowerHeader = header.toLowerCase();
                let field = "";

                // German field detection
                if (lowerHeader.includes("vorname")) field = "firstName";
                else if (lowerHeader.includes("nachname") || (lowerHeader.includes("name") && !lowerHeader.includes("firma"))) field = "lastName";
                else if (lowerHeader.includes("firma")) field = "companyName";
                else if (lowerHeader.includes("anrede")) field = "salutation";
                else if (lowerHeader.includes("titel")) field = "title";
                else if (lowerHeader.includes("e-mail") || lowerHeader.includes("email")) field = "email";
                else if (lowerHeader.includes("straße") || lowerHeader.includes("strasse")) field = "street";
                else if (lowerHeader.includes("postleitzahl") || lowerHeader.includes("plz")) field = "zipCode";
                else if (lowerHeader.includes("ort") && !lowerHeader.includes("postfach")) field = "city";
                else if (lowerHeader.includes("land") && !lowerHeader.includes("postfach")) field = "country";
                else if (lowerHeader.includes("telefon 1") || lowerHeader.includes("tel 1")) field = "phone1";
                else if (lowerHeader.includes("telefon 2") || lowerHeader.includes("tel 2")) field = "phone2";
                else if (lowerHeader.includes("umsatzsteuer-id") || lowerHeader.includes("ust-id")) field = "vatId";
                else if (lowerHeader.includes("steuer nr")) field = "taxNumber";
                else if (lowerHeader.includes("kundennummer")) field = "customerNumber";
                else if (lowerHeader.includes("notiz")) field = "notes";
                else if (lowerHeader.includes("zusatz 1")) field = "supplement1";
                else if (lowerHeader.includes("zusatz 2")) field = "supplement2";
                // Postfach fields
                else if (lowerHeader.includes("postfach") && !lowerHeader.includes("postleitzahl") && !lowerHeader.includes("ort")) field = "poBox";
                else if (lowerHeader.includes("postfach-postleitzahl")) field = "poBoxZipCode";
                else if (lowerHeader.includes("postfach-ort")) field = "poBoxCity";

                return { excelColumn: header, customerField: field };
            });

            setColumnMapping(initialMapping);

            // Parse data rows
            const dataRows = lines.slice(1).map((line) => {
                const values = parseCsvLine(line);
                const row: any = {};
                headerLine.forEach((header, idx) => {
                    row[header] = values[idx] || "";
                });
                return row;
            });

            setParsedData(dataRows);
            setStep("map");
        };

        reader.readAsText(uploadedFile);
    };

    const updateMapping = (excelColumn: string, customerField: string) => {
        setColumnMapping((prev) =>
            prev.map((m) =>
                m.excelColumn === excelColumn ? { ...m, customerField } : m
            )
        );
    };

    const handlePreview = () => {
        setStep("preview");
    };

    const handleImport = async () => {
        if (!workspaceId) return;

        setIsProcessing(true);
        const batchId = `import-${Date.now()}`;

        try {
            // Transform data according to mapping
            const customers = parsedData.map((row) => {
                const customer: any = {
                    workspaceId,
                    importBatchId: batchId,
                    paymentTermsDays: 14, // Default
                };

                columnMapping.forEach((mapping) => {
                    if (mapping.customerField && row[mapping.excelColumn]) {
                        customer[mapping.customerField] = row[mapping.excelColumn];
                    }
                });

                // Ensure required fields
                if (!customer.name) {
                    customer.name =
                        customer.companyName ||
                        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                        "Unnamed Customer";
                }

                return customer;
            });

            // Import customers one by one with progress
            for (let i = 0; i < customers.length; i++) {
                await createCustomer(customers[i]);
                setImportProgress(Math.round(((i + 1) / customers.length) * 100));
            }

            // Create import batch record
            await createImportBatch({
                workspaceId,
                batchId,
                fileName: file?.name || "import.csv",
                customerCount: customers.length,
                importedBy: currentUser?._id!,
            });

            alert(`Successfully imported ${customers.length} customers!`);
            onImportComplete();
            onClose();
        } catch (error) {
            console.error("Import error:", error);
            alert("Failed to import customers. Please check the data and try again.");
        } finally {
            setIsProcessing(false);
            setImportProgress(0);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Import Customers</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Step 1: Upload */}
                    {step === "upload" && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Upload CSV File</h3>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer text-blue-600 hover:text-blue-800"
                                >
                                    <div className="mb-2">Click to upload or drag and drop</div>
                                    <div className="text-sm text-gray-500">CSV files only</div>
                                </label>
                                {file && (
                                    <div className="mt-4 text-sm text-gray-600">
                                        Selected: {file.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Map Columns */}
                    {step === "map" && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Map Your CSV Columns</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                For <strong>each column</strong> in your CSV file, select where you want that data to go in our database.
                            </p>

                            {/* Visual Example */}
                            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="text-sm font-semibold text-gray-700 mb-3">📝 How it works:</div>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">CSV: "Customer Name"</span>
                                        <span className="text-gray-500">→ Choose:</span>
                                        <span className="bg-green-100 px-2 py-1 rounded text-xs">Database: "Display Name"</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">CSV: "Email"</span>
                                        <span className="text-gray-500">→ Choose:</span>
                                        <span className="bg-green-100 px-2 py-1 rounded text-xs">Database: "Email"</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">CSV: "Internal ID"</span>
                                        <span className="text-gray-500">→ Choose:</span>
                                        <span className="bg-gray-200 px-2 py-1 rounded text-xs">-- Skip Column --</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-900">
                                    <strong>💡 Tip:</strong> We've automatically detected some mappings based on your column names.
                                    Review each one and change the dropdown if needed. Select "-- Skip Column --" to ignore columns you don't need.
                                </p>
                            </div>

                            <div className="space-y-2 mb-6">
                                {columnMapping.map((mapping, idx) => {
                                    const sampleValue = parsedData[0]?.[mapping.excelColumn] || "";
                                    const isMapped = mapping.customerField !== "";

                                    return (
                                        <div
                                            key={idx}
                                            className={`border rounded-lg p-4 transition-all ${isMapped
                                                ? "bg-white border-green-200 shadow-sm"
                                                : "bg-gray-50 border-gray-200"
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        <span className="font-semibold text-gray-900">
                                                            {mapping.excelColumn}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 ml-4 truncate">
                                                        Sample: "{sampleValue}"
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-center pt-2">
                                                    <svg
                                                        className={`w-8 h-8 ${isMapped ? "text-green-500" : "text-gray-300"
                                                            }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                        />
                                                    </svg>
                                                </div>

                                                <div className="flex-1">
                                                    <select
                                                        value={mapping.customerField}
                                                        onChange={(e) =>
                                                            updateMapping(mapping.excelColumn, e.target.value)
                                                        }
                                                        className={`w-full border rounded-lg px-3 py-2 text-sm font-medium transition-all ${isMapped
                                                            ? "border-green-300 bg-green-50 text-green-900"
                                                            : "border-gray-300 bg-white text-gray-700"
                                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                    >
                                                        {customerFieldOptions.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <div className="text-sm text-gray-600">
                                    {columnMapping.filter((m) => m.customerField).length} of{" "}
                                    {columnMapping.length} columns mapped
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setStep("upload")}>
                                        ← Back
                                    </Button>
                                    <Button onClick={handlePreview}>
                                        Preview & Import →
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === "preview" && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Preview Import</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Preview the first 5 customers that will be imported:
                            </p>

                            <div className="overflow-x-auto mb-6">
                                <table className="w-full text-sm border">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            {columnMapping
                                                .filter((m) => m.customerField)
                                                .map((m, idx) => (
                                                    <th key={`header-${idx}-${m.excelColumn}`} className="px-3 py-2 text-left border">
                                                        {m.customerField}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.slice(0, 5).map((row, rowIdx) => (
                                            <tr key={`row-${rowIdx}`} className="border-t">
                                                {columnMapping
                                                    .filter((m) => m.customerField)
                                                    .map((m, colIdx) => (
                                                        <td key={`cell-${rowIdx}-${colIdx}-${m.excelColumn}`} className="px-3 py-2 border">
                                                            {row[m.excelColumn] || "-"}
                                                        </td>
                                                    ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                                <p className="text-sm">
                                    <strong>Total customers to import:</strong>{" "}
                                    {parsedData.length}
                                </p>
                            </div>

                            {isProcessing && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Importing...</span>
                                        <span>{importProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${importProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep("map")}
                                    disabled={isProcessing}
                                >
                                    Back
                                </Button>
                                <Button onClick={handleImport} disabled={isProcessing}>
                                    {isProcessing ? "Importing..." : "Import Customers"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
