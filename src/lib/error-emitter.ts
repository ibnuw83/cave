type Listener<T> = (data: T) => void;

class EventEmitter<T> {
  private listeners: Set<Listener<T>> = new Set();

  on(listener: Listener<T>) {
    this.listeners.add(listener);
  }

  off(listener: Listener<T>) {
    this.listeners.delete(listener);
  }

  emit(data: T) {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(data);
      }
    });
  }
}

export const errorEmitter = new EventEmitter<any>();
