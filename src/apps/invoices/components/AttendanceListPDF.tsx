import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register standard font (Helvetica is built-in, but we can be explicit if needed)
// Font.register({ family: 'Helvetica' });

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#A78573',
        paddingBottom: 10,
    },
    headerLeft: {
        flexDirection: 'column',
    },
    headerRight: {
        textAlign: 'right',
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#384C5A',
        marginBottom: 4,
    },
    companyAddress: {
        fontSize: 8,
        color: '#666666',
        lineHeight: 1.4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#384C5A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
    },
    customerSection: {
        marginBottom: 20,
    },
    customerLabel: {
        fontSize: 8,
        color: '#666666',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    customerName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333333',
    },
    customerAddress: {
        fontSize: 10,
        color: '#333333',
    },
    table: {
        width: '100%',
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#CCCCCC',
        paddingBottom: 4,
        marginBottom: 4,
        backgroundColor: '#F9FAFB',
        paddingTop: 4,
        paddingLeft: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 4,
        paddingLeft: 4,
    },
    // Compact columns
    colDate: { width: '15%' },
    colTime: { width: '15%' },
    colGroup: { width: '35%' },
    colStatus: { width: '20%' },
    colDuration: { width: '15%', textAlign: 'right', paddingRight: 4 },

    textSmall: {
        fontSize: 9,
    },
    textBold: {
        fontWeight: 'bold',
    },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerCol: {
        width: '30%',
    },
    footerText: {
        fontSize: 7,
        color: '#888888',
        lineHeight: 1.4,
    },
    footerTitle: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#666666',
        marginBottom: 2,
    }
});

interface AttendanceListPDFProps {
    lessons: any[];
    customer: any;
    settings: any;
    startDate: string;
    groups: any[];
    students: any[];
    reports: any[];
}

