import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';

import { api } from '@/core/api';
import { AppError, errorMessage, isCancelled } from '@/core/errors';
import { loginRequest, logoutRequest, refreshRequest, validateSession } from './api';
import { isSessionExpired, readSession, removeSession, saveSession, type Session, type User } from './session';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';
type AuthState = { session: Session | null; status: AuthStatus; error?: string; notice?: string; profile?: User };
type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
  applyProfile: (profile: User, expectedToken: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const expirationNotice = 'Tu sesión terminó. Inicia sesión de nuevo para continuar.';

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ session: null, status: 'loading' });
  const currentSession = useRef<Session | null>(null);
  const operation = useRef(0);
  const mounted = useRef(false);
  const pendingRemoval = useRef(false);
  const requestController = useRef<AbortController | null>(null);
  const refreshing = useRef<{ token: string; promise: Promise<string | null> } | null>(null);

  const isCurrent = useCallback((id: number) => mounted.current && operation.current === id, []);

  const clearSession = useCallback(async (notice: string) => {
    const id = ++operation.current;
    requestController.current?.abort();
    requestController.current = null;
    currentSession.current = null;
    api.setToken(null);
    pendingRemoval.current = true;
    if (mounted.current) setState({ session: null, status: 'loading', notice });
    try {
      await removeSession();
      if (!isCurrent(id)) return;
      pendingRemoval.current = false;
      setState({ session: null, status: 'anonymous', notice });
    } catch (error) {
      if (isCurrent(id)) setState({ session: null, status: 'error', error: errorMessage(error), notice });
    }
  }, [isCurrent]);

  const refresh = useCallback((expectedToken: string): Promise<string | null> => {
    if (refreshing.current?.token === expectedToken) return refreshing.current.promise;
    const candidate = currentSession.current;
    if (!candidate || candidate.token !== expectedToken || !candidate.refreshToken) return Promise.resolve(null);
    const id = operation.current;
    const promise = (async () => {
      try {
        const next = await refreshRequest(candidate);
        if (!isCurrent(id) || currentSession.current?.token !== expectedToken) return null;
        await saveSession(next);
        if (!isCurrent(id) || currentSession.current?.token !== expectedToken) return null;
        currentSession.current = next;
        api.setToken(next.token);
        setState({ session: next, status: 'authenticated', profile: next.usuario });
        return next.token;
      } catch (error) {
        if (isCurrent(id) && currentSession.current?.token === expectedToken && error instanceof AppError &&
            ['unauthorized', 'forbidden', 'storage'].includes(error.kind)) await clearSession(expirationNotice);
        throw error;
      } finally {
        if (refreshing.current?.token === expectedToken) refreshing.current = null;
      }
    })();
    refreshing.current = { token: expectedToken, promise };
    return promise;
  }, [clearSession, isCurrent]);

  const restore = useCallback(async () => {
    // Foreground/retry must not invalidate a rotation whose reply is still being saved.
    if (refreshing.current && refreshing.current.token === currentSession.current?.token) {
      try { await refreshing.current.promise; } catch { /* Restore classifies the current state below. */ }
    }
    if (pendingRemoval.current) {
      await clearSession('La sesión local se cerró. Puedes iniciar sesión de nuevo.');
      return;
    }
    const id = ++operation.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    api.setToken(null);
    if (mounted.current) setState((previous) => ({ session: null, status: 'loading', notice: previous.notice }));
    try {
      const candidate = currentSession.current ?? await readSession();
      if (!isCurrent(id)) return;
      if (!candidate) {
        currentSession.current = null;
        setState({ session: null, status: 'anonymous' });
        return;
      }
      currentSession.current = candidate;
      api.setToken(candidate.token);
      if (isSessionExpired(candidate)) {
        const renewed = await refresh(candidate.token);
        if (!renewed) { await clearSession(expirationNotice); return; }
      }
      await validateSession(controller.signal, false);
      if (!isCurrent(id)) return;
      const active = currentSession.current;
      if (!active || isSessionExpired(active)) {
        await clearSession(expirationNotice);
        return;
      }
      setState({ session: active, status: 'authenticated' });
    } catch (error) {
      if (!isCurrent(id) || isCancelled(error)) return;
      api.setToken(null);
      if (error instanceof AppError && (error.kind === 'unauthorized' || error.kind === 'forbidden')) {
        await clearSession(error.kind === 'forbidden' ? 'Esta cuenta ya no tiene acceso. Contacta al administrador.' : expirationNotice);
      } else {
        setState({ session: null, status: 'error', error: errorMessage(error) });
      }
    }
  }, [clearSession, isCurrent, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    if (pendingRemoval.current) throw new AppError('storage', 'Primero vuelve a intentar el cierre de la sesión guardada.');
    const id = ++operation.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    currentSession.current = null;
    api.setToken(null);
    setState({ session: null, status: 'anonymous' });
    try {
      const candidate = await loginRequest(email, password, controller.signal);
      if (!isCurrent(id)) return;
      await saveSession(candidate);
      if (!isCurrent(id)) return;
      if (isSessionExpired(candidate)) {
        await clearSession(expirationNotice);
        throw new AppError('unauthorized', expirationNotice);
      }
      currentSession.current = candidate;
      api.setToken(candidate.token);
      setState({ session: candidate, status: 'authenticated' });
    } catch (error) {
      if (!isCurrent(id) || isCancelled(error)) return;
      api.setToken(null);
      currentSession.current = null;
      if (error instanceof AppError && error.kind === 'storage') {
        await clearSession(errorMessage(error));
      } else {
        setState({ session: null, status: 'anonymous', error: errorMessage(error) });
      }
      throw error;
    }
  }, [clearSession, isCurrent]);

  const logout = useCallback(async () => {
    // Capture the authenticated request before removing the in-memory token.
    if (currentSession.current) api.setToken(currentSession.current.token);
    const revocation = currentSession.current
      ? logoutRequest(currentSession.current).then(() => true, (error: unknown) => error instanceof AppError && error.status === 401)
      : Promise.resolve(true);
    await clearSession('Cerraste sesión en este dispositivo.');
    const id = operation.current;
    const revoked = await revocation;
    if (!revoked && isCurrent(id)) {
      setState((previous) => ({
        ...previous,
        notice: 'La sesión local se cerró. No se pudo confirmar el cierre en el servidor; la revocación quedó pendiente hasta que la sesión expire. Si lo necesitas, cierra tus sesiones desde la web.',
      }));
    }
  }, [clearSession, isCurrent]);

  const retry = useCallback(() => { void restore(); }, [restore]);

  const applyProfile = useCallback((profile: User, expectedToken: string) => {
    const active = currentSession.current;
    if (!mounted.current || !active || active.token !== expectedToken || active.usuario.id !== profile.id || profile.rol === 'unassigned') return false;
    // Identidad actual del servidor aparte de la instantánea firmada del login.
    // Mantener el token y su almacenamiento intactos evita invalidar su consistencia.
    setState(previous => previous.status === 'authenticated' && previous.session?.token === expectedToken ? { ...previous, profile } : previous);
    return true;
  }, []);

  useEffect(() => {
    mounted.current = true;
    api.setUnauthorizedHandler(() => { void clearSession(expirationNotice); });
    api.setRefreshHandler(refresh);
    void Promise.resolve().then(() => { if (mounted.current) void restore(); });
    return () => {
      mounted.current = false;
      // This counter identifies requests; it is not a DOM or component ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++operation.current;
      requestController.current?.abort();
      api.setToken(null);
      api.setUnauthorizedHandler(undefined);
      api.setRefreshHandler(undefined);
    };
  }, [clearSession, restore, refresh]);

  useEffect(() => {
    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const returnedToForeground = nextState === 'active' && previousState !== 'active';
      previousState = nextState;
      if (returnedToForeground && currentSession.current && !pendingRemoval.current) void restore();
    });
    return () => subscription.remove();
  }, [restore]);

  useEffect(() => {
    if (state.status !== 'authenticated' || !state.session) return;
    const session = state.session;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const remaining = session.expiresAt - Date.now();
      if (remaining <= 0) {
        if (currentSession.current?.token === session.token) {
          if (session.refreshToken) {
            void refresh(session.token).catch(error => {
              if (currentSession.current?.token === session.token && mounted.current) {
                setState({ session: null, status: 'error', error: errorMessage(error) });
              }
            });
          } else void clearSession(expirationNotice);
        }
      } else {
        timer = setTimeout(schedule, Math.min(remaining, 2_147_483_647));
      }
    };
    schedule();
    return () => clearTimeout(timer);
  }, [clearSession, refresh, state.session, state.status]);

  const value = useMemo(() => ({ ...state, login, logout, retry, applyProfile }), [state, login, logout, retry, applyProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
