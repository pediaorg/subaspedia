export const jwtSecret = new sst.Secret("JwtSecret");
export const dbId = new sst.Secret("DbId", "pending");

export const secrets = [jwtSecret, dbId];
