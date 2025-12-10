import { useEffect, useRef, useState } from 'react';
import { Modal, Button, Typography, message, Upload } from 'antd';
import { Html5Qrcode } from 'html5-qrcode';
import { CloseOutlined, PictureOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ScanModal = ({ open, onClose, onScan }) => {
    const [cameraActive, setCameraActive] = useState(false);
    const html5QrCodeRef = useRef(null);

    // Cleanup on close or unmount
    useEffect(() => {
        if (!open) {
            stopScanner();
            setCameraActive(false);
        }
        return () => {
            stopScanner(); // safety cleanup on unmount
        };
    }, [open]);

    const startScanner = async () => {
        setCameraActive(true);
        // Small delay to ensure DOM element exists
        setTimeout(async () => {
            try {
                // Ensure no previous instance is running
                if (html5QrCodeRef.current) {
                    await stopScanner();
                }

                const html5QrCode = new Html5Qrcode("reader");
                html5QrCodeRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: window.innerWidth / window.innerHeight
                    },
                    (decodedText) => {
                        // Success callback
                        onScan(decodedText);
                        stopScanner();
                        setCameraActive(false); // Switch back or close will happen via parent
                    },
                    (errorMessage) => {
                        // ignore scanning errors
                    }
                );
            } catch (err) {
                console.error("Camera start error:", err);
                message.error("Failed to start camera. Please check permissions.");
                setCameraActive(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (e) {
                console.error("Failed to stop scanner", e);
            }
            html5QrCodeRef.current = null;
        }
    };

    const handleClose = () => {
        stopScanner();
        setCameraActive(false);
        onClose();
    };

    const handleFileUpload = async (file) => {
        try {
            const html5QrCode = new Html5Qrcode("reader-hidden");
            const result = await html5QrCode.scanFile(file, false);
            onScan(result);
            html5QrCode.clear();
        } catch (err) {
            console.error("File scan error:", err);
            message.error("Could not find QR code in image.");
        }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            closeIcon={null}
            width="100%"
            style={{
                top: 0,
                maxWidth: '100vw',
                height: '100vh',
                padding: 0,
                margin: 0,
            }}
            styles={{
                content: {
                    height: '100vh',
                    borderRadius: 0,
                    padding: 0,
                    overflow: 'hidden'
                }
            }}
            wrapClassName="full-screen-modal"
            centered
        >
            <div id="reader-hidden" style={{ display: 'none' }}></div>
            {!cameraActive ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100%',
                    width: '100%',
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: '#ffffff',
                    position: 'relative'
                }}>
                    <Button
                        type="text"
                        icon={<CloseOutlined style={{ fontSize: 24, color: '#333' }} />}
                        onClick={handleClose}
                        style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
                    />

                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        maxWidth: '400px',
                        marginTop: '-40px'
                    }}>
                        <img
                            src="/scan_illustration_v2.png"
                            alt="Scan Illustration"
                            style={{
                                width: '100%',
                                maxWidth: '280px',
                                maxHeight: '280px',
                                marginBottom: '24px',
                                objectFit: 'contain'
                            }}
                        />
                        <Title level={2} style={{ marginBottom: '16px', fontWeight: 700, color: '#1a1a1a' }}>Scan QR Code</Title>

                        <div style={{ marginBottom: '32px' }}>
                            <Text type="secondary" style={{ fontSize: '15px', lineHeight: 1.6, display: 'block', marginBottom: '8px' }}>
                                Locate the unique QR code sticker on your electricity meter.
                            </Text>
                            <Text type="secondary" style={{ fontSize: '15px', lineHeight: 1.6, display: 'block' }}>
                                Ensure you are in a well-lit area and hold your device steady.
                            </Text>
                        </div>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Button
                                type="primary"
                                size="large"
                                onClick={startScanner}
                                style={{
                                    width: '100%',
                                    height: '56px',
                                    borderRadius: '28px',
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #1ecf49 0%, #0eb53e 100%)',
                                    border: 'none',
                                    boxShadow: '0 8px 20px rgba(30, 207, 73, 0.3)'
                                }}
                            >
                                Start Scanning
                            </Button>

                            <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={(file) => {
                                    handleFileUpload(file);
                                    return false;
                                }}
                            >
                                <Button
                                    size="large"
                                    icon={<PictureOutlined />}
                                    style={{
                                        width: '100%',
                                        height: '56px',
                                        borderRadius: '28px',
                                        fontSize: '16px',
                                        fontWeight: 500
                                    }}
                                    block
                                >
                                    Upload from Gallery
                                </Button>
                            </Upload>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative', overflow: 'hidden' }}>

                    {/* Camera view container */}
                    <div id="reader" style={{ width: '100%', height: '100%' }}></div>

                    {/* Branding / Header Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        padding: '40px 20px 20px',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
                        zIndex: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>Scan Meter</Text>
                        <Button
                            shape="circle"
                            icon={<CloseOutlined style={{ color: 'white' }} />}
                            onClick={handleClose}
                            ghost
                            style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                        />
                    </div>

                    {/* Scanner Frame Guide (Visual Only) */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '250px',
                        height: '250px',
                        border: '2px solid rgba(255, 255, 255, 0.5)',
                        borderRadius: '20px',
                        zIndex: 5,
                        boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.5)' // Dim surrounding
                    }}>
                        {/* Corner markers */}
                        <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '4px solid #1ecf49', borderLeft: '4px solid #1ecf49', borderTopLeftRadius: 20 }}></div>
                        <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '4px solid #1ecf49', borderRight: '4px solid #1ecf49', borderTopRightRadius: 20 }}></div>
                        <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '4px solid #1ecf49', borderLeft: '4px solid #1ecf49', borderBottomLeftRadius: 20 }}></div>
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '4px solid #1ecf49', borderRight: '4px solid #1ecf49', borderBottomRightRadius: 20 }}></div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ScanModal;
