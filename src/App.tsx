import { ConfigProvider, theme } from 'antd';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1668dc',
          colorBgContainer: '#0d0d1a',
          colorBgElevated: '#111128',
          colorBorder: '#1a1a2e',
          colorText: '#d4d4d4',
          colorTextSecondary: '#888',
          borderRadius: 4,
          fontSize: 12,
        },
        components: {
          Table: {
            headerBg: '#111128',
            headerColor: '#888',
            rowHoverBg: '#1a1a3e',
            borderColor: '#1a1a2e',
            cellPaddingBlockSM: 4,
            cellPaddingInlineSM: 6,
          },
          Input: {
            colorBgContainer: '#1a1a2e',
            colorBorder: '#333',
          },
          Tag: {
            defaultBg: '#1a1a2e',
            defaultColor: '#ccc',
          },
          Segmented: {
            itemSelectedBg: '#1668dc',
            itemSelectedColor: '#fff',
          },
        },
      }}
    >
      <Dashboard />
    </ConfigProvider>
  );
}

export default App;
