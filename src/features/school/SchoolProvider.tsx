import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type PropsWithChildren } from 'react';
import { createSchoolViewModel, type SchoolViewModel } from './SchoolViewModel';
import type { SchoolRepository } from './SchoolRepository';
const Context = createContext<SchoolViewModel | null>(null);
export function SchoolProvider({ children, repository }: PropsWithChildren<{ repository?: SchoolRepository }>) {
  const vm = useMemo(() => createSchoolViewModel(repository), [repository]);
  useEffect(() => { void vm.load(); return () => vm.dispose(); }, [vm]);
  return <Context.Provider value={vm}>{children}</Context.Provider>;
}
export function useSchool() {
  const vm = useContext(Context);
  if (!vm) throw new Error('Falta el proveedor del espacio de práctica.');
  const state = useSyncExternalStore(vm.subscribe, vm.getSnapshot, vm.getSnapshot);
  return { vm, ...state };
}
