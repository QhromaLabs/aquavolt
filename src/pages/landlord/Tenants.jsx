import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const LandlordTenants = () => {
    return (
        <MainLayout>
            <Title level={2}>My Tenants</Title>
            <Paragraph>Tenants list coming soon...</Paragraph>
        </MainLayout>
    );
};

export default LandlordTenants;
