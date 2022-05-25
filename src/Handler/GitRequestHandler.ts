import type { HttpHandlerInput, HttpRequest } from '@solid/community-server';
import {
  HttpHandler,
  getLoggerFor,
  NotImplementedHttpError,
} from '@solid/community-server';

import { requestHandler, defaultConfig } from '@fuubi/node-git-http-backend';

/**
 * Handler that serves Git Resources which are identified by including ".git/"
 */
export class GitRequestHandler extends HttpHandler {
  private readonly logger = getLoggerFor(this);
  private readonly rootFilePath: string;
  private readonly gitBackenPath: string;
  private readonly gitRegex: RegExp;

  /**
   * Creates a handler for the provided Git resources.
   *  git Ressources need to include ".git/" to get handled here
   * @param gitBackendPath Path to git-http-backen
   * @param rootFilePath  Rootpath where files are stored
   */
  public constructor(gitBackendPath: string, rootFilePath: string, gitRegex: string) {
    super();
    this.gitBackenPath = gitBackendPath;
    this.rootFilePath = rootFilePath;
    this.gitRegex = new RegExp(gitRegex, 'u');
  }

  public async gitRegexFinder({ url }: HttpRequest): Promise<boolean> {
    const exp = this.gitRegex;
    const match = exp.exec(url ?? '');
    if (!match) {
      return false;
    }
    return true;
  }

  public async canHandle({ request }: HttpHandlerInput): Promise<void> {
    const isGit = await this.gitRegexFinder(request);
    if (!isGit) {
      throw new NotImplementedHttpError('Not Git File');
    }
    if (request.method !== 'GET' && request.method !== 'POST' && request.method !== 'PROPFIND') {
      throw new NotImplementedHttpError('Only GET and HEAD requests are supported');
    }
  }

  public async handle({ request, response }: HttpHandlerInput): Promise<void> {
    const isGit = await this.gitRegexFinder(request);
    if ((request.method === 'GET' || request.method === 'POST' || request.method === 'PROPFIND') && isGit) {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
      console.log(`GitRequestHandler handle GET ${request.url}`);
      const config = defaultConfig(this.gitBackenPath, this.rootFilePath);
      const gitBackendHandler = requestHandler(config);
      gitBackendHandler(request, response);

      const wait = new Promise<void>((resolve, reject): void => {
        response.on('error', (): void => {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
          throw new NotImplementedHttpError('Only GET and HEAD requests are supported');
        });

        response.on('close', (): void => {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
          console.log(`close`);
          resolve();
        });
      });
      await wait;
    }
  }
}
