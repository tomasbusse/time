import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Register a font that supports German characters if needed, but standard Helvetica usually works for basic Latin-1
// For now we stick to standard fonts to ensure it works out of the box

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333333',
    },
    header: {
        marginBottom: 30,
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    companyDetails: {
        fontSize: 9,
        color: '#666666',
        lineHeight: 1.4,
    },
    customerSection: {
        marginTop: 20,
        marginBottom: 30,
    },
    senderLine: {
        fontSize: 8,
        color: '#666666',
        marginBottom: 10,
        textDecoration: 'underline',
    },
    customerAddress: {
        fontSize: 10,
        lineHeight: 1.5,
    },
    invoiceInfoGrid: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 20,
    },
    invoiceInfoCol: {
        flex: 1,
    },
    label: {
        fontSize: 8,
        color: '#666666',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#CCCCCC',
        paddingBottom: 5,
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 8,
    },
    colDesc: { width: '45%' },
    colQty: { width: '10%', textAlign: 'right' },
    colUnit: { width: '10%', textAlign: 'right' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTax: { width: '5%', textAlign: 'right' },
    colTotal: { width: '15%', textAlign: 'right' },

    totalsSection: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginTop: 10,
        marginBottom: 30,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
        width: 200,
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        marginRight: 10,
        color: '#666666',
    },
    totalValue: {
        width: 100,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    paymentInfo: {
        marginTop: 20,
        fontSize: 9,
        color: '#444',
        lineHeight: 1.5,
    },
    reportHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 20,
        color: '#333333',
    },
    reportSection: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 4,
    },
    reportTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    reportText: {
        fontSize: 9,
        marginBottom: 3,
        color: '#555555',
    },
    studentList: {
        marginTop: 5,
        marginLeft: 10,
    }
});

interface InvoicePDFProps {
    invoice: any;
    settings: any;
    attendanceReports?: any[];
}

