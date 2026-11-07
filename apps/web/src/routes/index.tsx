import type { PublishedPodium } from '@joj/shared';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BrandBand } from '@/components/cachet/brand-band';
import { CountryPlate } from '@/components/cachet/medal';
import { EmptyState, LoadError, Skeletons } from '@/components/cachet/states';
import { useMedals } from '@/features/medals/api/medals';
import { compactRows, MedalTable } from '@/features/medals/components/medal-table';
import { usePodiums } from '@/features/podiums/api/podiums';
import { PodiumCard } from '@/features/podiums/components/podium-card';
import { StaticStamp } from '@/features/podiums/components/history-sheet';
import { DayStrip } from '@/features/podiums/components/day-strip';
import { defaultDay, formatDay, formatDayMonth, formatTime, GAMES_DAYS } from '@/lib/dates';
import { describeLoadError } from '@/lib/error-messages';
import { useMyCountry } from '@/lib/use-my-country';

const TILE_TONES = ['t-rouge', 't-ardoise', 't-jaune', 't-vert'];
const MAX_TILES = 5;
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

/** Le dernier podium enregistré : trois marches, médaille et pays. */
function LastPodium({ podium }: { podium: PublishedPodium }) {
  const steps = [
    { className: 'm2', code: podium.silver, rank: '2', word: 'Argent' },
    { className: 'm1', code: podium.gold, rank: '1', word: 'Or' },
    { className: 'm3', code: podium.bronze, rank: '3', word: 'Bronze' },
  ];
  return (
    <figure className="carte-podium timbre">
      <div className="etiquette">
        <span>Dernier podium enregistré</span>
        <span>{formatTime(podium.createdAt)}</span>
      </div>
      <div
        className="marches"
        role="group"
        aria-label={`Or ${podium.gold}, argent ${podium.silver}, bronze ${podium.bronze}`}
      >
        {steps.map((step) => (
          <div className={`marche ${step.className}`} key={step.className}>
            <CountryPlate code={step.code} />
            <div className="bloc">
              <b>{step.rank}</b>
              <small>{step.word}</small>
            </div>
          </div>
        ))}
      </div>
      <figcaption>
        <b>{podium.eventName}</b>
        <span>
          {podium.discipline} · {formatDay(podium.day)}
        </span>
        {podium.correctedAt ? <StaticStamp correctedAt={podium.correctedAt} /> : null}
      </figcaption>
    </figure>
  );
}

