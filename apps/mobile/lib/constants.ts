// Avatar por defecto cuando el usuario no tiene uno propio. Por ahora el back
// siempre devuelve avatarUrl: null (la foto del DNI en people.photo es KYC, no
// se expone; el avatar elegible vendrá de R2 más adelante), así que el front
// cae siempre a este placeholder neutro (silueta "mystery person" de Gravatar).
export const DEFAULT_AVATAR_URI =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=256";
