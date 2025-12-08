import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const AgentDashboard = () => {
    return (
        <MainLayout>
            <Title level={2}>Agent Dashboard</Title>
            <Paragraph>Commission tracking coming soon...</Paragraph>
        </MainLayout>
    );
};

export default AgentDashboard;
