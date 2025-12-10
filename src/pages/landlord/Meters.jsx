import { useState } from 'react';
import { Typography, Table, Card, Tag, Space, Button, Modal } from 'antd';
import { ThunderboltOutlined, HomeOutlined, ReloadOutlined, QrcodeOutlined, PrinterOutlined } from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import MainLayout from '../../components/Layout/MainLayout';
import { useLandlordData } from '../../hooks/useLandlordData';

const { Title, Text } = Typography;

const LandlordMeters = () => {
    const { loading, meters, refreshData } = useLandlordData();

    // QR Modal State
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [selectedQrUnit, setSelectedQrUnit] = useState(null);

    const handleGenerateQR = (unit) => {
        setSelectedQrUnit(unit);
        setQrModalVisible(true);
    };

    const handlePrintQR = () => {
        const printContent = document.getElementById('qr-to-print');
        const windowUrl = window.location.href;
        const windowName = 'Print QR Code';
        const printWindow = window.open(windowUrl, windowName, 'left=500,top=500,width=800,height=800');

        // Simple print logic: write the content to the new window
        printWindow.document.write('<html><head><title>Print QR</title>');
        printWindow.document.write('</head><body style="text-align:center; padding-top: 50px;">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const columns = [
        {
            title: 'Meter Number',
            dataIndex: 'meter_number',
            key: 'meter_number',
            render: (text) => (
                <Space>
                    <ThunderboltOutlined style={{ color: '#faad14' }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Property',
            dataIndex: 'property_name',
            key: 'property_name',
            render: (text) => (
                <Space>
                    <HomeOutlined />
                    {text}
                </Space>
            )
        },
        {
            title: 'Unit Number',
            dataIndex: 'label',
            key: 'label',
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                record.status === 'occupied' ?
                    <Tag color="green">Occupied</Tag> :
                    <Tag color="orange">Vacant</Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button
                    icon={<QrcodeOutlined />}
                    size="small"
                    onClick={() => handleGenerateQR(record)}
                >
                    QR Code
                </Button>
            )
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>My Meters</Title>
                <Button icon={<ReloadOutlined />} onClick={refreshData}>Refresh</Button>
            </div>
            <Card>
                <Table
                    columns={columns}
                    dataSource={meters}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Unit QR Code"
                open={qrModalVisible}
                onCancel={() => setQrModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setQrModalVisible(false)}>
                        Close
                    </Button>,
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintQR}>
                        Print
                    </Button>
                ]}
                centered
            >
                <div id="qr-to-print" style={{ textAlign: 'center', padding: '20px' }}>
                    <Title level={4}>{selectedQrUnit?.property_name}</Title>
                    <Text strong style={{ fontSize: '18px', display: 'block', marginBottom: '20px' }}>
                        Unit: {selectedQrUnit?.label}
                    </Text>

                    {selectedQrUnit && (
                        <div style={{ background: 'white', padding: '10px', display: 'inline-block' }}>
                            <QRCodeCanvas 
                                value={JSON.stringify({
                                    action: 'claim_unit',
                                    unit_id: selectedQrUnit.id,
                                    property_id: selectedQrUnit.property_id
                                })}
                                size={256}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <Text type="secondary">Scan this code with the Aquavolt App to claim this unit.</Text>
                    </div>
                </div>
            </Modal>
        </MainLayout>
    );
};

export default LandlordMeters;
