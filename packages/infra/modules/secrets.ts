export const jwtSecret = new sst.Secret("JwtSecret");
export const resendApiKey = new sst.Secret("ResendApiKey");

export const secrets = [jwtSecret, resendApiKey];
