type Listener<T> = (data: T) => void;

class EventEmitter<T> {
  private listeners: Listener<T>[] = [];

  on(listener: Listener<T>) {
    this.listeners.push(listener);
  }

  off(listener: Listener<T>) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  emit(data: T) {
    this.listeners.forEach(listener => listener(data));
  }
}

export const errorEmitter = new EventEmitter<any>();
