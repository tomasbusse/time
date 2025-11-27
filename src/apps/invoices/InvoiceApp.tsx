import { useState, useEffect } from "react";
import InvoicesPage from "./InvoicesPage";
import CreateInvoicePage from "./CreateInvoicePage";
import InvoicePreviewPage from "./InvoicePreviewPage";
import CompanySettingsPage from "./CompanySettingsPage";
import LessonCalendarPage from "./LessonCalendarPage";
import CustomerListPage from "./CustomerListPage";

export default function InvoiceApp() {
    const [hash, setHash] = useState(window.location.hash || "#/");

    useEffect(() => {
        const handleHashChange = () => {
            setHash(window.location.hash || "#/");
        };

        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    // Simple hash-based routing
    if (hash === "#/invoices/create" || hash.startsWith("#/invoices/create")) {
        return <CreateInvoicePage />;
    }

    if (hash.startsWith("#/invoices/preview/")) {
        return <InvoicePreviewPage />;
    }

    if (hash.startsWith("#/invoices/edit/")) {
        return <CreateInvoicePage />;
    }

    if (hash === "#/invoices/settings") {
        return <CompanySettingsPage />;
    }

    if (hash === "#/invoices/lessons") {
        return <LessonCalendarPage />;
    }

    if (hash === "#/invoices/customers") {
        return <CustomerListPage onBack={() => window.location.hash = "#/invoices"} />;
    }

    return <InvoicesPage />;
}
