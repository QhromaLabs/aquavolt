// Aquavolt Theme Configuration for Ant Design
export const aquavoltTheme = {
    token: {
        // Brand Colors
        colorPrimary: '#1ecf49',
        colorSuccess: '#1ecf49',
        colorInfo: '#36ea98',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',

        // Typography
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: 14,
        fontSizeHeading1: 38,
        fontSizeHeading2: 30,
        fontSizeHeading3: 24,
        fontSizeHeading4: 20,
        fontSizeHeading5: 16,

        // Layout
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,

        // Spacing
        padding: 16,
        paddingLG: 24,
        paddingSM: 12,
        paddingXS: 8,

        // Colors
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f5f5f5',
        colorBorder: '#d9d9d9',
        colorText: '#000000d9',
        colorTextSecondary: '#00000073',
        colorTextTertiary: '#00000045',
    },
    components: {
        Layout: {
            headerBg: '#ffffff',
            headerPadding: '0 24px',
            siderBg: '#001529',
            bodyBg: '#f0f2f5',
        },
        Menu: {
            darkItemBg: '#001529',
            darkItemSelectedBg: '#1ecf49',
            darkItemHoverBg: '#1ecf4920',
            darkItemColor: '#ffffff',
            darkItemSelectedColor: '#ffffff',
        },
        Button: {
            primaryColor: '#ffffff',
            colorPrimary: '#1ecf49',
            colorPrimaryHover: '#36ea98',
            colorPrimaryActive: '#17a83a',
            borderRadius: 8,
        },
        Card: {
            borderRadiusLG: 12,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        },
        Table: {
            headerBg: '#fafafa',
            headerColor: '#000000d9',
            borderColor: '#f0f0f0',
        },
    },
};
