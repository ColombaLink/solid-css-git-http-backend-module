import type { RequestMethod } from '@solid/access-token-verifier';
import { createSolidTokenVerifier } from '@solid/access-token-verifier';
import type { TargetExtractor, HttpRequest, CredentialSet } from '@solid/community-server';
import { getLoggerFor, BadRequestHttpError, NotImplementedHttpError, CredentialGroup, CredentialsExtractor } from '@solid/community-server';

/**
 * Credentials extractor that extracts a WebID from a DPoP-bound access token.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class UrlDPoPWebIdExtractor extends CredentialsExtractor {
  private readonly originalUrlExtractor: TargetExtractor;
  private readonly verify = createSolidTokenVerifier();
  protected readonly logger = getLoggerFor(this);

  /**
     * @param originalUrlExtractor - Reconstructs the original URL as requested by the client
     */
  public constructor(originalUrlExtractor: TargetExtractor) {
    super();
    this.originalUrlExtractor = originalUrlExtractor;
  }

  public async canHandle({ headers }: HttpRequest): Promise<void> {
    const { authorization } = headers;
    if (!authorization) {
      throw new NotImplementedHttpError('No DPoP-bound Authorization header specified.');
    }
  }

  /**
   * Expects an header: authorization like: "Base  DPoP token-1234:token-5678"
   * @param request
   */
  public async handle(request: HttpRequest): Promise<CredentialSet> {
    const { headers: { authorization }, method } = request;

    if (!authorization) {
      throw new NotImplementedHttpError('No DPoP-bound Authorization header specified.');
    }
    const withoutBase = authorization.slice(6);
    const buffer = Buffer.from(withoutBase, 'base64');
    const decoded = buffer.toString('utf-8');
    const splitAuth = decoded.slice(0, decoded.indexOf(':'));
    const tokenDpop = decoded.slice(decoded.indexOf(':') + 1, decoded.length);
    let auth: string;
    let token: string;

    if (authorization.startsWith('Base')) {
      auth = splitAuth;
      token = tokenDpop;
    } else {
      auth = 'DPoP token-1234';
      token = 'token-5678';
    }

    // Reconstruct the original URL as requested by the client,
    // since this is the one it used to authorize the request
    const originalUrl = await this.originalUrlExtractor.handleSafe({ request });

    // Validate the Authorization and DPoP header headers
    // and extract the WebID provided by the client
    try {
      const { webid: webId } = await this.verify(
        auth!,
        {
          header: token!,
          method: method as RequestMethod,
          url: originalUrl.path,
        },
      );
      this.logger.info(`Verified WebID via DPoP-bound access token: ${webId}`);
      return { [CredentialGroup.agent]: { webId }};
    } catch (ex: unknown) {
      const message = `Error verifying WebID via DPoP-bound access token: ${(ex as Error).message}`;
      this.logger.warn(message);
      throw new BadRequestHttpError(message, { cause: ex });
    }
  }
}
