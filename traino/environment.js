// Currently not using this file, thinking of changing all the env through out the system
// To use the env.apiKey for example, getting all the keys here to know it works?
const getEnvironmentVariable = (environmentVariable) => {
  const unvalidatedEnvironmentVariable = process.env[environmentVariable];
  if (!unvalidatedEnvironmentVariable) {
    throw new Error(`Couldn't find environment variable: ${environmentVariable}`);
  } else {
    return unvalidatedEnvironmentVariable;
  }
};

export const env = {
  apiKey: getEnvironmentVariable('API_KEY'),
  publicApiKey: getEnvironmentVariable('NEXT_PUBLIC_API_KEY'),
  serverSecret: getEnvironmentVariable('SERVER_SECRET'),
  debug: getEnvironmentVariable('NEXT_PUBLIC_DEBUG'),
  developmentMode: getEnvironmentVariable('NEXT_PUBLIC_DEVELOPMENT_MODE'),
};
