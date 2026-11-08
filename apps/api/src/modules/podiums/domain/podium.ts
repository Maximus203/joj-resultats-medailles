import type { PodiumRevision } from './podium-revision';
import { podiumCountriesNotDistinct } from './podiums.errors';

export interface PodiumProps {
  id: string;
  eventName: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
  /** Le second bronze (judo, lutte…) ; `null` ou absent quand l'épreuve n'en décerne qu'un. */
  secondBronze?: string | null;
  createdAt: Date;
  /** La date de la dernière correction ; `null` tant que le podium n'a jamais été corrigé. */
  correctedAt: Date | null;
}

export interface NewPodium {
  id: string;
  eventName: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
  secondBronze?: string | null;
  now: Date;
}

/** Le podium d'une épreuve : trois pays différents, or, argent, bronze. */
export class Podium {
  private constructor(private readonly props: PodiumProps) {}

  static create({ now, ...input }: NewPodium): Podium {
    if (hasRepeatedCountry([input.gold, input.silver, input.bronze, input.secondBronze])) {
      throw podiumCountriesNotDistinct();
    }
    return new Podium({
      ...input,
      secondBronze: input.secondBronze ?? null,
      eventName: cleanName(input.eventName),
      discipline: input.discipline.trim(),
      createdAt: now,
      correctedAt: null,
    });
  }

  /** Reconstruit un podium depuis la persistance, sans rejouer les règles. */
  static restore(props: PodiumProps): Podium {
    return new Podium({ ...props });
  }

  /**
   * Corrige les trois pays. Rend le podium corrigé et la version remplacée ; une correction
   * identique à la version publiée ne change rien (`revision` vaut `null`).
   */
  correct(
    medals: { gold: string; silver: string; bronze: string },
    now: Date,
  ): { podium: Podium; revision: PodiumRevision | null } {
    if (hasRepeatedCountry([medals.gold, medals.silver, medals.bronze, this.secondBronze])) {
      throw podiumCountriesNotDistinct();
    }
    const unchanged =
      medals.gold === this.gold && medals.silver === this.silver && medals.bronze === this.bronze;
    if (unchanged) return { podium: this, revision: null };
    const revision = {
      gold: this.gold,
      silver: this.silver,
      bronze: this.bronze,
      correctedAt: now,
    };
    return { podium: new Podium({ ...this.props, ...medals, correctedAt: now }), revision };
  }

  get id(): string {
    return this.props.id;
  }
  get eventName(): string {
    return this.props.eventName;
  }
  /** Le nom en minuscules : deux écritures d'une même épreuve ont la même clé. */
  get eventKey(): string {
    return this.props.eventName.toLowerCase();
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
  get secondBronze(): string | null {
    return this.props.secondBronze ?? null;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get correctedAt(): Date | null {
    return this.props.correctedAt;
  }
}

/** Vrai si deux des pays donnés (les absents sont ignorés) sont le même. */
function hasRepeatedCountry(countries: (string | null | undefined)[]): boolean {
  const present = countries.filter((country) => country != null);
  return new Set(present).size < present.length;
}

/** Retire les espaces en trop, aux extrémités et entre les mots. */
function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
