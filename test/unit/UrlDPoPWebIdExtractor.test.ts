import { UrlDPoPWebIdExtractor } from '../../src/Authentification/UrlDPoPWebIdExtractor'
import * as http from "http";
import fetch from "cross-fetch";
import type { RequestMethod } from '@solid/access-token-verifier';
import { createSolidTokenVerifier } from '@solid/access-token-verifier';
import type { TargetExtractor, HttpRequest, CredentialSet } from '@solid/community-server';
import { getLoggerFor, BadRequestHttpError, NotImplementedHttpError, CredentialGroup, CredentialsExtractor } from '@solid/community-server';
import {StaticAsyncHandler} from "../util/StaticAsyncHandler";

const solidTokenVerifier = createSolidTokenVerifier() as jest.MockedFunction<any>;

describe('Url DPoPWebIdExtractor', (): void => {
    const targetExtractor = new StaticAsyncHandler(true, { path: 'http://example.org/foo/bar' });
    const webIdExtractor = new UrlDPoPWebIdExtractor(targetExtractor);

    beforeEach((): void => {
        jest.clearAllMocks();
        jest.spyOn(targetExtractor, 'handle');
    });

    describe('on a request with Authorization and DPop headers', (): void => {
        const request = {
            method: 'GET',
            url: 'http://token-5678@example.org/foo/bar'
        } as any as HttpRequest;

        it('calls the target extractor with the correct parameters.', async(): Promise<void> => {
            await webIdExtractor.handleSafe(request);
            expect(targetExtractor.handle).toHaveBeenCalledTimes(1);
            expect(targetExtractor.handle).toHaveBeenCalledWith({ request });
        });

        it('calls the DPoP verifier with the correct parameters.', async(): Promise<void> => {
            await webIdExtractor.handleSafe(request);
            expect(solidTokenVerifier).toHaveBeenCalledTimes(1);
            expect(solidTokenVerifier).toHaveBeenCalledWith('DPoP token-1234', { header: 'token-5678', method: 'GET', url: 'http://example.org/foo/bar' });
        });

        it('returns the extracted WebID.', async(): Promise<void> => {
            const result = webIdExtractor.handleSafe(request);
            await expect(result).resolves.toEqual({ [CredentialGroup.agent]: { webId: 'http://alice.example/card#me' }});
        });
    });

    describe('Fetch request', (): void => {
        it('can do a successful GET request to a document.', async(): Promise<void> => {
            const url = 'http://alice:test@localhost:3000';
            const res = await fetch(url,{method:'GET'});
            expect(res.status).toBe(200);
        });
    })

    describe('when verification throws an error', (): void => {
        const request = {
            method: 'GET',
            headers: {
                authorization: 'DPoP token-1234',
                dpop: 'token-5678',
            },
        } as any as HttpRequest;

        beforeEach((): void => {
            solidTokenVerifier.mockImplementationOnce((): void => {
                throw new Error('invalid');
            });
        });

    });
});
