import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useWorkspace } from "../../lib/WorkspaceContext";
import StudentList from "./components/StudentList";
import GroupList from "./components/GroupList";
import CustomerAttendanceList from "./components/CustomerAttendanceList";
import CustomerImportModal from "./components/CustomerImportModal";
import { FileUp, RotateCcw, Search, Plus, Users, Calendar, Settings, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";

export default function CustomerListPage({ onBack }: { onBack?: () => void }) {
    const { workspaceId } = useWorkspace();
    const customers = useQuery(api.customers.listCustomers, workspaceId ? { workspaceId } : "skip");
    const createCustomer = useMutation(api.customers.createCustomer);
    const updateCustomer = useMutation(api.customers.updateCustomer);
    const deleteCustomer = useMutation(api.customers.deleteCustomer);
    const importBatches = useQuery((api as any).customerImports.listImportBatches, workspaceId ? { workspaceId } : "skip");
    const rollbackImport = useMutation((api as any).customerImports.rollbackImportBatch);
    const currentUser = useQuery(api.users.getCurrentUser);
    const deleteAllCustomers = useMutation((api as any).adminCleanup.deleteAllCustomers);
    const toggleCustomerActive = useMutation(api.customers.toggleCustomerActive);

    const [isModalOpen, setIsModalOpen] = useState(false); // For creating new customer
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'students' | 'groups' | 'attendance'>('details');
    const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('active');
    const deactivateAll = useMutation(api.customers.deactivateAllCustomers);

    // Form State (for both modal and details tab)
    const [formData, setFormData] = useState({
        // Identity
        companyName: "",
        salutation: "",
        title: "",
        firstName: "",
        lastName: "",

        // Contact
        emails: [""] as string[], // Array of emails, first is primary
        contactPerson: "", // Legacy/Extra

        // Address
        street: "",
        supplement1: "",
        supplement2: "",
        zipCode: "",
        city: "",
        state: "",
        country: "Germany",

        // PO Box
        poBox: "",
        poBoxZipCode: "",
        poBoxCity: "",
        poBoxState: "",
        poBoxCountry: "Germany",

        // Financial
        vatId: "",
        taxNumber: "",
        customerNumber: "",
        phone1: "",
        phone2: "",
        paymentTermsDays: 14,
        defaultHourlyRate: 0,
        isVatExempt: false,
        notes: "",
        serviceDescriptions: [] as string[],
    });

    // Initialize form data when selectedCustomer changes
    useEffect(() => {
        if (selectedCustomer) {
            setFormData({
                companyName: selectedCustomer.companyName || "",
                salutation: selectedCustomer.salutation || "",
                title: selectedCustomer.title || "",
                firstName: selectedCustomer.firstName || "",
                lastName: selectedCustomer.lastName || "",

                emails: selectedCustomer.emails && selectedCustomer.emails.length > 0
                    ? selectedCustomer.emails
                    : selectedCustomer.email
                        ? [selectedCustomer.email]
                        : [""], // Migrate legacy email to array
                contactPerson: selectedCustomer.contactPerson || "",

                street: selectedCustomer.street || selectedCustomer.addressLine1 || "",
                supplement1: selectedCustomer.supplement1 || "",
                supplement2: selectedCustomer.supplement2 || selectedCustomer.addressLine2 || "",
                zipCode: selectedCustomer.zipCode || "",
                city: selectedCustomer.city || "",
                state: selectedCustomer.state || "",
                country: selectedCustomer.country || "Germany",

                poBox: selectedCustomer.poBox || "",
                poBoxZipCode: selectedCustomer.poBoxZipCode || "",
                poBoxCity: selectedCustomer.poBoxCity || "",
                poBoxState: selectedCustomer.poBoxState || "",
                poBoxCountry: selectedCustomer.poBoxCountry || "Germany",

                vatId: selectedCustomer.vatId || "",
                taxNumber: selectedCustomer.taxNumber || "",
                customerNumber: selectedCustomer.customerNumber || "",
                phone1: selectedCustomer.phone1 || "",
                phone2: selectedCustomer.phone2 || "",
                paymentTermsDays: selectedCustomer.paymentTermsDays || 14,
                defaultHourlyRate: selectedCustomer.defaultHourlyRate || 0,
                isVatExempt: selectedCustomer.isVatExempt || false,
                notes: selectedCustomer.notes || "",
                serviceDescriptions: selectedCustomer.serviceDescriptions || [],
            });
        }
    }, [selectedCustomer]);

    const handleOpenCreateModal = () => {
        setSelectedCustomer(null);
        setFormData({
            companyName: "",
            salutation: "",
            title: "",
            firstName: "",
            lastName: "",
            emails: [""],
            contactPerson: "",
            street: "",
            supplement1: "",
            supplement2: "",
            zipCode: "",
            city: "",
            state: "",
            country: "Germany",
            poBox: "",
            poBoxZipCode: "",
            poBoxCity: "",
            poBoxState: "",
            poBoxCountry: "Germany",
            vatId: "",
            taxNumber: "",
            customerNumber: "",
            phone1: "",
            phone2: "",
            paymentTermsDays: 14,
            defaultHourlyRate: 0,
            isVatExempt: false,
            notes: "",
            serviceDescriptions: [],
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId) return;

        // Filter out empty emails
        const validEmails = formData.emails.filter(e => e.trim() !== "");
        const primaryEmail = validEmails.length > 0 ? validEmails[0] : undefined;

        const customerData = {
            ...formData,
            workspaceId,
            name: formData.companyName || `${formData.firstName} ${formData.lastName}`.trim() || "Unnamed Customer",
            defaultHourlyRate: Number(formData.defaultHourlyRate),
            paymentTermsDays: Number(formData.paymentTermsDays),
            emails: validEmails,
            email: primaryEmail, // Legacy support
        };

        try {
            if (selectedCustomer) {
                await updateCustomer({
                    id: selectedCustomer._id,
                    ...customerData,
                });
                alert("Customer updated!");
            } else {
                await createCustomer({
                    ...customerData,
                    isActive: true,
                });
                alert("Customer created!");
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("Failed to save customer");
        }
    };

    const handleDelete = async (id: Id<"customers">) => {
        if (confirm("Are you sure you want to delete this customer?")) {
            await deleteCustomer({ id });
            if (selectedCustomer?._id === id) {
                setSelectedCustomer(null);
            }
        }
    };

    const handleRollback = async (batchId: string) => {
        if (confirm("Are you sure you want to rollback this import? This will delete all customers created in this batch.")) {
            await rollbackImport({ batchId });
        }
    };

    const filteredCustomers = customers?.filter(c => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.customerNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            filterStatus === 'all' ? true :
                filterStatus === 'active' ? c.isActive !== false :
                    c.isActive === false;

        return matchesSearch && matchesStatus;
    });

    // Helper to update array of emails
    const updateEmail = (index: number, value: string) => {
        const newEmails = [...formData.emails];
        newEmails[index] = value;
        setFormData({ ...formData, emails: newEmails });
    };

    const addEmailField = () => {
        setFormData({ ...formData, emails: [...formData.emails, ""] });
    };

    const removeEmailField = (index: number) => {
        const newEmails = formData.emails.filter((_, i) => i !== index);
        setFormData({ ...formData, emails: newEmails.length ? newEmails : [""] });
    };


    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#DDDEE3]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#384C5A] tracking-tight">Customers</h1>
                    <div className="flex gap-6 mt-3 text-sm font-medium text-gray-500">
                        <button
                            onClick={() => window.location.hash = "#/invoices"}
                            className="hover:text-[#384C5A] flex items-center gap-2 transition-colors"
                        >
                            <Settings size={18} className="rotate-90" /> Invoices
                        </button>
                        <button
                            onClick={() => window.location.hash = "#/invoices/lessons"}
                            className="hover:text-[#384C5A] flex items-center gap-2 transition-colors"
                        >
                            <Calendar size={18} /> Lessons
                        </button>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-4 py-2 bg-[#F1F5EE] border border-transparent text-[#384C5A] rounded-lg hover:bg-white transition-all shadow-sm font-medium flex items-center gap-2"
                    >
                        <FileUp size={16} /> Import CSV
                    </button>
                    <button
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-[#A78573] text-white rounded-lg hover:bg-[#8e6f5e] transition-all shadow-md font-medium flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Customer
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
                {/* Left Sidebar: List */}
                <div className="lg:col-span-4 flex flex-col bg-[#F1F5EE] rounded-xl shadow-sm overflow-hidden border border-transparent">
                    {/* Search & Filter */}
                    <div className="p-4 border-b border-gray-200 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A78573]"
                            />
                        </div>
                        <div className="flex bg-[#EAEAEA] p-1 rounded-lg">
                            {(['active', 'inactive', 'all'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${filterStatus === status
                                        ? "bg-[#384C5A] text-white shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Customer List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredCustomers?.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No customers found.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredCustomers?.map(customer => (
                                    <div
                                        key={customer._id}
                                        onClick={() => setSelectedCustomer(customer)}
                                        className={`p-4 cursor-pointer transition-colors hover:bg-white ${selectedCustomer?._id === customer._id ? "bg-white border-l-4 border-[#A78573]" : "border-l-4 border-transparent"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-[#384C5A] truncate pr-2">{customer.name}</span>
                                            {customer.isActive === false && (
                                                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Inactive</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                                            {customer.companyName && <span>{customer.companyName}</span>}
                                            {customer.customerNumber && <span>#{customer.customerNumber}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Content: Details */}
                <div className="lg:col-span-8 bg-[#F1F5EE] rounded-xl shadow-sm overflow-hidden border border-transparent flex flex-col">
                    {selectedCustomer ? (
                        <>
                            {/* Detail Header */}
                            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-white">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#384C5A] mb-1">{selectedCustomer.name}</h2>
                                    <div className="text-sm text-gray-500 flex gap-4">
                                        <span>#{selectedCustomer.customerNumber || "No Number"}</span>
                                        {selectedCustomer.email && <span>{selectedCustomer.email}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleCustomerActive({ id: selectedCustomer._id })}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${selectedCustomer.isActive !== false
                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                            : "bg-green-50 text-green-600 hover:bg-green-100"
                                            }`}
                                    >
                                        {selectedCustomer.isActive !== false ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedCustomer._id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 bg-white px-6">
                                {(['details', 'students', 'groups', 'attendance'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                            ? "border-[#A78573] text-[#A78573]"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {activeTab === 'details' && (
                                    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
                                        {/* Identity */}
                                        <section>
                                            <h3 className="text-lg font-bold text-[#384C5A] mb-4 flex items-center gap-2">
                                                <Users size={20} /> Identity
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.companyName}
                                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                                        className="w-full p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.firstName}
                                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                        className="w-full p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.lastName}
                                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                        className="w-full p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        {/* Contact */}
                                        <section>
                                            <h3 className="text-lg font-bold text-[#384C5A] mb-4 flex items-center gap-2">
                                                <Settings size={20} /> Contact
                                            </h3>
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-gray-500 uppercase">Email Addresses</label>
                                                {formData.emails.map((email, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="email"
                                                            value={email}
                                                            onChange={e => updateEmail(index, e.target.value)}
                                                            placeholder={index === 0 ? "Primary Email" : "Additional Email"}
                                                            className="flex-1 p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                        />
                                                        {formData.emails.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEmailField(index)}
                                                                className="p-2 text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addEmailField}
                                                    className="text-sm text-[#A78573] hover:underline flex items-center gap-1"
                                                >
                                                    <Plus size={14} /> Add another email
                                                </button>
                                            </div>
                                        </section>

                                        {/* Address */}
                                        <section>
                                            <h3 className="text-lg font-bold text-[#384C5A] mb-4 flex items-center gap-2">
                                                <Calendar size={20} /> Address
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street</label>
                                                    <input
                                                        type="text"
                                                        value={formData.street}
                                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                                        className="w-full p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Zip Code</label>
                                                    <input
                                                        type="text"
                                                        value={formData.zipCode}
                                                        onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                                        className="w-full p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                                    <input
                                                        type="text"
                                                        value={formData.city}
                                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                        className="w-full p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        {/* Financial */}
                                        <section>
                                            <h3 className="text-lg font-bold text-[#384C5A] mb-4 flex items-center gap-2">
                                                <Settings size={20} /> Financial
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Number</label>
                                                    <input
                                                        type="text"
                                                        value={formData.customerNumber}
                                                        onChange={e => setFormData({ ...formData, customerNumber: e.target.value })}
                                                        className="w-full p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Default Hourly Rate (€)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.defaultHourlyRate}
                                                        onChange={e => setFormData({ ...formData, defaultHourlyRate: parseFloat(e.target.value) })}
                                                        className="w-full p-2 rounded border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                className="px-6 py-2 bg-[#384C5A] text-white rounded-lg hover:bg-[#2c3b46] transition-colors font-medium"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {activeTab === 'students' && (
                                    <StudentList customerId={selectedCustomer._id} />
                                )}

                                {activeTab === 'groups' && (
                                    <GroupList customerId={selectedCustomer._id} />
                                )}

                                {activeTab === 'attendance' && (
                                    <CustomerAttendanceList customerId={selectedCustomer._id} />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <Users size={48} className="mb-4 opacity-20" />
                            <p>Select a customer to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal - Simplified for brevity, but should match style */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#384C5A]">Add New Customer</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Reuse the form logic here, or extract to component */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full p-2 rounded border border-gray-200"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full p-2 rounded border border-gray-200"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.emails[0]}
                                        onChange={e => updateEmail(0, e.target.value)}
                                        className="w-full p-2 rounded border border-gray-200"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#384C5A] text-white rounded-lg hover:bg-[#2c3b46]"
                                    >
                                        Create Customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <CustomerImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                workspaceId={workspaceId!}
                onImportComplete={() => setIsImportModalOpen(false)}
            />
        </div>
    );
}
