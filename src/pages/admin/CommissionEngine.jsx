import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const CommissionEngine = () => {
    return (
        <MainLayout>
            <Title level={2}>Commission Engine</Title>
            <Paragraph>Commission rules engine coming soon...</Paragraph>
        </MainLayout>
    );
};

export default CommissionEngine;
