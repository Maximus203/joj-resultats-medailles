import { Link } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { CountryPlate } from '@/components/cachet/medal';
import { StateBanner } from '@/components/cachet/states';
import { defaultDay, formatDayMonth, GAMES_FIRST_DAY, GAMES_LAST_DAY } from '@/lib/dates';
import { useOnlineStatus } from '@/lib/use-online-status';
import { usePodiums, useRecordPodium } from '../api/podiums';
import {
  type CountryField,
  describeWriteError,
  type FieldErrors,
  type RecordValues,
  type Refusal,
  validateRecord,
} from '../podium-messages';
import { CountryFields, FieldError } from './country-fields';
import { PodiumCard } from './podium-card';
import { PodiumPreview } from './podium-preview';

const DEFAULT_DISCIPLINES = ['Athlétisme', 'Lutte', 'Natation'];
const normalize = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
const isIsoDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day);

const DRAFT_KEY = 'joj.brouillon-podium';

/** Le brouillon survit à un rafraîchissement ou à un retour arrière ; il ne sort jamais de l'onglet. */
function readDraft(): RecordValues | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: unknown = JSON.parse(raw);
    if (typeof draft !== 'object' || draft === null) return null;
    const read = (key: keyof RecordValues): string => {
      const value: unknown = Reflect.get(draft, key);
      return typeof value === 'string' ? value : '';
    };
    return {
      eventName: read('eventName'),
      discipline: read('discipline'),
      day: read('day') || defaultDay(),
      gold: read('gold'),
      silver: read('silver'),
      bronze: read('bronze'),
    };
  } catch {
    return null;
  }
}

function writeDraft(values: RecordValues | null): void {
  try {
    if (values === null) window.sessionStorage.removeItem(DRAFT_KEY);
    else window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la saisie reste en mémoire seulement.
  }
}

const emptyValues = (): RecordValues => ({
  eventName: '',
  discipline: '',
  day: defaultDay(),
  gold: '',
  silver: '',
  bronze: '',
});

