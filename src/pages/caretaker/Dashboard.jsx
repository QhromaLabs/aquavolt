import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const CaretakerDashboard = () => {
    return (
        <MainLayout>
            <Title level={2}>Caretaker Dashboard</Title>
            <Paragraph>Assigned property overview coming soon...</Paragraph>
        </MainLayout>
    );
};

export default CaretakerDashboard;
