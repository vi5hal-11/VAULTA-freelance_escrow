import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { Routes, Route } from 'react-router-dom';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from '@/lib/wagmiConfig';
import AppLayout from '@/components/layout/AppLayout';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import EscrowList from '@/pages/EscrowList';
import CreateEscrow from '@/pages/CreateEscrow';
import ContractDetails from '@/pages/ContractDetails';
import Disputes from '@/pages/Disputes';
import Wallet from '@/pages/Wallet';
import { ToastContainer } from '@/components/ui/Toast';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#6366f1',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          overlayBlur: 'small',
        })}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/escrows" element={<EscrowList />} />
              <Route path="/escrow/create" element={<CreateEscrow />} />
              <Route path="/escrow/:address" element={<ContractDetails />} />
              <Route path="/disputes" element={<Disputes />} />
              <Route path="/wallet" element={<Wallet />} />
            </Route>
          </Routes>
          <ToastContainer />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
