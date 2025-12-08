import { Typography, Row, Col, Card, Statistic } from 'antd';
import { DollarOutlined, HomeOutlined, TeamOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';

const { Title } = Typography;

const LandlordDashboard = () => {
    return (
        <MainLayout>
            <Title level={2}>Landlord Dashboard</Title>
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="My Properties"
                            value={5}
                            prefix={<HomeOutlined />}
                            valueStyle={{ color: '#1ecf49' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="Total Tenants"
                            value={42}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#36ea98' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="Monthly Revenue"
                            value={28450}
                            prefix="KES"
                            suffix={<DollarOutlined />}
                            valueStyle={{ color: '#1ecf49' }}
                        />
                    </Card>
                </Col>
            </Row>
        </MainLayout>
    );
};

export default LandlordDashboard;
