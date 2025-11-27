import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useWorkspace } from "../../lib/WorkspaceContext";
import { Building2, Save, Upload, Mail, CreditCard, FileText, ArrowLeft, Image as ImageIcon } from "lucide-react";

export default function CompanySettingsPage({ onBack }: { onBack?: () => void }) {
    const { workspaceId } = useWorkspace();
    const settings = useQuery(api.companySettings.getSettings, workspaceId ? { workspaceId } : "skip");
    const updateSettings = useMutation(api.companySettings.updateSettings);
    const generateUploadUrl = useMutation(api.companySettings.generateLogoUploadUrl);

    const [formData, setFormData] = useState({
        companyName: "",
        street: "",
        zipCode: "",
        city: "",
        country: "Germany",
        taxId: "", // Steuernummer
        vatId: "", // USt-IdNr.
        email: "",
        phone: "",
        website: "",
        bankName: "",
        iban: "",
        bic: "",
        accountHolder: "",
        defaultEmailTemplate: "Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie die Rechnung {invoiceNumber} vom {date}.\n\nBitte überweisen Sie den Betrag von {totalAmount} bis zum {dueDate} auf das unten angegebene Konto.\n\nMit freundlichen Grüßen,\n{companyName}",
        logoStorageId: undefined as string | undefined,
        logoUrl: undefined as string | undefined,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (settings) {
            setFormData({
                companyName: settings.companyName || "",
                street: settings.street || "",
                zipCode: settings.zipCode || "",
                city: settings.city || "",
                country: settings.country || "Germany",
                taxId: settings.taxId || "",
                vatId: settings.vatId || "",
                email: settings.email || "",
                phone: settings.phone || "",
                website: settings.website || "",
                bankName: settings.bankName || "",
                iban: settings.iban || "",
                bic: settings.bic || "",
                accountHolder: settings.accountHolder || "",
                defaultEmailTemplate: settings.defaultEmailTemplate || formData.defaultEmailTemplate,
                logoStorageId: settings.logoStorageId,
                logoUrl: settings.logoUrl,
            });
            if (settings.logoUrl) {
                setLogoPreview(settings.logoUrl);
            }
        }
    }, [settings]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId) return;

        setIsSaving(true);
        try {
            let newLogoStorageId = formData.logoStorageId;

            // Handle Logo Upload if changed
            if (logoFile) {
                // 1. Get Upload URL
                const postUrl = await generateUploadUrl();

                // 2. Upload File
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": logoFile.type },
                    body: logoFile,
                });

                if (!result.ok) throw new Error("Upload failed");

                const { storageId } = await result.json();
                newLogoStorageId = storageId;
            }

            // 3. Save Settings
            await updateSettings({
                workspaceId,
                ...formData,
                logoStorageId: newLogoStorageId,
            });

            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!workspaceId) return <div className="p-8 text-center text-gray-500">Loading workspace...</div>;

    return (
        <div className="min-h-screen bg-[#DDDEE3] p-8 font-sans text-[#384C5A]">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-[#384C5A] tracking-tight">Company Settings</h1>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Information */}
                    <div className="bg-[#F1F5EE] rounded-xl shadow-sm p-8 border border-transparent">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
                            <div className="p-2 bg-[#A78573] rounded-lg text-white">
                                <Building2 size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-[#384C5A]">General Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                    placeholder="Your Company GmbH"
                                />
                            </div>

                            {/* Logo Upload */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Company Logo</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon className="text-gray-300" size={32} />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="text-white" size={20} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#A78573] file:text-white hover:file:bg-[#8e6f5e] transition-all cursor-pointer"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">Recommended size: 400x400px. Max 2MB.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street & Number</label>
                                <input
                                    type="text"
                                    value={formData.street}
                                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Zip Code</label>
                                <input
                                    type="text"
                                    value={formData.zipCode}
                                    onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website</label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Legal & Financial */}
                    <div className="bg-[#F1F5EE] rounded-xl shadow-sm p-8 border border-transparent">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
                            <div className="p-2 bg-[#384C5A] rounded-lg text-white">
                                <CreditCard size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-[#384C5A]">Legal & Financial</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax ID (Steuernummer)</label>
                                <input
                                    type="text"
                                    value={formData.taxId}
                                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">VAT ID (USt-IdNr.)</label>
                                <input
                                    type="text"
                                    value={formData.vatId}
                                    onChange={e => setFormData({ ...formData, vatId: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    value={formData.bankName}
                                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Holder</label>
                                <input
                                    type="text"
                                    value={formData.accountHolder}
                                    onChange={e => setFormData({ ...formData, accountHolder: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IBAN</label>
                                <input
                                    type="text"
                                    value={formData.iban}
                                    onChange={e => setFormData({ ...formData, iban: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BIC</label>
                                <input
                                    type="text"
                                    value={formData.bic}
                                    onChange={e => setFormData({ ...formData, bic: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Templates */}
                    <div className="bg-[#F1F5EE] rounded-xl shadow-sm p-8 border border-transparent">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
                            <div className="p-2 bg-[#A78573] rounded-lg text-white">
                                <Mail size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-[#384C5A]">Email Settings</h2>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Default Email Template</label>
                            <div className="text-xs text-gray-500 mb-2">
                                Available placeholders: <code className="bg-gray-200 px-1 rounded">{`{invoiceNumber}`}</code>, <code className="bg-gray-200 px-1 rounded">{`{date}`}</code>, <code className="bg-gray-200 px-1 rounded">{`{dueDate}`}</code>, <code className="bg-gray-200 px-1 rounded">{`{totalAmount}`}</code>, <code className="bg-gray-200 px-1 rounded">{`{companyName}`}</code>
                            </div>
                            <textarea
                                value={formData.defaultEmailTemplate}
                                onChange={e => setFormData({ ...formData, defaultEmailTemplate: e.target.value })}
                                className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#A78573] focus:ring-1 focus:ring-[#A78573] outline-none transition-all h-48 font-mono text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-3 bg-[#384C5A] text-white rounded-lg hover:bg-[#2c3b46] transition-all shadow-md font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={20} />
                            {isSaving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
