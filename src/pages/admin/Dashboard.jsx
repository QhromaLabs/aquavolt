import { Typography, Row, Col, Card, Statistic } from 'antd';
import {
    DollarOutlined,
    ThunderboltOutlined,
    HomeOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';

const { Title } = Typography;

const AdminDashboard = () => {
    return (
        <MainLayout>
            <Title level={2}>Admin Dashboard</Title>
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Revenue"
                            value={125840}
                            prefix="KES"
                            valueStyle={{ color: '#1ecf49' }}
                            suffix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Properties"
                            value={45}
                            prefix={<HomeOutlined />}
                            valueStyle={{ color: '#36ea98' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Active Users"
                            value={1284}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#1ecf49' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tokens Sold Today"
                            value={342}
                            prefix={<ThunderboltOutlined />}
                            valueStyle={{ color: '#36ea98' }}
                        />
                    </Card>
                </Col>
            </Row>
        </MainLayout>
    );
};

export default AdminDashboard;
