(function () {
  try {
    var preference = localStorage.getItem("celestial-atlas-theme") || "system";
    var resolved = preference;
    if (preference === "system") {
      resolved = matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    }
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = resolved;

    var locale = localStorage.getItem("celestial-atlas-locale") || "en-GB";
    if (locale === "en-GB") {
      document.documentElement.lang = locale;
      document.documentElement.dir = "ltr";
    }
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
