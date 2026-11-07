import type { PublishedPodium } from '@joj/shared';
import { Link } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { StateBanner } from '@/components/cachet/states';
import { formatDayFull } from '@/lib/dates';
import { useOnlineStatus } from '@/lib/use-online-status';
import { useCorrectPodium } from '../api/podiums';
import {
  type CountryField,
  type CountryValues,
  describeWriteError,
  type FieldErrors,
  type Refusal,
  validateCountries,
} from '../podium-messages';
import { CountryFields } from './country-fields';
import { PodiumCard } from './podium-card';
import { PodiumLines } from './podium-lines';

export function CorrectPodiumForm({ podium }: { podium: PublishedPodium }) {
  const original: CountryValues = {
    gold: podium.gold,
    silver: podium.silver,
    bronze: podium.bronze,
  };
  const [values, setValues] = useState<CountryValues>(original);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const online = useOnlineStatus();
  const correct = useCorrectPodium(podium.id);

  const unchanged =
    values.gold === original.gold &&
    values.silver === original.silver &&
    values.bronze === original.bronze;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const invalid = validateCountries(values);
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
    correct.mutate(values, {
      onError: (error) => {
        const described = describeWriteError(
          error,
          {
            ...values,
            eventName: podium.eventName,
            discipline: podium.discipline,
            day: podium.day,
          },
          'correct',
        );
        setRefusal(described);
        setErrors(described.fields);
      },
    });
  };

  const header = (
    <p className="chapo">
      {podium.eventName} · {podium.discipline} · {formatDayFull(podium.day)}
    </p>
  );

  if (correct.isSuccess) {
    return (
      <>
        {header}
        <StateBanner tone="ok" title="Correction publiée.">
          L’ancienne version est conservée et consultable : touchez le tampon « Corrigé » pour la
          voir.
          <p style={{ marginTop: 8 }}>
            <Link className="lien-action" to="/resultats" search={{ day: podium.day }}>
              Voir dans les résultats
            </Link>
          </p>
        </StateBanner>
        <section className="groupe" aria-labelledby="t-fin">
          <h2 id="t-fin" className="visuellement-cache">
            Podium corrigé
          </h2>
          <PodiumCard podium={correct.data} meta="full" />
        </section>
      </>
    );
  }

  return (
    <>
      {header}
      <StateBanner tone="alerte" title="Ce podium est déjà public.">
        La correction remplace l’affichage actuel. L’ancienne version reste consultable, avec la
        date de correction.
      </StateBanner>
      {refusal ? (
        <StateBanner tone="erreur" title={refusal.title}>
          {refusal.detail}
        </StateBanner>
      ) : null}
      <form className="formulaire" noValidate onSubmit={submit} aria-busy={correct.isPending}>
        <div className="col-saisie">
          <p className="micro">
            L’épreuve, la discipline et le jour ne changent pas. Seuls les trois pays se corrigent.
          </p>
          <CountryFields
            values={values}
            errors={errors}
            originals={original}
            onChange={(field: CountryField, value) => {
              setValues((current) => ({ ...current, [field]: value }));
              setErrors((current) => ({ ...current, [field]: undefined }));
            }}
          />
        </div>
        <div className="col-aside">
          <section className="recents publie" aria-labelledby="t-pub">
            <h2 id="t-pub">Podium publié actuellement</h2>
            <article className="timbre">
              <div className="timbre-tete">
                <div>
                  <h3>{podium.eventName}</h3>
                  <p className="meta">
                    {podium.discipline} · {formatDayFull(podium.day)}
                  </p>
                </div>
              </div>
              <PodiumLines gold={podium.gold} silver={podium.silver} bronze={podium.bronze} />
            </article>
            <p className="aide">
              Après la correction, cette version reste consultable avec sa date.
            </p>
          </section>
        </div>
        <div className="actions">
          <button
            className="bouton bouton-plein"
            type="submit"
            disabled={unchanged || correct.isPending || !online}
          >
            {correct.isPending
              ? 'Publication en cours…'
              : !online
                ? 'Publier (connexion requise)'
                : unchanged
                  ? 'Aucun changement à publier'
                  : 'Publier la correction'}
          </button>
          <Link
            className="bouton bouton-secondaire bouton-plein"
            to="/resultats"
            search={{ day: podium.day }}
          >
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}
