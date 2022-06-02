import type { SolidTokenVerifierFunction } from '@solid/access-token-verifier';

// eslint-disable-next-line no-undef
const solidTokenVerifier = jest.fn().mockResolvedValue({ aud: 'solid', exp: 1_234, iat: 1_234, iss: 'example.com/idp', webid: 'http://alice.example/card#me' });
// eslint-disable-next-line no-undef
export const createSolidTokenVerifier = jest.fn((): SolidTokenVerifierFunction => solidTokenVerifier);
