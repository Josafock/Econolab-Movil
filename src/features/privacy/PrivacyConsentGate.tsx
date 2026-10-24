import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage } from '@/core/errors';
import { Button, Feedback, Heading, Loading, Screen } from '@/ui';
import { HttpPrivacyRepository } from './HttpPrivacyRepository';
import PrivacyScreen from './PrivacyScreen';

function ConsentBoundary({ children }: PropsWithChildren) {
  const { logout } = useAuth();
  const [phase, setPhase] = useState<'checking' | 'required' | 'ready' | 'error'>('checking');
  const [failure, setFailure] = useState('');
  const [attempt, setAttempt] = useState(0);
  const accepted = useCallback(() => setPhase('ready'), []);
  useEffect(() => {
    const controller = new AbortController();
    const repository = new HttpPrivacyRepository();
    void Promise.all([repository.notice(controller.signal), repository.preferences(controller.signal)]).then(([notice, preferences]) => {
      if (!controller.signal.aborted) setPhase(preferences.acceptedAt && preferences.noticeVersion === notice.version ? 'ready' : 'required');
    }).catch(error => {
      if (!controller.signal.aborted) { setFailure(errorMessage(error)); setPhase('error'); }
    });
    return () => controller.abort();
  }, [attempt]);
  if (phase === 'ready') return children;
  if (phase === 'required') return <View style={{ flex: 1 }}><PrivacyScreen onAccepted={accepted} /><Button title="Cerrar sesión sin aceptar" variant="secondary" onPress={() => { void logout(); }} /></View>;
  return <Screen topInset bottomInset>
    <Heading title="Tu privacidad" subtitle="Comprobamos el aviso vigente y tus decisiones antes de continuar." />
    {phase === 'checking' ? <Loading /> : <Feedback kind="error" message={failure} onRetry={() => { setPhase('checking'); setAttempt(value => value + 1); }} />}
    <Button title="Cerrar sesión" variant="secondary" onPress={() => { void logout(); }} />
  </Screen>;
}

export default function PrivacyConsentGate({ children }: PropsWithChildren) {
  const { status, session } = useAuth();
  if (status !== 'authenticated' || !session) return children;
  return <ConsentBoundary key={session.usuario.id}>{children}</ConsentBoundary>;
}
