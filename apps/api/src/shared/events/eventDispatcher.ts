import { EventEmitter } from 'events';

class EventDispatcher extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners if needed
    this.setMaxListeners(20);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch(event: string, payload: any) {
    this.emit(event, payload);
  }
}

export const eventDispatcher = new EventDispatcher();
