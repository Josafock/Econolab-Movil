/** Observer: framework-independent state with explicit subscribe/unsubscribe. */
export class ObservableState<T> {
  private readonly listeners = new Set<() => void>();
  constructor(private value: T) {}
  getSnapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  protected publish(value: T) {
    this.value = value;
    for (const listener of this.listeners) listener();
  }
}
