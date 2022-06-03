import { createSolidTokenVerifier } from '@solid/access-token-verifier';
import type { TargetExtractor, HttpRequest, CredentialSet } from '@solid/community-server';
import { getLoggerFor, BadRequestHttpError, NotImplementedHttpError, CredentialGroup, CredentialsExtractor } from '@solid/community-server';

/**
 * Credentials extractor that extracts a WebID from a Insecure Token.
 * This is a Token Extractor that should never be used in production
 * environments.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class InsecureTokenExtractor extends CredentialsExtractor {
  private readonly originalUrlExtractor: TargetExtractor;
  private readonly verify = createSolidTokenVerifier();
  protected readonly logger = getLoggerFor(this);
  private readonly tokenToWebId: Record<string, string>;
  /**
   * @param originalUrlExtractor - Reconstructs the original URL as requested by the client
   * @param tokenToWebId
   */
  public constructor(
    originalUrlExtractor: TargetExtractor,
    tokenToWebId: Record<string, string>,
  ) {
    super();
    this.originalUrlExtractor = originalUrlExtractor;
    this.tokenToWebId = tokenToWebId;
  }

  public async canHandle({ headers }: HttpRequest): Promise<void> {
    const { authorization } = headers;
    if (!authorization) {
      throw new NotImplementedHttpError('No Basic Authorization header specified.');
    }

    if (!this.isBasicAuthorization(authorization)) {
      throw new NotImplementedHttpError('No Basic DPoP-bound Authorization header specified.');
    }
  }

  /**
   * Expects an header: authorization like:
   * "Authorization: Basic  YWxpY2U6aW5zZWN1cmVUb2tlbg=="
   *                       alice:insecureToken
   * @param request
   */
  public async handle(request: HttpRequest): Promise<CredentialSet> {
    const { headers } = request;
    const { token } = this.decodeDpopFromAuthorization(headers.authorization!);
    // Reconstruct the original URL as requested by the client,
    // since this is the one it used to authorize the request

    // Validate the Authorization and DPoP header headers
    // and extract the WebID provided by the client
    try {
      const webId = this.tokenToWebId[token];
      this.logger.info(`Verified WebID InsecureToken  access token: ${webId}`);
      return { [CredentialGroup.agent]: { webId }};
    } catch (ex: unknown) {
      const message = `Error verifying WebID via Insecure access token: ${(ex as Error).message}`;
      this.logger.warn(message);
      throw new BadRequestHttpError(message, { cause: ex });
    }
  }

  private decodeDpopFromAuthorization(basicAuthorization: string): { user: string; token: string } {
    const withoutBase = basicAuthorization.slice(6);
    const decoded = Buffer.from(withoutBase, 'base64').toString('utf-8');
    const user = decoded.slice(0, decoded.indexOf(':'));
    const token = decoded.slice(decoded.indexOf(':') + 1, decoded.length);
    return {
      token,
      user,
    };
  }

  private isBasicAuthorization(authorization: string): boolean {
    return authorization.startsWith('Basic ');
  }
}