export const AttendanceListPDF = ({ lessons, customer, settings, startDate, groups, students, reports }: AttendanceListPDFProps) => {

    // Get month from the first lesson or from startDate
    const referenceDate = lessons.length > 0 ? new Date(lessons[0].start) : new Date(startDate);
    const monthName = referenceDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });

    // Extract last name for greeting
    const getLastName = (fullName: string) => {
        const parts = fullName?.trim().split(' ') || [];
        return parts.length > 0 ? parts[parts.length - 1] : fullName;
    };

    // Helper to get student/group names
    const getTargetName = (lesson: any) => {
        if (lesson.groupId) {
            const group = groups?.find(g => g._id === lesson.groupId);
            return group ? `Gruppe: ${group.name}` : "Unbekannte Gruppe";
        }
        if (lesson.studentId) {
            const student = students?.find(s => s._id === lesson.studentId);
            return student ? `${student.firstName} ${student.lastName}` : "Unbekannter Schüler";
        }
        return "-";
    };

    const getStudentsPresent = (lesson: any) => {
        const report = reports?.find(r => r.lessonId === lesson._id);
        if (!report || !report.studentsPresent || report.studentsPresent.length === 0) return null;

        return report.studentsPresent.map((studentId: any) => {
            const student = students?.find(s => s._id === studentId);
            return student ? `${student.firstName} ${student.lastName}` : "Unknown";
        }).filter(Boolean);
    };

    const formatStatus = (status: string) => {
        switch (status) {
            case 'attended': return 'Anwesend';
            case 'cancelled_late': return 'Spät abgesagt';
            case 'cancelled_on_time': return 'Rechtzeitig abgesagt';
            case 'missed': return 'Verpasst';
            default: return status;
        }
    };

    // Sort lessons by Group Name (or Student Name if no group), then by Date
    const sortedLessons = [...lessons].sort((a, b) => {
        const nameA = getTargetName(a).toLowerCase();
        const nameB = getTargetName(b).toLowerCase();

        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;

        return a.start - b.start;
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {settings?.logoUrl ? (
                            <Image src={settings.logoUrl} style={{ height: 60, width: 'auto', marginBottom: 5 }} />
                        ) : (
                            <Text style={styles.companyName}>{settings?.companyName}</Text>
                        )}
                        <Text style={styles.companyAddress}>
                            {settings?.street}, {settings?.city}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.title}>Teilnehmerliste</Text>
                        <Text style={styles.subtitle}>für {monthName}</Text>
                    </View>
                </View>

                {/* Customer Info */}
                <View style={styles.customerSection}>
                    <Text style={styles.customerLabel}>Kunde</Text>
                    <Text style={styles.customerName}>{customer?.companyName || customer?.name}</Text>
                    {!!customer?.street && (
                        <Text style={styles.customerAddress}>
                            {customer.street}, {customer.zipCode} {customer.city}
                        </Text>
                    )}

                    <View style={{ marginTop: 15 }}>
                        <Text style={{ fontSize: 10, marginBottom: 5 }}>
                            Sehr geehrte/r {getLastName(customer?.name)},
                        </Text>
                        <Text style={{ fontSize: 10 }}>
                            hier ist die Teilnehmerliste für {monthName}.
                        </Text>
                    </View>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.textSmall, styles.textBold, styles.colDate]}>Datum</Text>
                    <Text style={[styles.textSmall, styles.textBold, styles.colTime]}>Zeit</Text>
                    <Text style={[styles.textSmall, styles.textBold, styles.colGroup]}>Teilnehmer / Gruppe</Text>
                    <Text style={[styles.textSmall, styles.textBold, styles.colStatus]}>Status</Text>
                    <Text style={[styles.textSmall, styles.textBold, styles.colDuration]}>Dauer</Text>
                </View>

                {/* Table Body */}
                {sortedLessons.map((lesson, index) => {
                    const start = new Date(lesson.start);
                    const end = new Date(lesson.end);
                    const duration = (lesson.end - lesson.start) / (1000 * 60 * 60);
                    const studentsPresent = getStudentsPresent(lesson);

                    return (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.textSmall, styles.colDate]}>
                                {start.toLocaleDateString('de-DE')}
                            </Text>
                            <Text style={[styles.textSmall, styles.colTime]}>
                                {start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <View style={styles.colGroup}>
                                <Text style={[styles.textSmall, styles.textBold]}>
                                    {getTargetName(lesson)}
                                </Text>
                                {studentsPresent && studentsPresent.length > 0 && (
                                    <View style={{ marginTop: 2, paddingLeft: 5 }}>
                                        {studentsPresent.map((name: string, idx: number) => (
                                            <Text key={idx} style={{ fontSize: 8, color: '#555' }}>
                                                • {name}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.textSmall, styles.colStatus]}>
                                {formatStatus(lesson.status)}
                            </Text>
                            <Text style={[styles.textSmall, styles.colDuration]}>
                                {duration.toFixed(2)} h
                            </Text>
                        </View>
                    );
                })}

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerCol}>
                        <Text style={styles.footerTitle}>{settings?.companyName}</Text>
                        <Text style={styles.footerText}>{settings?.street}</Text>
                        <Text style={styles.footerText}>{settings?.city}</Text>
                    </View>
                    <View style={styles.footerCol}>
                        <Text style={styles.footerTitle}>Kontakt</Text>
                        {!!settings?.email && <Text style={styles.footerText}>Email: {settings.email}</Text>}
                        {!!settings?.phone && <Text style={styles.footerText}>Tel: {settings.phone}</Text>}
                        {!!settings?.website && <Text style={styles.footerText}>Web: {settings.website}</Text>}
                    </View>
                    <View style={styles.footerCol}>
                        <Text style={styles.footerTitle}>Bankverbindung</Text>
                        {!!settings?.bankName && <Text style={styles.footerText}>{settings.bankName}</Text>}
                        {!!settings?.iban && <Text style={styles.footerText}>IBAN: {settings.iban}</Text>}
                        {!!settings?.taxId && <Text style={styles.footerText}>St-Nr: {settings.taxId}</Text>}
                    </View>
                </View>
            </Page>
        </Document>
    );
};
