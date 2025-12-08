import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const Settings = () => {
    return (
        <MainLayout>
            <Title level={2}>Settings</Title>
            <Paragraph>Platform settings coming soon...</Paragraph>
        </MainLayout>
    );
};

export default Settings;
