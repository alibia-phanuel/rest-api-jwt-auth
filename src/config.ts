export default {
  accessTokenSecret: "supersecretkey123", // ⚠️ à mettre dans .env en prod
  accessTokenExpiresIn: "30s",
  // les refresh tokens seront valides pendant 2 minutes (2m)
  refreshTokenSecret: "supersecretkey456",
  refreshTokenExpiresIn: "2m",
  // les codes de 2FA seront valides pendant 5 minutes (5m)
  cachesTemporaryTokenPrefix: "temporaryTokenPrefix",
  cachesTemporaryTokenExpiresIn: "180s",
};
