import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, Typography, Divider, Space, message, Tag } from 'antd';
import {
    DownloadOutlined,
    CopyOutlined,
    CheckCircleFilled,
    CloseOutlined,
    ThunderboltOutlined,
    ShareAltOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text } = Typography;

const TokenReceiptModal = ({ visible, onClose, topup, tenantName }) => {
    const receiptRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!visible) {
            setPdfFile(null);
            setIsGenerating(false);
        }
    }, [visible]);

    if (!topup) return null;

    const handleCopyToken = () => {
        if (topup.token) {
            const cleanToken = topup.token.replace(/-/g, '');
            navigator.clipboard.writeText(cleanToken);
            message.success('Token copied to clipboard!');
        }
    };

    const handleGeneratePDF = async () => {
        const input = receiptRef.current;
        if (!input) return;

        try {
            setIsGenerating(true);
            message.loading('Generating receipt...', 1);

            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * (pdfWidth - 40)) / canvas.width;
            pdf.addImage(imgData, 'PNG', 20, 20, pdfWidth - 40, imgHeight);

            // Generate Blob
            const pdfBlob = pdf.output('blob');
            const file = new File([pdfBlob], `AquaVolt_${topup.token}.pdf`, { type: 'application/pdf' });

            setPdfFile(file);
            message.success('Receipt ready to share!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            message.error('Failed to generate receipt');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async () => {
        if (!pdfFile) return;

        if (navigator.share && navigator.canShare({ files: [pdfFile] })) {
            try {
                await navigator.share({
                    files: [pdfFile],
                    title: 'AquaVolt Token Receipt',
                    text: `Here is my electricity token receipt for ${topup.token}.`
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback to download
            const url = URL.createObjectURL(pdfFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = pdfFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            message.info('Sharing not supported, downloading instead.');
        }
    };

    const formatToken = (token) => {
        if (!token) return 'Generating...';
        const cleanToken = token.replace(/-/g, '');
        return cleanToken.match(/.{1,4}/g)?.join('-') || token;
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            styles={{
                content: {
                    padding: 0,
                    borderRadius: 0, // Full screen usually square corners
                    overflow: 'hidden',
                    background: '#f5f5f5',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                },
                mask: {
                    backdropFilter: 'blur(5px)'
                },
                body: {
                    overflowY: 'auto',
                    flex: 1, // Fill available space
                    paddingBottom: '20px'
                }
            }}
            width="100%"
            style={{ top: 0, maxWidth: '100vw', margin: 0, padding: 0 }}
            closeIcon={<div style={{
                background: 'white',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginTop: 8,
                marginRight: 8
            }}><CloseOutlined /></div>}
            footer={(
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexDirection: 'column',
                    padding: '16px',
                    background: 'white', // Ensure footer has background
                    borderTop: '1px solid #f0f0f0'
                }}>
                    <Button
                        key="copy"
                        type="default"
                        size="large"
                        icon={<CopyOutlined />}
                        onClick={handleCopyToken}
                        style={{ borderRadius: '12px', height: '48px', width: '100%' }}
                        block
                    >
                        Copy Token
                    </Button>

                    {!pdfFile ? (
                        <Button
                            key="generate"
                            type="primary"
                            size="large"
                            icon={isGenerating ? <LoadingOutlined /> : <ShareAltOutlined />}
                            onClick={handleGeneratePDF}
                            disabled={isGenerating}
                            style={{
                                background: '#000',
                                borderColor: '#000',
                                borderRadius: '12px',
                                height: '48px',
                                width: '100%'
                            }}
                            block
                        >
                            {isGenerating ? 'Generating...' : 'Share / Download'}
                        </Button>
                    ) : (
                        <Button
                            key="share"
                            type="primary"
                            size="large"
                            icon={<ShareAltOutlined />}
                            onClick={handleShare}
                            style={{
                                background: '#1ecf49',
                                borderColor: '#1ecf49',
                                borderRadius: '12px',
                                height: '48px',
                                width: '100%'
                            }}
                            block
                        >
                            Share Receipt
                        </Button>
                    )}
                </div>
            )}
        >
            <div style={{ padding: '24px 24px 12px' }}>
                {/* Receipt Paper Container */}
                <div
                    ref={receiptRef}
                    style={{
                        background: 'white',
                        padding: '32px 24px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        position: 'relative',
                    }}
                >
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ marginBottom: 12 }}>
                            <img src="/Logo.png" alt="AquaVolt" style={{ height: 40 }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Electricity Token Receipt
                        </Text>
                    </div>

                    <Divider style={{ margin: '16px 0', borderStyle: 'dashed' }} />

                    {/* Amount & Date */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>Amount Paid</Text>
                        <Title level={2} style={{ margin: '4px 0', color: '#1ecf49' }}>
                            KES {parseFloat(topup.amount_paid).toFixed(2)}
                        </Title>
                        <Tag color="success" icon={<CheckCircleFilled />}>Paid Successfully</Tag>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {new Date(topup.created_at).toLocaleString()}
                            </Text>
                        </div>
                    </div>

                    {/* Token Display */}
                    <div style={{
                        background: '#f0fdf4', // Very light green
                        border: '1px dashed #1ecf49',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        marginBottom: 24
                    }}>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                            TOKEN NUMBER
                        </Text>
                        <Title level={3} style={{
                            margin: 0,
                            fontFamily: 'monospace',
                            color: '#000',
                            letterSpacing: '2px'
                        }}>
                            {formatToken(topup.token)}
                        </Title>
                    </div>

                    {/* Details Table */}
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Customer</Text>
                            <Text strong>{tenantName}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Units (kWh)</Text>
                            <Text strong>{topup.units_kwh ? `${topup.units_kwh} kWh` : topup.kwh ? `${topup.kwh} kWh` : 'N/A'}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Meter No.</Text>
                            <Text strong style={{ fontFamily: 'monospace' }}>{topup.units?.meter_number || 'N/A'}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Apartment</Text>
                            <Text strong>{topup.units?.properties?.name || 'N/A'}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Unit</Text>
                            <Text strong>{topup.units?.label || 'N/A'}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Reference</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{topup.reference || topup.id?.slice(0, 8)}</Text>
                        </div>
                    </Space>

                    <Divider style={{ margin: '24px 0 16px', borderStyle: 'dashed' }} />

                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                            Powered by Qhroma Labs
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            aquavolt.com
                        </Text>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default TokenReceiptModal;