function Home() {
  const day = defaultDay();
  const all = usePodiums();
  const today = usePodiums(day);
  const medals = useMedals();
  const [myCountry] = useMyCountry();

  const everything = all.data ?? [];
  const todays = today.data ?? [];
  const disciplines = [...new Set(everything.map((podium) => podium.discipline))];
  const todayCount = (discipline: string) =>
    todays.filter((podium) => podium.discipline === discipline).length;
  const daysWithPodiums = new Set(everything.map((podium) => podium.day));
  const index = GAMES_DAYS.indexOf(day);
  const strip = GAMES_DAYS.slice(Math.max(0, index - 2), Math.max(0, index - 2) + 5);
  const last = everything[0];

  return (
    <>
      <BrandBand variant="rouge">
        <div className="hero-grid">
          <div className="hero-texte">
            <span className="surtitre">Dakar 2026 · du 31 octobre au 13 novembre</span>
            <div className="hero-titre">
              <h1>
                Qui a gagné <em>aujourd’hui</em> ?
              </h1>
              {/* Mascotte officielle, droits CIO/COJOJ : usage autorisé par Cherif, à retirer si le titulaire s'y oppose. */}
              <img
                className="mascotte"
                src="/assets/mascotte-ayo.png"
                alt="Ayo, mascotte des JOJ Dakar 2026"
                width={96}
                height={219}
              />
            </div>
            <p className="sous">
              Les podiums des Jeux, épreuve par épreuve, et le tableau des médailles de votre pays.
            </p>
            <div className="cta-ligne">
              <Link className="bouton bouton-noir" to="/resultats">
                Résultats du jour
              </Link>
              <Link className="bouton bouton-blanc" to="/medailles">
                Tableau des médailles
              </Link>
            </div>
            <dl className="chiffres">
              <div>
                <dd>{GAMES_DAYS.length}</dd>
                <dt>jours de Jeux</dt>
              </div>
              <div>
                <dd>{all.data ? disciplines.length : '–'}</dd>
                <dt>disciplines</dt>
              </div>
              <div>
                <dd>{today.data ? todays.length : '–'}</dd>
                <dt>podiums du jour</dt>
              </div>
            </dl>
          </div>
          {all.isPending ? (
            <div
              className="carte-podium timbre"
              role="status"
              aria-label="Chargement du dernier podium"
            >
              <div className="squelette" style={{ minHeight: '1.5rem', width: '60%' }} />
              <div className="squelette" style={{ minHeight: '9rem' }} />
              <div className="squelette" style={{ minHeight: '2rem', width: '40%' }} />
            </div>
          ) : all.isError && !all.data ? (
            <div style={{ background: 'var(--erreur-doux)' }}>
              <LoadError
                title="Le dernier podium n’a pas pu être chargé."
                detail={describeLoadError(all.error)}
                onRetry={() => void all.refetch()}
              />
            </div>
          ) : last ? (
            <LastPodium podium={last} />
          ) : (
            <div className="carte-podium timbre">
              <div className="etiquette">
                <span>Dernier podium enregistré</span>
              </div>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>Pas encore de podium</h2>
              <p className="meta">
                Les Jeux commencent le 31 octobre. Les podiums apparaissent ici dès qu’un
                journaliste en enregistre un.
              </p>
            </div>
          )}
        </div>
      </BrandBand>

      <main className="sections" id="contenu" tabIndex={-1}>
        <section aria-labelledby="t-disc">
          <div className="titre-section">
            <h2 id="t-disc">Par discipline</h2>
            <Link to="/resultats">Toutes les disciplines</Link>
          </div>
          {all.isPending ? (
            <ul className="tuiles" role="status" aria-label="Chargement des disciplines">
              {[0, 1, 2, 3].map((key) => (
                <li key={key}>
                  <div className="squelette" style={{ minHeight: '8rem' }} />
                </li>
              ))}
            </ul>
          ) : disciplines.length === 0 ? (
            <EmptyState
              title="Les disciplines apparaissent avec les premiers podiums"
              headingLevel={3}
            >
              <p>Chaque discipline s’ouvre dès qu’un de ses podiums est enregistré.</p>
            </EmptyState>
          ) : (
            <ul className="tuiles">
              {disciplines.slice(0, MAX_TILES).map((discipline, tileIndex) => {
                const count = todayCount(discipline);
                return (
                  <li key={discipline}>
                    <Link
                      className={`tuile ${count > 0 ? (TILE_TONES[tileIndex % TILE_TONES.length] ?? '') : 't-vide'}`}
                      to="/resultats"
                      search={{ day, discipline }}
                    >
                      <strong>{discipline}</strong>
                      <span>
                        {count > 0
                          ? `${plural(count, 'épreuve')} aujourd’hui`
                          : 'Aucun podium aujourd’hui'}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link className="tuile t-noir" to="/resultats">
                  <strong>Toutes · {plural(disciplines.length, 'discipline')}</strong>
                  <span>Choisir une discipline</span>
                </Link>
              </li>
            </ul>
          )}
        </section>

        <div className="corps">
          <section aria-labelledby="t-res">
            <div className="titre-section">
              <h2 id="t-res">Résultats du jour</h2>
              <Link to="/resultats" search={{ day }}>
                Voir les résultats du {formatDayMonth(day)}
              </Link>
            </div>
            <DayStrip
              days={strip}
              selected={day}
              daysWithPodiums={daysWithPodiums}
              style={{ marginBottom: 'var(--s-4)' }}
            />
            {today.isPending ? (
              <Skeletons
                label="Chargement des résultats"
                heights={['11rem', '11rem']}
                gap="var(--s-3)"
              />
            ) : today.isError && !today.data ? (
              <LoadError
                title="Les résultats n’ont pas pu être chargés."
                detail={describeLoadError(today.error)}
                onRetry={() => void today.refetch()}
              />
            ) : todays.length === 0 ? (
              <EmptyState title="Aucun podium enregistré ce jour" headingLevel={3}>
                <p>Les résultats apparaissent dès qu’un podium est enregistré.</p>
              </EmptyState>
            ) : (
              <ul className="cartes-jour">
                {todays.map((podium) => (
                  <li key={podium.id}>
                    <PodiumCard podium={podium} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="t-med">
            <div className="titre-section">
              <h2 id="t-med">Médailles</h2>
              <Link to="/medailles">Tableau complet</Link>
            </div>
            {medals.isPending ? (
              <Skeletons
                label="Chargement du tableau"
                heights={['3.5rem', '3.5rem', '3.5rem', '3.5rem']}
              />
            ) : medals.isError && !medals.data ? (
              <LoadError
                title="Le tableau n’a pas pu être chargé."
                detail={describeLoadError(medals.error)}
                onRetry={() => void medals.refetch()}
              />
            ) : medals.data.length === 0 ? (
              <EmptyState title="Aucune médaille pour l’instant" headingLevel={3}>
                <p>Le tableau se remplit dès le premier podium enregistré.</p>
              </EmptyState>
            ) : (
              <>
                <MedalTable
                  rows={compactRows(medals.data, myCountry)}
                  caption="Cinq premiers pays et Mon pays"
                  myCountry={myCountry}
                  compact
                />
                <p className="lecture-seule">
                  Tableau calculé à partir des podiums enregistrés dans cette application. Il peut
                  différer du tableau publié sur le site officiel des Jeux.
                </p>
              </>
            )}
          </section>
        </div>

        <section className="bande-pro" aria-labelledby="t-pro">
          <div>
            <h2 id="t-pro">Vous enregistrez les podiums ?</h2>
            <p>
              L’espace journaliste sert à enregistrer un podium et à corriger une erreur, avec
              trace.
            </p>
          </div>
          <Link className="bouton bouton-blanc" to="/journaliste">
            Espace journaliste
          </Link>
        </section>
      </main>

      <footer className="pied">
        <div>
          <b>JOJ Dakar 2026 · résultats et médailles</b>
          <p>
            Application non officielle. Le tableau des médailles est informatif. Site officiel des
            Jeux :{' '}
            <a className="lien-action" href="https://www.olympics.com/en/dakar-2026">
              olympics.com/en/dakar-2026
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  );
}

export const Route = createFileRoute('/')({ component: Home });
