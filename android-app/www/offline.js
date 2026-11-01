(function () {
  "use strict";
  var copy = {
    en: {
      title: "Celestial Atlas needs a connection",
      body: "Check your Wi-Fi or mobile data, then try again. Your chart and readings are waiting.",
      retry: "Retry",
      lang: "en-GB",
    },
    es: {
      title: "Celestial Atlas necesita conexión",
      body: "Comprueba tu wifi o tus datos móviles y vuelve a intentarlo. Tu carta y tus lecturas te esperan.",
      retry: "Reintentar",
      lang: "es-ES",
    },
    fr: {
      title: "Celestial Atlas a besoin d’une connexion",
      body: "Vérifiez votre Wi-Fi ou vos données mobiles, puis réessayez. Votre thème et vos lectures vous attendent.",
      retry: "Réessayer",
      lang: "fr-FR",
    },
    de: {
      title: "Celestial Atlas braucht eine Verbindung",
      body: "Prüfe dein WLAN oder deine mobilen Daten und versuche es erneut. Dein Horoskop und deine Deutungen warten auf dich.",
      retry: "Erneut versuchen",
      lang: "de-DE",
    },
  };
  var language = String(
    (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      "en",
  )
    .slice(0, 2)
    .toLowerCase();
  var text = copy[language] || copy.en;
  document.documentElement.lang = text.lang;
  document.getElementById("title").textContent = text.title;
  document.getElementById("body").textContent = text.body;
  var retry = document.getElementById("retry");
  retry.textContent = text.retry;

  var origin =
    window.CELESTIAL_ATLAS_ORIGIN || "https://www.celestialatlas.app";
  function go() {
    retry.disabled = true;
    window.location.replace(origin + "/");
  }
  retry.addEventListener("click", go);
  window.addEventListener("online", go);
})();
