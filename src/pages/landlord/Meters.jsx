import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const LandlordMeters = () => {
    return (
        <MainLayout>
            <Title level={2}>My Meters</Title>
            <Paragraph>Meters overview coming soon...</Paragraph>
        </MainLayout>
    );
};

export default LandlordMeters;