export const InvoicePDF = ({ invoice, settings, attendanceReports }: InvoicePDFProps) => {
    const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString("de-DE");
    const formatCurrency = (amount: number) => (amount / 100).toFixed(2) + " €";

    const subtotal = invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    const total = subtotal + taxTotal;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View>
                            {settings?.logoUrl ? (
                                <Image src={settings.logoUrl} style={{ width: 150, height: 'auto', marginBottom: 10 }} />
                            ) : (
                                <Text style={styles.companyName}>{settings?.companyName}</Text>
                            )}
                        </View>
                        <View style={styles.companyDetails}>
                            <Text>{settings?.ownerName}</Text>
                            <Text>{settings?.addressLine1}</Text>
                            <Text>{settings?.zipCode} {settings?.city}</Text>
                            {settings?.phone1 && <Text>Tel: {settings.phone1}</Text>}
                            {settings?.email && <Text>Email: {settings.email}</Text>}
                        </View>
                    </View>
                </View>

                {/* Customer Section */}
                <View style={styles.customerSection}>
                    <Text style={styles.senderLine}>
                        {settings?.companyName} · {settings?.addressLine1} · {settings?.zipCode} {settings?.city}
                    </Text>
                    <View style={styles.customerAddress}>
                        <Text>{invoice.customer?.companyName || invoice.customer?.name}</Text>
                        <Text>{invoice.customer?.street || invoice.customer?.addressLine1}</Text>
                        <Text>{invoice.customer?.zipCode} {invoice.customer?.city}</Text>
                    </View>
                </View>

                {/* Invoice Info Grid */}
                <View style={styles.invoiceInfoGrid}>
                    <View style={styles.invoiceInfoCol}>
                        <Text style={styles.label}>Rechnungsnummer</Text>
                        <Text style={styles.value}>{invoice.invoiceNumber}</Text>
                    </View>
                    <View style={styles.invoiceInfoCol}>
                        <Text style={styles.label}>Rechnungsdatum</Text>
                        <Text style={styles.value}>{formatDate(invoice.date)}</Text>
                    </View>
                    <View style={styles.invoiceInfoCol}>
                        <Text style={styles.label}>Fälligkeitsdatum</Text>
                        <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
                    </View>
                    {invoice.customer?.customerNumber && (
                        <View style={styles.invoiceInfoCol}>
                            <Text style={styles.label}>Kundennummer</Text>
                            <Text style={styles.value}>{invoice.customer.customerNumber}</Text>
                        </View>
                    )}
                </View>

                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 15 }}>Rechnung</Text>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.label, styles.colDesc]}>Beschreibung</Text>
                        <Text style={[styles.label, styles.colQty]}>Menge</Text>
                        <Text style={[styles.label, styles.colUnit]}>Einh.</Text>
                        <Text style={[styles.label, styles.colPrice]}>Einzelpreis</Text>
                        <Text style={[styles.label, styles.colTax]}>MwSt</Text>
                        <Text style={[styles.label, styles.colTotal]}>Gesamt</Text>
                    </View>
                    {invoice.items.map((item: any, index: number) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={styles.colDesc}>
                                <Text>{item.description}</Text>
                                {item.serviceDate && (
                                    <Text style={{ fontSize: 8, color: '#666' }}>
                                        {new Date(item.serviceDate).toLocaleDateString("de-DE")}
                                        {item.startTime && item.endTime && `, ${item.startTime}-${item.endTime} Uhr`}
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.value, styles.colQty]}>{item.quantity}</Text>
                            <Text style={[styles.value, styles.colUnit]}>{item.unit}</Text>
                            <Text style={[styles.value, styles.colPrice]}>{formatCurrency(item.unitPrice)}</Text>
                            <Text style={[styles.value, styles.colTax]}>{item.taxRate}%</Text>
                            <Text style={[styles.value, styles.colTotal]}>
                                {formatCurrency(item.quantity * item.unitPrice)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Netto:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>MwSt:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(taxTotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { fontWeight: 'bold', color: '#333' }]}>Gesamtbetrag:</Text>
                        <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(total)}</Text>
                    </View>
                </View>

                {/* Payment Info */}
                <View style={styles.paymentInfo}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Zahlungsinformationen</Text>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        {settings?.bankName && <Text>Bank: {settings.bankName}</Text>}
                        {settings?.iban && <Text>IBAN: {settings.iban}</Text>}
                        {settings?.bic && <Text>BIC: {settings.bic}</Text>}
                    </View>
                    {settings?.paymentInstructionTemplate && (
                        <Text style={{ marginTop: 5 }}>{settings.paymentInstructionTemplate}</Text>
                    )}
                </View>

                {/* Footer */}
                <View style={{ marginTop: 30, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 }}>
                    <Text style={{ fontSize: 8, color: '#666', textAlign: 'center' }}>
                        {settings?.companyName} · {settings?.addressLine1} · {settings?.zipCode} {settings?.city}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#666', textAlign: 'center', marginTop: 2 }}>
                        {settings?.taxNumber && `Steuernummer: ${settings.taxNumber}  `}
                        {settings?.vatId && `USt-IdNr.: ${settings.vatId}`}
                    </Text>
                </View>
            </Page>

            {/* Attendance Reports Page */}
            {attendanceReports && attendanceReports.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <Text style={styles.reportHeader}>Anwesenheitsberichte</Text>
                    {attendanceReports.map((report, index) => (
                        <View key={index} style={styles.reportSection}>
                            <Text style={styles.reportTitle}>
                                Bericht vom {formatDate(report.reportDate)}
                            </Text>
                            {report.generalNotes && (
                                <Text style={styles.reportText}>
                                    Notizen: {report.generalNotes}
                                </Text>
                            )}
                            <Text style={[styles.reportText, { marginTop: 5, fontWeight: 'bold' }]}>Anwesend:</Text>
                            {report.studentProgress && report.studentProgress.length > 0 && (
                                <View style={styles.studentList}>
                                    {report.studentProgress.map((prog: any, idx: number) => (
                                        <Text key={idx} style={styles.reportText}>
                                            • {prog.progressNotes} (Level: {prog.skillLevel || '-'})
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </Page>
            )}
        </Document>
    );
};
