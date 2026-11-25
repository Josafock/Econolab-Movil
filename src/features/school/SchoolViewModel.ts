import { ObservableState } from '@/core/observable';
import { errorMessage, isCancelled } from '@/core/errors';
import { HttpSchoolRepository } from './HttpSchoolRepository';
import { ManageWorkspace } from './ManageWorkspace';
import type { SchoolRepository } from './SchoolRepository';
import type { Cut, NewActivity, NewItem, Workspace } from './models';
type State = { workspace: Workspace | null; busy: boolean; failure?: string; success?: string; cut?: Cut };
export class SchoolViewModel extends ObservableState<State> {
  private controller?: AbortController;
  private revision = 0;
  constructor(private readonly useCase: ManageWorkspace) { super({ workspace: null, busy: false }); }
  private async run(operation: (signal: AbortSignal) => Promise<Workspace>, success?: string) {
    if (this.getSnapshot().busy) return false;
    this.controller?.abort();
    const controller = this.controller = new AbortController();
    const revision = ++this.revision;
    this.publish({ ...this.getSnapshot(), busy: true, failure: undefined, success: undefined });
    try {
      const workspace = await operation(controller.signal);
      if (revision !== this.revision || controller.signal.aborted) return false;
      this.publish({ workspace, busy: false, success });
      return true;
    } catch (error) {
      if (revision === this.revision && !controller.signal.aborted && !isCancelled(error)) this.publish({ ...this.getSnapshot(), busy: false, failure: errorMessage(error) });
      return false;
    }
  }
  load() { return this.run(signal => this.useCase.load(signal)); }
  addItem(values: NewItem) { return this.run(signal => this.useCase.addItem(values, signal), 'Servicio de práctica guardado.'); }
  setActive(id: number, active: boolean) { return this.run(signal => this.useCase.setActive(id, active, signal)); }
  addActivity(values: NewActivity) { return this.run(signal => this.useCase.addActivity(values, signal), 'Actividad registrada.'); }
  cancel(id: number) { return this.run(signal => this.useCase.cancel(id, signal), 'Actividad cancelada.'); }
  reset() { return this.run(signal => this.useCase.reset(signal), 'Espacio de práctica reiniciado.'); }
  async searchCut(from: string, to: string) {
    if (this.getSnapshot().busy) return;
    this.controller?.abort();
    const controller = this.controller = new AbortController();
    const revision = ++this.revision;
    this.publish({ ...this.getSnapshot(), busy: true, failure: undefined, success: undefined, cut: undefined });
    try {
      const cut = await this.useCase.cut(from, to, controller.signal);
      if (revision === this.revision && !controller.signal.aborted) this.publish({ ...this.getSnapshot(), cut, busy: false });
    } catch (error) {
      if (revision === this.revision && !controller.signal.aborted && !isCancelled(error)) this.publish({ ...this.getSnapshot(), busy: false, failure: errorMessage(error) });
    }
  }
  dispose() { this.revision++; this.controller?.abort(); this.publish({ ...this.getSnapshot(), busy: false }); }
}
export function createSchoolViewModel(repository: SchoolRepository = new HttpSchoolRepository()) {
  return new SchoolViewModel(new ManageWorkspace(repository));
}
