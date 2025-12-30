import { useState, useEffect } from 'react';
import { Card, Input, Button, Typography, message, Space, Divider, Alert } from 'antd';
import { AndroidOutlined, LinkOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';

const { Title, Text, Paragraph } = Typography;

const AppUpdate = () => {
    const [loading, setLoading] = useState({ tenant: false, landlord: false });
    const [links, setLinks] = useState({ tenant: '', landlord: '' });

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            // Fetch tenant app link
            const { data: tenantData } = await supabase
                .from('admin_settings')
                .select('value')
                .eq('key', 'tenant_app_download_link')
                .single();

            // Fetch landlord app link
            const { data: landlordData } = await supabase
                .from('admin_settings')
                .select('value')
                .eq('key', 'landlord_app_download_link')
                .single();

            setLinks({
                tenant: tenantData?.value || '',
                landlord: landlordData?.value || ''
            });
        } catch (error) {
            console.error('Error fetching links:', error);
        }
    };

    const convertToDirectDownloadLink = (driveLink) => {
        // Convert Google Drive view link to direct download link
        // From: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        // To: https://drive.google.com/uc?export=download&id=FILE_ID

        if (!driveLink) return '';

        const fileIdMatch = driveLink.match(/\/d\/([^/]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }

        // If it's already a direct link or unknown format, return as is
        return driveLink;
    };

    const handleSaveLink = async (type) => {
        const link = links[type];
        if (!link.trim()) {
            message.error('Please enter a valid Google Drive link');
            return;
        }

        setLoading(prev => ({ ...prev, [type]: true }));

        try {
            const settingKey = type === 'tenant' ? 'tenant_app_download_link' : 'landlord_app_download_link';

            // Upsert the link
            const { error } = await supabase
                .from('admin_settings')
                .upsert({
                    key: settingKey,
                    value: link.trim(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'key'
                });

            if (error) throw error;

            message.success(`${type === 'tenant' ? 'Tenant' : 'Landlord'} app link saved successfully!`);
        } catch (error) {
            console.error('Error saving link:', error);
            message.error('Failed to save link: ' + error.message);
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    return (
        <MainLayout>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <Title level={2}>App Download Links Management</Title>
                <Paragraph>
                    Provide Google Drive links for the Tenant and Landlord APK files.
                    Users will download directly from Google Drive.
                </Paragraph>

                <Alert
                    message="How to get a Google Drive shareable link"
                    description={
                        <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
                            <li>Upload your APK to Google Drive</li>
                            <li>Right-click the file and select "Share"</li>
                            <li>Set access to "Anyone with the link"</li>
                            <li>Copy the link and paste it below</li>
                        </ol>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Divider />

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Tenant App Section */}
                    <Card
                        title={<Space><AndroidOutlined style={{ color: '#1ECF49' }} /> Tenant App Download Link</Space>}
                        bordered={false}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div>
                                <Text strong>Google Drive Link:</Text>
                                <Input
                                    placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                                    value={links.tenant}
                                    onChange={(e) => setLinks(prev => ({ ...prev, tenant: e.target.value }))}
                                    prefix={<LinkOutlined />}
                                    size="large"
                                    style={{ marginTop: 8 }}
                                />
                            </div>

                            {links.tenant && (
                                <Alert
                                    message="Direct Download Link (what users will use)"
                                    description={
                                        <a
                                            href={convertToDirectDownloadLink(links.tenant)}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ wordBreak: 'break-all' }}
                                        >
                                            {convertToDirectDownloadLink(links.tenant)}
                                        </a>
                                    }
                                    type="success"
                                    showIcon
                                />
                            )}

                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={loading.tenant}
                                onClick={() => handleSaveLink('tenant')}
                                size="large"
                            >
                                Save Tenant App Link
                            </Button>
                        </Space>
                    </Card>

                    {/* Landlord App Section */}
                    <Card
                        title={<Space><AndroidOutlined style={{ color: '#3B82F6' }} /> Landlord App Download Link</Space>}
                        bordered={false}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div>
                                <Text strong>Google Drive Link:</Text>
                                <Input
                                    placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                                    value={links.landlord}
                                    onChange={(e) => setLinks(prev => ({ ...prev, landlord: e.target.value }))}
                                    prefix={<LinkOutlined />}
                                    size="large"
                                    style={{ marginTop: 8 }}
                                />
                            </div>

                            {links.landlord && (
                                <Alert
                                    message="Direct Download Link (what users will use)"
                                    description={
                                        <a
                                            href={convertToDirectDownloadLink(links.landlord)}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ wordBreak: 'break-all' }}
                                        >
                                            {convertToDirectDownloadLink(links.landlord)}
                                        </a>
                                    }
                                    type="success"
                                    showIcon
                                />
                            )}

                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={loading.landlord}
                                onClick={() => handleSaveLink('landlord')}
                                size="large"
                            >
                                Save Landlord App Link
                            </Button>
                        </Space>
                    </Card>
                </Space>
            </div>
        </MainLayout>
    );
};

export default AppUpdate;
