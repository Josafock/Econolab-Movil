import { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { Feedback } from '@/ui';

export default function ConnectionBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let active = true;
    const update = (state: Network.NetworkState) => {
      if (active) setOffline(state.isConnected === false || state.isInternetReachable === false);
    };
    void Network.getNetworkStateAsync().then(update).catch(() => undefined);
    const listener = Network.addNetworkStateListener(update);
    return () => { active = false; listener.remove(); };
  }, []);
  return offline ? <Feedback message="Parece que no tienes conexión. Revisa tu red para consultar información actualizada." /> : null;
}
