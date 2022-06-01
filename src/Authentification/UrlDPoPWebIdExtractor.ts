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

  public async handle(request: HttpRequest): Promise<CredentialSet> {
    const { headers: { authorization, host }, url, method } = request;

    if (!authorization) {
      throw new NotImplementedHttpError('No DPoP-bound Authorization header specified.');
    }
    const toDecode = authorization.slice(6);
    const buff = Buffer.from(toDecode, 'base64');
    const decoded = buff.toString('utf-8');
    const wholeUrl = `http://${host!}${url!}`;
    const defineDpop = 'DPoP';
    try {
      const { webid: webId } = await this.verify(
        defineDpop,
        {
          header: decoded,
          method: method as RequestMethod,
          url: wholeUrl,
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
