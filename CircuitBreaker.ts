import fetch from "node-fetch";

enum State {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

/**
 *
 * Circuitbreaker class
 *
 */
export class CircuitBreaker {
  #state: State;

  #failureCount: number;
  #timeWindow: number;

  #failureThreshold: number;
  // when half open, state may go to open or closed depending on percentage of failures or successes
  #halfOpenMap = { failures: 0, successes: 0 };

  constructor(errorThreshold?: number, timeWindow?: number) {
    this.#state = State.CLOSED;

    this.#failureCount = 0;

    this.#failureThreshold = errorThreshold || 3;
    this.#timeWindow = (timeWindow ? timeWindow : 3) * 1000;
  }

  private log(): void {
    console.table({
      State: this.#state,
      Failures: this.#failureCount,
      HalfOpenMapFailures: this.#halfOpenMap.failures,
      HalfOpenMapSuccesses: this.#halfOpenMap.successes,
      Timestamp: Date.now(),
    });
  }

  private record_success(res: any): any {
    if (this.#state === State.HALF_OPEN) {
      this.#halfOpenMap.successes += 1;
      const { successes, failures } = this.#halfOpenMap;
      const total = successes + failures;
      // once success is more than 50%, return to normal needs at least two
      if (successes / total > 0.5 && total > 1) {
        this.changeState(State.CLOSED);
      }
    } else {
      this.#failureCount = 0;
    }

    this.log();
    return res;
  }

  private record_failure(res: any): any {
    if (this.#state === State.HALF_OPEN) {
      this.#halfOpenMap.failures += 1;
      const { successes, failures } = this.#halfOpenMap;
      const total = successes + failures;
      // if failures are more than 50%, go back to open state needs at least two
      if (failures / total > 0.5 && total > 1) {
        this.changeState(State.OPEN);
      }
    } else {
      this.#failureCount += 1;
    }

    if (this.#failureCount >= this.#failureThreshold) {
      this.changeState(State.OPEN);
    }

    this.log();
    return res;
  }

  private changeState(state: State) {
    this.#state = state;
    this.#failureCount = 0;
    this.#halfOpenMap.failures = 0;
    this.#halfOpenMap.successes = 0;
    if (state === State.OPEN) this.#timeWindow = Date.now() + this.#timeWindow;
    return;
  }

  /**
   * makes a call
   * @param url
   * @param result optional string options are "success" and "failure"
   * @returns
   */
  public async do_call(url: string, result?: string): Promise<any> {
    if (this.#state === State.OPEN) {
      if (this.#timeWindow <= Date.now()) {
        this.#state = State.HALF_OPEN;
      } else {
        throw new Error("CircuitOpenError");
      }
    }

    try {
      const response = await fetch(url);

      if (response.status === 200 || result == "success") {
        return this.record_success(response.text());
      } else if (response.status != 200 || result == "failure") {
        return this.record_failure(response.text());
      }
    } catch (err) {
      return this.record_failure(err);
    }
  }
}
