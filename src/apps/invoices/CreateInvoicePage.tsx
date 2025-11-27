import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useWorkspace } from "../../lib/WorkspaceContext";
import { ArrowLeft, Calendar, Plus, Trash2, Save, Send, AlertTriangle, X } from "lucide-react";

export default function CreateInvoicePage({ onBack, onManageCustomers }: { onBack?: () => void, onManageCustomers?: () => void }) {
    const { workspaceId } = useWorkspace();
    const customers = useQuery(
        api.customers.listCustomers,
        workspaceId ? { workspaceId } : "skip"
    );

    const createInvoice = useMutation(api.invoices.createInvoice);
    const updateInvoice = useMutation(api.invoices.updateInvoice);

    // Check for edit mode
    const editId = window.location.hash.startsWith("#/invoices/edit/")
        ? window.location.hash.split("/").pop() as Id<"invoices">
        : null;

    const existingInvoice = useQuery(api.invoices.getInvoice, editId ? { id: editId } : "skip");

    const [customerId, setCustomerId] = useState<Id<"customers"> | "">("");

    // Fetch selected customer details
    const selectedCustomer = useQuery(api.customers.getCustomer, customerId ? { id: customerId as Id<"customers"> } : "skip");

    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [dueDate, setDueDate] = useState(
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    const [items, setItems] = useState<Array<{
        productId?: Id<"products">;
        description: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        taxRate: number;
        serviceDate?: string;
        startTime?: string;
        endTime?: string;
    }>>([{
        description: "",
        quantity: 1,
        unit: "Hour",
        unitPrice: 0,
        taxRate: 19,
        serviceDate: "",
        startTime: "",
        endTime: "",
    }]);
    const [notes, setNotes] = useState("");
    const [useManualNumber, setUseManualNumber] = useState(false);
    const [manualInvoiceNumber, setManualInvoiceNumber] = useState("");
    const [showCalendarImport, setShowCalendarImport] = useState(false);

    // Customer search state
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomerName, setSelectedCustomerName] = useState("");

    // Populate form when editing
    useEffect(() => {
        if (existingInvoice) {
            setCustomerId(existingInvoice.customerId);
            setDate(new Date(existingInvoice.date).toISOString().split("T")[0]);
            setDueDate(new Date(existingInvoice.dueDate).toISOString().split("T")[0]);
            setNotes(existingInvoice.notes || "");

            if (existingInvoice.items) {
                setItems(existingInvoice.items.map(item => ({
                    productId: item.productId,
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate,
                    serviceDate: item.serviceDate || "",
                    startTime: item.startTime || "",
                    endTime: item.endTime || "",
                })));
            }
        }
    }, [existingInvoice]);

    // Update selected customer name when customer changes
    useEffect(() => {
        if (customerId && customers) {
            const customer = customers.find(c => c._id === customerId);
            if (customer) {
                setSelectedCustomerName(customer.name);
            }
        } else {
            setSelectedCustomerName("");
        }
    }, [customerId, customers]);

    // Filter customers based on search
    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.customerNumber?.toLowerCase().includes(customerSearch.toLowerCase())
    );

    // Calendar Import State
    const importFromCalendar = useAction(api.invoices.importFromCalendar);
    const [importStartDate, setImportStartDate] = useState(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    const [importEndDate, setImportEndDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);

    const fetchEvents = async () => {
        if (!workspaceId) return;
        setIsLoadingEvents(true);
        try {
            const events = await importFromCalendar({
                workspaceId,
                startDate: new Date(importStartDate).toISOString(),
                endDate: new Date(importEndDate).toISOString(),
            });
            setCalendarEvents(events || []);
        } catch (error) {
            console.error("Failed to fetch events:", error);
            alert("Failed to fetch calendar events. Please ensure you are authenticated with Google.");
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const toggleEventSelection = (eventId: string) => {
        const newSelected = new Set(selectedEventIds);
        if (newSelected.has(eventId)) {
            newSelected.delete(eventId);
        } else {
            newSelected.add(eventId);
        }
        setSelectedEventIds(newSelected);
    };

    const importSelectedEvents = () => {
        const selectedEvents = calendarEvents.filter(e => selectedEventIds.has(e.id));

        const newItems = selectedEvents.map(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            const end = new Date(event.end.dateTime || event.end.date);
            const durationMs = end.getTime() - start.getTime();
            const hours = durationMs / (1000 * 60 * 60);

            return {
                description: `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.summary}`,
                quantity: parseFloat(hours.toFixed(2)),
                unit: "Hour",
                unitPrice: 0, // User needs to set price
                taxRate: 19,
                calendarEventId: event.id,
            };
        });

        // If the first item is empty (default state), replace it
        if (items.length === 1 && items[0].description === "" && items[0].unitPrice === 0) {
            setItems(newItems);
        } else {
            setItems([...items, ...newItems]);
        }

        setShowCalendarImport(false);
        setSelectedEventIds(new Set());
    };

    const addItem = () => {
        const defaultRate = selectedCustomer?.defaultHourlyRate ? selectedCustomer.defaultHourlyRate * 100 : 0;
        const defaultTax = selectedCustomer?.isVatExempt ? 0 : 19;

        setItems([...items, {
            description: "",
            quantity: 1,
            unit: "Hour",
            unitPrice: defaultRate,
            taxRate: defaultTax,
            serviceDate: "",
            startTime: "",
            endTime: "",
        }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let taxTotal = 0;

        items.forEach(item => {
            const lineTotal = item.quantity * item.unitPrice;
            const lineTax = lineTotal * (item.taxRate / 100);
            subtotal += lineTotal;
            taxTotal += lineTax;
        });

        return {
            subtotal,
            taxTotal,
            total: subtotal + taxTotal
        };
    };

    const { subtotal, taxTotal, total } = calculateTotals();

    const handleSave = async (status: "draft" | "sent") => {
        if (!customerId) {
            alert("Please select a customer");
            return;
        }

        if (!workspaceId) {
            alert("Workspace not loaded yet");
            return;
        }

        try {
            let invoiceId;
            if (editId) {
                await updateInvoice({
                    id: editId,
                    customerId: customerId as Id<"customers">,
                    date: new Date(date).getTime(),
                    dueDate: new Date(dueDate).getTime(),
                    items,
                    notes,
                    paymentTerms: undefined, // Add if needed
                    relatedCalendarEvents: undefined, // Add if needed
                });
                invoiceId = editId;
            } else {
                invoiceId = await createInvoice({
                    workspaceId,
                    customerId: customerId as Id<"customers">,
                    date: new Date(date).getTime(),
                    dueDate: new Date(dueDate).getTime(),
                    items,
                    notes,
                    status,
                    manualInvoiceNumber: useManualNumber && manualInvoiceNumber ? manualInvoiceNumber : undefined,
                });
            }

            // Navigate to preview page
            window.location.hash = `#/invoices/preview/${invoiceId}`;
        } catch (error) {
            alert("Error saving invoice: " + error);
        }
    };

    // Add loading state
    if (!workspaceId) {
        return <div className="p-6 text-red-600 bg-red-100 border border-red-300 rounded">Loading workspace...</div>;
    }

    return (
        <div className="min-h-screen bg-[#DDDEE3] p-8 font-sans text-[#384C5A]">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-[#384C5A] tracking-tight">{editId ? "Edit Invoice" : "Create Invoice"}</h1>
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                        >
                            <ArrowLeft size={18} /> Back to Invoices
                        </button>
                    )}
                </div>

                <div className="bg-[#F1F5EE] rounded-xl shadow-sm p-8 space-y-8">
                    {/* Customer Selection */}
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-bold text-gray-500 uppercase">Customer *</label>
                            {onManageCustomers && (
                                <button
                                    type="button"
                                    onClick={onManageCustomers}
                                    className="text-sm text-[#A78573] hover:underline font-medium"
                                >
                                    + Manage Customers
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={customerId ? selectedCustomerName : customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    if (customerId) {
                                        setCustomerId("");
                                        setSelectedCustomerName("");
                                    }
                                    setShowCustomerDropdown(true);
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                                onBlur={() => {
                                    // Delay to allow click on dropdown item
                                    setTimeout(() => setShowCustomerDropdown(false), 200);
                                }}
                                placeholder="Search customers by name, company, or number..."
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#A78573] focus:border-transparent"
                                required
                            />
                            {customerId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomerId("");
                                        setSelectedCustomerName("");
                                        setCustomerSearch("");
                                    }}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                            {showCustomerDropdown && !customerId && filteredCustomers && filteredCustomers.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                                    {filteredCustomers.map(customer => (
                                        <div
                                            key={customer._id}
                                            onClick={() => {
                                                const newCustomerId = customer._id as Id<"customers">;
                                                setCustomerId(newCustomerId);
                                                setSelectedCustomerName(customer.name);
                                                setShowCustomerDropdown(false);
                                                setCustomerSearch("");

                                                // Update items with customer defaults
                                                const isVatExempt = customer.isVatExempt;
                                                const hourlyRate = customer.defaultHourlyRate || 0;

                                                setItems(prevItems => prevItems.map(item => ({
                                                    ...item,
                                                    taxRate: isVatExempt ? 0 : 19,
                                                    unitPrice: (item.unit === "Hour" && (item.unitPrice === 0 || item.unitPrice === undefined))
                                                        ? hourlyRate * 100
                                                        : item.unitPrice
                                                })));
                                            }}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                        >
                                            <div className="font-medium text-[#384C5A]">{customer.name}</div>
                                            <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                                {customer.companyName && <span>{customer.companyName}</span>}
                                                {customer.customerNumber && <span>#{customer.customerNumber}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Manual Invoice Number - Migration Feature (Only for new invoices) */}
                    {!editId && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={useManualNumber}
                                        onChange={(e) => setUseManualNumber(e.target.checked)}
                                        className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                                    />
                                    <span className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                                        <AlertTriangle size={16} />
                                        Set Invoice Number Manually (Migration Only)
                                    </span>
                                </label>
                            </div>

                            {useManualNumber && (
                                <div className="mt-3 pl-6">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Invoice Number (YY/MM/XXXX)</label>
                                    <input
                                        type="text"
                                        value={manualInvoiceNumber}
                                        onChange={(e) => setManualInvoiceNumber(e.target.value)}
                                        placeholder="e.g., 25/09/5060"
                                        className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <p className="text-xs text-gray-600 mt-2">
                                        Use this only when migrating from another system. Format: YY/MM/XXXX (Year/Month/SequentialNumber)
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Leave empty for automatic generation. The next invoice will continue from this number.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dates */}
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-[#384C5A]">Line Items</h2>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCalendarImport(true)}
                                    className="px-4 py-2 bg-[#F1F5EE] text-[#384C5A] rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Calendar size={16} /> Import from Calendar
                                </button>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="px-4 py-2 bg-[#384C5A] text-white rounded-lg hover:bg-[#2c3b46] transition-colors font-medium flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                    <div className="grid grid-cols-12 gap-4">
                                        {/* Row 1: Description with dropdown if customer has templates */}
                                        <div className="col-span-12 md:col-span-8">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                            <div className="flex gap-2">
                                                {selectedCustomer?.serviceDescriptions && selectedCustomer.serviceDescriptions.length > 0 && (
                                                    <select
                                                        value=""
                                                        onChange={(e) => updateItem(index, "description", e.target.value)}
                                                        className="border border-gray-200 rounded px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                                    >
                                                        <option value="">Select template...</option>
                                                        {selectedCustomer.serviceDescriptions.map((desc, i) => (
                                                            <option key={i} value={desc}>{desc}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, "description", e.target.value)}
                                                    className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                                    placeholder="e.g., Englischunterricht"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                                            <input
                                                type="date"
                                                value={item.serviceDate || ""}
                                                onChange={(e) => updateItem(index, "serviceDate", e.target.value)}
                                                className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                            />
                                        </div>

                                        {/* Start Time */}
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start</label>
                                            <input
                                                type="time"
                                                value={item.startTime || ""}
                                                onChange={(e) => updateItem(index, "startTime", e.target.value)}
                                                className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                            />
                                        </div>

                                        {/* End Time */}
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End</label>
                                            <input
                                                type="time"
                                                value={item.endTime || ""}
                                                onChange={(e) => updateItem(index, "endTime", e.target.value)}
                                                className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                            />
                                        </div>

                                        {/* Row 2: Quantity, Unit, Price, Tax, Remove */}
                                        <div className="col-span-3 md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
                                                className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-3 md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit</label>
                                            <input
                                                type="text"
                                                value={item.unit}
                                                onChange={(e) => updateItem(index, "unit", e.target.value)}
                                                className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                            />
                                        </div>
                                        <div className="col-span-3 md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unitPrice / 100}
                                                onChange={(e) => updateItem(index, "unitPrice", Math.round(parseFloat(e.target.value) * 100))}
                                                className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax %</label>
                                            <input
                                                type="number"
                                                value={item.taxRate}
                                                onChange={(e) => updateItem(index, "taxRate", parseFloat(e.target.value))}
                                                className="w-full border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">&nbsp;</label>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="w-full px-2 py-2 bg-white border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors flex items-center justify-center"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                            rows={3}
                            placeholder="Add any additional notes for the customer..."
                        />
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-72 bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{(subtotal / 100).toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax:</span>
                                <span className="font-medium">{(taxTotal / 100).toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3 text-[#384C5A]">
                                <span>Total:</span>
                                <span>{(total / 100).toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => onBack ? onBack() : window.location.hash = "/"}
                            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSave("draft")}
                            className="px-6 py-2.5 bg-white border border-[#384C5A] text-[#384C5A] rounded-lg hover:bg-blue-50 font-medium transition-colors flex items-center gap-2"
                        >
                            <Save size={18} /> Save Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSave("sent")}
                            className="px-6 py-2.5 bg-[#384C5A] text-white rounded-lg hover:bg-[#2c3b46] font-medium transition-colors flex items-center gap-2"
                        >
                            <Send size={18} /> Send Invoice
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Import Modal */}
            {showCalendarImport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#384C5A]">Import from Calendar</h2>
                            <button onClick={() => setShowCalendarImport(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex gap-4 mb-6 items-end bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={importStartDate}
                                    onChange={(e) => setImportStartDate(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={importEndDate}
                                    onChange={(e) => setImportEndDate(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                                />
                            </div>
                            <button
                                onClick={fetchEvents}
                                disabled={isLoadingEvents}
                                className="px-4 py-2 bg-[#384C5A] text-white rounded hover:bg-[#2c3b46] transition-colors disabled:opacity-50 font-medium"
                            >
                                {isLoadingEvents ? "Loading..." : "Fetch Events"}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg mb-6">
                            {calendarEvents.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    {isLoadingEvents ? "Loading events..." : "No events found. Select a date range and click Fetch."}
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="p-3 text-left w-10 border-b border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedEventIds(new Set(calendarEvents.map(e => e.id)));
                                                        } else {
                                                            setSelectedEventIds(new Set());
                                                        }
                                                    }}
                                                    checked={calendarEvents.length > 0 && selectedEventIds.size === calendarEvents.length}
                                                    className="rounded text-[#A78573] focus:ring-[#A78573]"
                                                />
                                            </th>
                                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Date/Time</th>
                                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Event</th>
                                            <th className="p-3 text-right text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {calendarEvents.map(event => {
                                            const start = new Date(event.start.dateTime || event.start.date);
                                            const end = new Date(event.end.dateTime || event.end.date);
                                            const durationMs = end.getTime() - start.getTime();
                                            const hours = durationMs / (1000 * 60 * 60);

                                            return (
                                                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEventIds.has(event.id)}
                                                            onChange={() => toggleEventSelection(event.id)}
                                                            className="rounded text-[#A78573] focus:ring-[#A78573]"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-sm text-gray-600">
                                                        {start.toLocaleDateString()} <br />
                                                        <span className="text-xs text-gray-400">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </td>
                                                    <td className="p-3 font-medium text-[#384C5A]">{event.summary}</td>
                                                    <td className="p-3 text-right text-sm text-gray-600">{hours.toFixed(2)} h</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowCalendarImport(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={importSelectedEvents}
                                disabled={selectedEventIds.size === 0}
                                className="px-4 py-2 bg-[#A78573] text-white rounded-lg hover:bg-[#8e6f5e] transition-colors disabled:opacity-50 font-medium"
                            >
                                Import {selectedEventIds.size} Events
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
