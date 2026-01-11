import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { Layout } from './pages/Layout';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { MyAirdrops } from './pages/MyAirdrops';
import { Claims } from './pages/Claims';
import { ProjectDetails } from './pages/ProjectDetails';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';
import { Inbox } from './pages/Inbox';
import { DailyGM } from './pages/DailyGM';
import { DailyMint } from './pages/DailyMint';
import { Deploy } from './pages/Deploy';
import { OnChainRPG } from './pages/OnChainRPG';
import { Investors } from './pages/Investors';
import { InvestorDetails } from './pages/InvestorDetails';
import { Tools } from './pages/Tools';
import { Faucets } from './pages/Faucets';
import { VerificationModal } from './components/VerificationModal';
import { UsernameModal } from './components/UsernameModal';

// RainbowKit & Wagmi Imports
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, sepolia, baseSepolia, optimismSepolia, arbitrumSepolia, polygonAmoy } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Berachain Testnet Definition
const berachainTestnet = {
  id: 80084,
  name: 'Berachain bArtio',
  nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bartio.rpc.berachain.com'] },
  },
  blockExplorers: {
    default: { name: 'Beratrails', url: 'https://bartio.beratrails.io' },
  },
  testnet: true,
};

const config = getDefaultConfig({
  appName: 'Trackdropz',
  projectId: '8a31ea9e4745b61f8bf4895a45894f98',
  chains: [
    mainnet, polygon, optimism, arbitrum, base,
    sepolia, baseSepolia, optimismSepolia, arbitrumSepolia, polygonAmoy,
    berachainTestnet as any
  ],
  ssr: false,
});

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDataLoaded } = useApp();

  if (!isDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading...</p>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  return (user?.role === 'admin' || user?.memberStatus === 'Admin') ? <>{children}</> : <Navigate to="/" />;
};

import { UsernameModal } from './components/UsernameModal';

// ... (imports remain)

export const App: React.FC = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <RainbowKitProvider theme={darkTheme({ accentColor: '#7c3aed' })}>
            <BrowserRouter>
              <UsernameModal />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home category="all" />} />
                  <Route path="/infofi" element={<Home category="infofi" />} />
                  <Route path="/daily-gm" element={<DailyGM />} />
                  <Route path="/daily-mint" element={<DailyMint />} />
                  <Route path="/deploy" element={<Deploy />} />
                  <Route path="/rpg" element={<OnChainRPG />} />
                  <Route path="/faucets" element={<Faucets />} />
                  <Route path="/project/:id" element={<ErrorBoundary><ProjectDetails /></ErrorBoundary>} />
                  <Route path="/investors" element={<Investors />} />
                  <Route path="/investor/:id" element={<InvestorDetails />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/my-airdrops" element={<ProtectedRoute><MyAirdrops /></ProtectedRoute>} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/claims" element={<Claims type="claims" />} />
                  <Route path="/presales" element={<Claims type="presales" />} />
                  <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                </Route>
              </Routes>
            </BrowserRouter>
          </RainbowKitProvider>
        </AppProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
