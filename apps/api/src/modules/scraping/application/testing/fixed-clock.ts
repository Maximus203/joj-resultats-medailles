import { Clock } from '../clock';

/** Horloge qu'un test déplace à la main. */
export class FixedClock extends Clock {
  constructor(private current: Date) {
    super();
  }

  now(): Date {
    return this.current;
  }

  set(instant: Date | string): void {
    this.current = new Date(instant);
  }
}
