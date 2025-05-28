export class WithConsole {
  private _debug = true;

  public setDebug(debug: boolean): void {
    this._debug = debug;
  }

  protected logger(message: unknown, type: 'info' | 'error' = 'info', ...additional: unknown[]): void {
    if (this._debug) {
      switch (type) {
        case 'info': {
          console.info(message, ...additional);
          break;
        }
        case 'error': {
          console.error(message, ...additional);
          break;
        }
        default: {
          console.info(message, ...additional);
          break;
        }
      }
    }
  }
}
