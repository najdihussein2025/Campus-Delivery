import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const NetworkContext = createContext({ isOnline: true, simulateOffline: false, setSimulateOffline: () => {} });

// Context + NetInfo: tracks the connection; "Simulate offline" (Demo settings) fakes it for the presentation
export function NetworkProvider({ children }) {
  const [state, setState] = useState({ isConnected: null, isInternetReachable: null });
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Subscribe once; the cleanup unsubscribes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((s) => {
      setState({ isConnected: s.isConnected, isInternetReachable: s.isInternetReachable });
    });
    return unsubscribe;
  }, []);

  // `null` means "not known yet" and counts as online, so the app never flashes offline at launch
  const isOnline = state.isConnected !== false && state.isInternetReachable !== false && !simulateOffline;

  const value = useMemo(() => ({ isOnline, simulateOffline, setSimulateOffline }), [isOnline, simulateOffline]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export const useNetwork = () => useContext(NetworkContext);
