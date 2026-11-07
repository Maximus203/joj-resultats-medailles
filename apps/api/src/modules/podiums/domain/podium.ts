import { podiumCountriesNotDistinct } from './podiums.errors';

export interface PodiumProps {
  id: string;
  eventName: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
  createdAt: Date;
}

export interface NewPodium {
  id: string;
  eventName: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
  now: Date;
}

/** Le podium d'une épreuve : trois pays différents, or, argent, bronze. */
export class Podium {
  private constructor(private readonly props: PodiumProps) {}

  static create({ now, ...input }: NewPodium): Podium {
    if (new Set([input.gold, input.silver, input.bronze]).size < 3) {
      throw podiumCountriesNotDistinct();
    }
    return new Podium({ ...input, createdAt: now });
  }

  /** Reconstruit un podium depuis la persistance, sans rejouer les règles. */
  static restore(props: PodiumProps): Podium {
    return new Podium({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get eventName(): string {
    return this.props.eventName;
  }
  get discipline(): string {
    return this.props.discipline;
  }
  get day(): string {
    return this.props.day;
  }
  get gold(): string {
    return this.props.gold;
  }
  get silver(): string {
    return this.props.silver;
  }
  get bronze(): string {
    return this.props.bronze;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
