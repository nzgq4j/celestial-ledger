(function () {
  try {
    localStorage.removeItem("celestial-atlas-theme");
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";

    var supported = ["en-GB", "es-ES", "fr-FR", "de-DE"];
    var locale = localStorage.getItem("celestial-atlas-locale");
    if (!supported.includes(locale)) {
      var browserLanguages = navigator.languages || [navigator.language];
      locale =
        browserLanguages
          .map(function (value) {
            var language = String(value || "").toLowerCase();
            if (language.startsWith("es")) return "es-ES";
            if (language.startsWith("fr")) return "fr-FR";
            if (language.startsWith("de")) return "de-DE";
            if (language.startsWith("en")) return "en-GB";
            return null;
          })
          .find(Boolean) || "en-GB";
      localStorage.setItem("celestial-atlas-locale", locale);
    }
    if (supported.includes(locale)) {
      document.documentElement.lang = locale;
      document.documentElement.dir = "ltr";
      document.cookie =
        "celestial-atlas-locale=" +
        encodeURIComponent(locale) +
        "; Path=/; Max-Age=31536000; SameSite=Lax";
    }
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
