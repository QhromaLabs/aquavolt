import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const LandlordProperties = () => {
    return (
        <MainLayout>
            <Title level={2}>My Properties</Title>
            <Paragraph>Properties view coming soon...</Paragraph>
        </MainLayout>
    );
};

export default LandlordProperties;
