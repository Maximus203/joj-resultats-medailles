/* Aides de maquette uniquement : jeu d'icones "Cachet" (dessine pour le projet,
   trait 2, bouts carres) et bascule des etats par l'ancre (#conflit, #vide...).
   Rien de ce fichier n'est du code de production. */
(function () {
  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    '<symbol id="i-logo" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="11" y="13" width="10" height="14" fill="currentColor"/><rect x="3.5" y="18" width="7" height="9" fill="none" stroke="currentColor" stroke-width="2"/><rect x="21.5" y="21" width="7" height="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="8" r="2.5" fill="currentColor"/></symbol>' +
    '<symbol id="i-medailles" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><path d="M7 2h4l1 5M17 2h-4l-1 5"/><circle cx="12" cy="15" r="6"/><path d="M12 12v6M10 13l2-1"/></symbol>' +
    '<symbol id="i-jour" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 2v5M16 2v5M7 14h3M14 14h3M7 18h3"/></symbol>' +
    '<symbol id="i-saisie" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><path d="M4 20h16M5 16l9-9 3 3-9 9H5z"/><path d="M13 8l3 3"/></symbol>' +
    '<symbol id="i-alerte" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></symbol>' +
    '<symbol id="i-erreur" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path d="M9 9l6 6M15 9l-6 6"/></symbol>' +
    '<symbol id="i-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><rect x="3" y="3" width="18" height="18"/><path d="M7 12l4 4 6-8"/></symbol>' +
    '<symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></symbol>' +
    '<symbol id="i-horsligne" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><path d="M3 9a14 14 0 0 1 8-3M21 9a14 14 0 0 0-3-2M6 13a9 9 0 0 1 4-2M18 13a9 9 0 0 0-2-1.5M10 17a4 4 0 0 1 4 0"/><path d="M12 20v.5M3 3l18 18"/></symbol>' +
    '<symbol id="i-historique" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/><path d="M12 8v5l3 2"/></symbol>' +
    '<symbol id="i-ia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/></symbol>' +
    '<symbol id="i-fleche" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></symbol>' +
    '<symbol id="i-ardoise" viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="miter"><rect x="44" y="30" width="32" height="42"/><rect x="8" y="46" width="32" height="26"/><rect x="80" y="54" width="32" height="18"/><path d="M2 72h116"/><circle cx="60" cy="16" r="7"/><path d="M56 51h8M60 47v8" stroke-dasharray="2 3"/></symbol>' +
    '</svg>';
  document.body.insertAdjacentHTML('afterbegin', SPRITE);
  var q = new URLSearchParams(location.search).get('theme');
  if (q === 'dark' || q === 'light') document.documentElement.setAttribute('data-theme', q);

  function ic(id, cls) {
    return (
      '<svg class="' +
      (cls || '') +
      '" aria-hidden="true" focusable="false"><use href="#' +
      id +
      '"/></svg>'
    );
  }
  document.querySelectorAll('[data-ic]').forEach(function (el) {
    el.insertAdjacentHTML('afterbegin', ic(el.getAttribute('data-ic')));
  });

  function appliquer() {
    var etat =
      (location.hash || '').replace('#', '') || document.body.getAttribute('data-defaut') || '';
    document.body.setAttribute('data-etat', etat);
    document.querySelectorAll('[data-etats]').forEach(function (el) {
      var liste = el.getAttribute('data-etats').split(' ');
      el.hidden = liste.indexOf(etat) === -1;
    });
    document.querySelectorAll('[data-sauf]').forEach(function (el) {
      var liste = el.getAttribute('data-sauf').split(' ');
      el.hidden = liste.indexOf(etat) !== -1;
    });
    document.querySelectorAll('.maquette-barre a').forEach(function (a) {
      a.classList.toggle('actif', a.getAttribute('href') === '#' + etat);
    });
    document.querySelectorAll('input[data-pour]').forEach(function () {});
  }
  window.addEventListener('hashchange', appliquer);
  appliquer();
})();
