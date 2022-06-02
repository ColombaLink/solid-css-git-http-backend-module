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

        const token = 'DPoP token-1234';
        const dpop =  'token-5678';
        let authorization =  Buffer.from(`${token}:${dpop}`).toString("base64");
        authorization = 'Base  ' + authorization;

        const request = {
            method: 'GET',
            headers: {
                authorization
            },
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
        it('Fetch identity provider', async(): Promise<void> => {
            const url = 'http://localhost:3000/.well-known/openid-configuration';
            const res = await fetch(url,{method:'GET'});
            //console.log(res)
            if(res.body) {
                const body =await res.json();
                console.log(body)
            }
            expect(res.status).toBe(200);
        });

        it('Authorization Request', async(): Promise<void> => {
            const url = 'http://localhost:3000/.oidc/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Falice&scope=openid%20webid%20offline_access&client_id=http%3A%2F%2Flocalhost%3A3000%2Falice%2Fwebid%23this&code_challenge_method=S256&code_challenge=HSi9dwlvRpNHCDm-L8GOdM16qcb0tLHPZqQSvaWXTI0';
            const res = await fetch(url,{method:'GET'});
            //console.log(res)
            if(res.body) {
                const body =await res;
                console.log(body)
            }
            expect(res.status).toBe(200);
        });
    })

    describe('Get request', (): void => {
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
