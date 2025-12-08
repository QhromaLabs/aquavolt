import { Typography } from 'antd';
import MainLayout from '../../components/Layout/MainLayout';

const { Title, Paragraph } = Typography;

const UserManagement = () => {
    return (
        <MainLayout>
            <Title level={2}>User Management</Title>
            <Paragraph>User management interface coming soon...</Paragraph>
        </MainLayout>
    );
};

export default UserManagement;
