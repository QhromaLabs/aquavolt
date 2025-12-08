import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const LandlordFinance = () => {
    return (
        <MainLayout>
            <Title level={2}>Finance</Title>
            <Paragraph>Finance reports coming soon...</Paragraph>
        </MainLayout>
    );
};

export default LandlordFinance;