export function RecordPodiumForm() {
  const [values, setValues] = useState<RecordValues>(() => readDraft() ?? emptyValues());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const online = useOnlineStatus();
  const record = useRecordPodium();
  const podiums = usePodiums();

  const set = (field: keyof RecordValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      writeDraft(next);
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const invalid = validateRecord(values);
    const count = Object.keys(invalid).length;
    if (count > 0) {
      setErrors(invalid);
      setRefusal({
        title: count === 1 ? '1 champ à corriger.' : `${count} champs à corriger.`,
        detail: Object.values(invalid).join(' '),
        fields: invalid,
      });
      return;
    }
    setRefusal(null);
    setErrors({});
    record.mutate(
      {
        eventName: values.eventName,
        discipline: values.discipline,
        day: values.day,
        gold: values.gold,
        silver: values.silver,
        bronze: values.bronze,
      },
      {
        onSuccess: () => writeDraft(null),
        onError: (error) => {
          const described = describeWriteError(error, values, 'record');
          setRefusal(described);
          setErrors(described.fields);
        },
      },
    );
  };

  if (record.isSuccess) {
    const saved = record.data;
    return (
      <>
        <StateBanner tone="ok" title="Podium enregistré.">
          Relisez-le : c’est ce que le public voit.
        </StateBanner>
        <section
          aria-labelledby="t-lu"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}
        >
          <h2 id="t-lu" className="visuellement-cache">
            Podium enregistré
          </h2>
          <PodiumCard podium={{ ...saved, correctedAt: null }} meta="full" />
          <div className="actions">
            <button
              type="button"
              className="bouton bouton-plein"
              onClick={() => {
                record.reset();
                setValues(emptyValues());
              }}
            >
              Enregistrer un autre podium
            </button>
            <Link
              className="bouton bouton-secondaire bouton-plein"
              to="/resultats"
              search={{ day: saved.day }}
            >
              Voir les résultats du {formatDayMonth(saved.day)}
            </Link>
          </div>
        </section>
      </>
    );
  }

  const known = podiums.data ?? [];
  const sameDay = known.filter((podium) => podium.day === values.day);
  const disciplines = [...new Set([...DEFAULT_DISCIPLINES, ...known.map((p) => p.discipline)])];
  const conflicting =
    refusal && errors.eventName
      ? known.find((podium) => normalize(podium.eventName) === normalize(values.eventName))
      : undefined;
  const nameDescribed = ['nom-aide', errors.eventName ? 'nom-err' : null].filter(Boolean).join(' ');

  return (
    <>
      {refusal ? (
        <StateBanner tone="erreur" title={refusal.title}>
          {refusal.detail}
          {conflicting ? (
            <p style={{ marginTop: 8, display: 'flex', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
              <Link className="lien-action" to="/resultats" search={{ day: conflicting.day }}>
                Voir le podium enregistré
              </Link>
              <Link
                className="lien-action"
                to="/journaliste/corriger/$podiumId"
                params={{ podiumId: conflicting.id }}
              >
                Corriger ce podium
              </Link>
            </p>
          ) : null}
        </StateBanner>
      ) : null}
      <form className="formulaire" noValidate onSubmit={submit} aria-busy={record.isPending}>
        <div className="col-saisie">
          <div className="champ">
            <label htmlFor="nom">Épreuve</label>
            <input
              className="saisie"
              id="nom"
              name="eventName"
              autoComplete="off"
              maxLength={100}
              value={values.eventName}
              aria-invalid={errors.eventName ? true : undefined}
              aria-describedby={nameDescribed}
              onChange={(event) => set('eventName', event.target.value)}
            />
            <span className="aide" id="nom-aide">
              Le nom officiel, par exemple « Lutte filles 52 kg ».
            </span>
            {errors.eventName ? <FieldError id="nom-err">{errors.eventName}</FieldError> : null}
          </div>
          <div className="champ">
            <label htmlFor="disc">Discipline</label>
            <input
              className="saisie"
              id="disc"
              name="discipline"
              autoComplete="off"
              list="disciplines"
              maxLength={100}
              value={values.discipline}
              aria-invalid={errors.discipline ? true : undefined}
              aria-describedby={errors.discipline ? 'disc-err' : undefined}
              onChange={(event) => set('discipline', event.target.value)}
            />
            <datalist id="disciplines">
              {disciplines.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {errors.discipline ? <FieldError id="disc-err">{errors.discipline}</FieldError> : null}
          </div>
          <div className="champ">
            <label htmlFor="jour">Jour</label>
            <input
              className="saisie"
              id="jour"
              name="day"
              type="date"
              min={GAMES_FIRST_DAY}
              max={GAMES_LAST_DAY}
              value={values.day}
              aria-invalid={errors.day ? true : undefined}
              aria-describedby={['jour-aide', errors.day ? 'jour-err' : null]
                .filter(Boolean)
                .join(' ')}
              onChange={(event) => set('day', event.target.value)}
            />
            <span className="aide" id="jour-aide">
              Les Jeux se déroulent du 31 octobre au 13 novembre.
            </span>
            {errors.day ? <FieldError id="jour-err">{errors.day}</FieldError> : null}
          </div>
          <CountryFields
            values={values}
            errors={errors}
            onChange={(field: CountryField, value) => set(field, value)}
          />
        </div>
        <div className="col-aside">
          <section aria-labelledby="t-apercu" className="groupe apercu">
            <h2 id="t-apercu" style={{ fontSize: 'var(--t-lg)' }}>
              Aperçu avant enregistrement
            </h2>
            <PodiumPreview {...values} />
          </section>
          <section className="recents" aria-labelledby="t-rec">
            <h2 id="t-rec">
              {isIsoDay(values.day)
                ? `Déjà enregistrés le ${formatDayMonth(values.day)}`
                : 'Déjà enregistrés'}
            </h2>
            <p className="aide">
              Vérifiez que l’épreuve n’y figure pas déjà : une épreuve n’a qu’un seul podium.
            </p>
            {sameDay.length === 0 ? (
              <p className="aide">Aucun podium enregistré ce jour.</p>
            ) : (
              <ul className="liste-compacte">
                {sameDay.map((podium) => (
                  <li key={podium.id}>
                    <Link to="/journaliste/corriger/$podiumId" params={{ podiumId: podium.id }}>
                      {podium.eventName}
                      <span className="visuellement-cache"> : corriger</span>
                    </Link>
                    <span>
                      <CountryPlate code={podium.gold} />
                      <CountryPlate code={podium.silver} />
                      <CountryPlate code={podium.bronze} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="actions">
          <button
            className="bouton bouton-plein"
            type="submit"
            disabled={record.isPending || !online}
          >
            {record.isPending
              ? 'Enregistrement en cours…'
              : online
                ? 'Enregistrer le podium'
                : 'Enregistrer (connexion requise)'}
          </button>
          <p className="micro">
            Une fois enregistré, le podium est public. Une erreur se corrige ensuite : l’ancienne
            version reste consultable.
          </p>
        </div>
      </form>
    </>
  );
}
