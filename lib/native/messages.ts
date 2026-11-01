import { isLocaleTag, type LocaleTag } from "@/lib/i18n/config";

/**
 * Reader-facing copy for the Android app's native features (push pre-prompt,
 * morning alert setting, Google Play Billing). Kept beside the native code so
 * the shared locale packs stay untouched; all four locales are required by
 * the type.
 */
export type NativeMessages = {
  push: {
    promptTitle: string;
    promptBody: string;
    allow: string;
    notNow: string;
    toggleLabel: string;
    toggleHint: string;
    timeLabel: string;
    on: string;
    off: string;
    denied: string;
    saved: string;
    failed: string;
  };
  billing: {
    loading: string;
    processing: string;
    unavailable: string;
    cancelled: string;
    pending: string;
    success: string;
    restore: string;
    restoring: string;
    restored: string;
    nothingToRestore: string;
    manage: string;
    errors: Record<
      | "sign_in_required"
      | "stripe_subscription_active"
      | "already_subscribed"
      | "account_mismatch"
      | "purchase_not_found"
      | "unknown_product"
      | "unavailable"
      | "invalid_request"
      | "origin_rejected"
      | "generic",
      string
    >;
  };
};

const messages: Record<LocaleTag, NativeMessages> = {
  "en-GB": {
    push: {
      promptTitle: "A gentle morning alert?",
      promptBody:
        "Celestial Atlas can let you know each morning when your reading for the day is ready. One alert a day, and you can turn it off at any time.",
      allow: "Turn on alerts",
      notNow: "Not now",
      toggleLabel: "Morning reading alert",
      toggleHint: "One alert a day when your reading is ready.",
      timeLabel: "Alert time",
      on: "On",
      off: "Off",
      denied:
        "Notifications are turned off for Celestial Atlas. You can allow them in Android Settings › Apps › Celestial Atlas › Notifications.",
      saved: "Saved.",
      failed: "That could not be saved. Please try again.",
    },
    billing: {
      loading: "Loading Google Play…",
      processing: "Confirming your membership…",
      unavailable:
        "Google Play Billing is not available on this device. Check that the Play Store is installed and signed in.",
      cancelled: "Purchase cancelled. You have not been charged.",
      pending:
        "Your purchase is pending. Atlas unlocks as soon as Google Play confirms the payment.",
      success: "Welcome to Atlas. Your membership is active.",
      restore: "Restore purchases",
      restoring: "Checking Google Play…",
      restored: "Your Atlas membership has been restored.",
      nothingToRestore:
        "No Atlas subscription was found for the Google account on this device.",
      manage: "Manage subscription in Google Play",
      errors: {
        sign_in_required: "Please sign in before choosing Atlas.",
        stripe_subscription_active:
          "You already have Atlas through the Celestial Atlas website. Manage that membership from a web browser.",
        already_subscribed: "You already have an active Atlas membership.",
        account_mismatch:
          "This Google Play subscription belongs to a different Celestial Atlas account. Sign in to that account to use it.",
        purchase_not_found:
          "Google Play could not find this purchase. If you were charged, try Restore purchases.",
        unknown_product:
          "This subscription is not available. Please try again later.",
        unavailable:
          "We could not confirm your purchase just now. It is safe: try Restore purchases in a few minutes.",
        invalid_request: "Something went wrong. Please try again.",
        origin_rejected: "Something went wrong. Please try again.",
        generic: "Something went wrong. Please try again.",
      },
    },
  },
  "es-ES": {
    push: {
      promptTitle: "¿Un aviso discreto por la mañana?",
      promptBody:
        "Celestial Atlas puede avisarte cada mañana cuando tu lectura del día esté lista. Un aviso al día, y puedes desactivarlo cuando quieras.",
      allow: "Activar avisos",
      notNow: "Ahora no",
      toggleLabel: "Aviso de lectura matinal",
      toggleHint: "Un aviso al día cuando tu lectura esté lista.",
      timeLabel: "Hora del aviso",
      on: "Activado",
      off: "Desactivado",
      denied:
        "Las notificaciones de Celestial Atlas están desactivadas. Puedes permitirlas en Ajustes de Android › Aplicaciones › Celestial Atlas › Notificaciones.",
      saved: "Guardado.",
      failed: "No se ha podido guardar. Inténtalo de nuevo.",
    },
    billing: {
      loading: "Cargando Google Play…",
      processing: "Confirmando tu suscripción…",
      unavailable:
        "Google Play Billing no está disponible en este dispositivo. Comprueba que Play Store esté instalada y con la sesión iniciada.",
      cancelled: "Compra cancelada. No se te ha cobrado nada.",
      pending:
        "Tu compra está pendiente. Atlas se activará en cuanto Google Play confirme el pago.",
      success: "Te damos la bienvenida a Atlas. Tu suscripción está activa.",
      restore: "Restaurar compras",
      restoring: "Consultando Google Play…",
      restored: "Tu suscripción a Atlas se ha restaurado.",
      nothingToRestore:
        "No se ha encontrado ninguna suscripción a Atlas para la cuenta de Google de este dispositivo.",
      manage: "Gestionar la suscripción en Google Play",
      errors: {
        sign_in_required: "Inicia sesión antes de elegir Atlas.",
        stripe_subscription_active:
          "Ya tienes Atlas a través del sitio web de Celestial Atlas. Gestiona esa suscripción desde un navegador.",
        already_subscribed: "Ya tienes una suscripción a Atlas activa.",
        account_mismatch:
          "Esta suscripción de Google Play pertenece a otra cuenta de Celestial Atlas. Inicia sesión en esa cuenta para usarla.",
        purchase_not_found:
          "Google Play no encuentra esta compra. Si se te ha cobrado, prueba Restaurar compras.",
        unknown_product:
          "Esta suscripción no está disponible. Inténtalo más tarde.",
        unavailable:
          "No hemos podido confirmar tu compra ahora mismo. No se ha perdido: prueba Restaurar compras dentro de unos minutos.",
        invalid_request: "Algo ha fallado. Inténtalo de nuevo.",
        origin_rejected: "Algo ha fallado. Inténtalo de nuevo.",
        generic: "Algo ha fallado. Inténtalo de nuevo.",
      },
    },
  },
  "fr-FR": {
    push: {
      promptTitle: "Une alerte discrète le matin ?",
      promptBody:
        "Celestial Atlas peut vous prévenir chaque matin quand votre lecture du jour est prête. Une alerte par jour, désactivable à tout moment.",
      allow: "Activer les alertes",
      notNow: "Plus tard",
      toggleLabel: "Alerte de lecture du matin",
      toggleHint: "Une alerte par jour quand votre lecture est prête.",
      timeLabel: "Heure de l’alerte",
      on: "Activée",
      off: "Désactivée",
      denied:
        "Les notifications de Celestial Atlas sont désactivées. Vous pouvez les autoriser dans Paramètres Android › Applications › Celestial Atlas › Notifications.",
      saved: "Enregistré.",
      failed: "L’enregistrement a échoué. Veuillez réessayer.",
    },
    billing: {
      loading: "Chargement de Google Play…",
      processing: "Confirmation de votre abonnement…",
      unavailable:
        "La facturation Google Play n’est pas disponible sur cet appareil. Vérifiez que le Play Store est installé et connecté.",
      cancelled: "Achat annulé. Aucun montant n’a été débité.",
      pending:
        "Votre achat est en attente. Atlas sera débloqué dès que Google Play aura confirmé le paiement.",
      success: "Bienvenue dans Atlas. Votre abonnement est actif.",
      restore: "Restaurer les achats",
      restoring: "Vérification auprès de Google Play…",
      restored: "Votre abonnement Atlas a été restauré.",
      nothingToRestore:
        "Aucun abonnement Atlas n’a été trouvé pour le compte Google de cet appareil.",
      manage: "Gérer l’abonnement dans Google Play",
      errors: {
        sign_in_required: "Connectez-vous avant de choisir Atlas.",
        stripe_subscription_active:
          "Vous avez déjà Atlas via le site web de Celestial Atlas. Gérez cet abonnement depuis un navigateur.",
        already_subscribed: "Vous avez déjà un abonnement Atlas actif.",
        account_mismatch:
          "Cet abonnement Google Play appartient à un autre compte Celestial Atlas. Connectez-vous à ce compte pour l’utiliser.",
        purchase_not_found:
          "Google Play ne trouve pas cet achat. Si vous avez été débité, essayez Restaurer les achats.",
        unknown_product:
          "Cet abonnement n’est pas disponible. Veuillez réessayer plus tard.",
        unavailable:
          "Nous n’avons pas pu confirmer votre achat pour le moment. Rien n’est perdu : essayez Restaurer les achats dans quelques minutes.",
        invalid_request: "Une erreur est survenue. Veuillez réessayer.",
        origin_rejected: "Une erreur est survenue. Veuillez réessayer.",
        generic: "Une erreur est survenue. Veuillez réessayer.",
      },
    },
  },
  "de-DE": {
    push: {
      promptTitle: "Ein sanfter Hinweis am Morgen?",
      promptBody:
        "Celestial Atlas kann dir jeden Morgen Bescheid geben, wenn deine Deutung für den Tag bereitsteht. Ein Hinweis pro Tag, jederzeit abschaltbar.",
      allow: "Hinweise aktivieren",
      notNow: "Nicht jetzt",
      toggleLabel: "Morgendlicher Deutungshinweis",
      toggleHint: "Ein Hinweis pro Tag, sobald deine Deutung bereitsteht.",
      timeLabel: "Uhrzeit",
      on: "An",
      off: "Aus",
      denied:
        "Benachrichtigungen für Celestial Atlas sind deaktiviert. Du kannst sie unter Android-Einstellungen › Apps › Celestial Atlas › Benachrichtigungen erlauben.",
      saved: "Gespeichert.",
      failed: "Das konnte nicht gespeichert werden. Bitte versuche es erneut.",
    },
    billing: {
      loading: "Google Play wird geladen …",
      processing: "Deine Mitgliedschaft wird bestätigt …",
      unavailable:
        "Google Play Billing ist auf diesem Gerät nicht verfügbar. Prüfe, ob der Play Store installiert und angemeldet ist.",
      cancelled: "Kauf abgebrochen. Dir wurde nichts berechnet.",
      pending:
        "Dein Kauf ist ausstehend. Atlas wird freigeschaltet, sobald Google Play die Zahlung bestätigt.",
      success: "Willkommen bei Atlas. Deine Mitgliedschaft ist aktiv.",
      restore: "Käufe wiederherstellen",
      restoring: "Google Play wird geprüft …",
      restored: "Deine Atlas-Mitgliedschaft wurde wiederhergestellt.",
      nothingToRestore:
        "Für das Google-Konto auf diesem Gerät wurde kein Atlas-Abo gefunden.",
      manage: "Abo in Google Play verwalten",
      errors: {
        sign_in_required: "Bitte melde dich an, bevor du Atlas wählst.",
        stripe_subscription_active:
          "Du hast Atlas bereits über die Celestial-Atlas-Website. Verwalte diese Mitgliedschaft in einem Webbrowser.",
        already_subscribed: "Du hast bereits eine aktive Atlas-Mitgliedschaft.",
        account_mismatch:
          "Dieses Google-Play-Abo gehört zu einem anderen Celestial-Atlas-Konto. Melde dich bei diesem Konto an, um es zu nutzen.",
        purchase_not_found:
          "Google Play findet diesen Kauf nicht. Falls dir etwas berechnet wurde, versuche „Käufe wiederherstellen“.",
        unknown_product:
          "Dieses Abo ist nicht verfügbar. Bitte versuche es später erneut.",
        unavailable:
          "Wir konnten deinen Kauf gerade nicht bestätigen. Er geht nicht verloren: Versuche in ein paar Minuten „Käufe wiederherstellen“.",
        invalid_request: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
        origin_rejected: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
        generic: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      },
    },
  },
};

export function nativeMessages(locale: string | null | undefined) {
  return messages[locale && isLocaleTag(locale) ? locale : "en-GB"];
}

/** Locale of the rendered page (`<html lang>`), client-side. */
export function documentNativeMessages() {
  return nativeMessages(
    typeof document === "undefined" ? null : document.documentElement.lang,
  );
}

export const nativeMessageCatalogue = messages;
