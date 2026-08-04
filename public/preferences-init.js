(function () {
  try {
    localStorage.removeItem("celestial-atlas-theme");
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";

    var locale = localStorage.getItem("celestial-atlas-locale") || "en-GB";
    if (["en-GB", "es-ES", "fr-FR", "de-DE"].includes(locale)) {
      document.documentElement.lang = locale;
      document.documentElement.dir = "ltr";
    }
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
