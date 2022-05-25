import type { HttpHandlerInput, HttpRequest } from '@solid/community-server';
import {
  HttpHandler,
  getLoggerFor,
  NotImplementedHttpError,
} from '@solid/community-server';

import { requestHandler, defaultConfig } from '@fuubi/node-git-http-backend';

/**
 * Handler that serves static resources on specific paths.
 * Relative file paths are assumed to be relative to cwd.
 * Relative file paths can be preceded by `@css:`, e.g. `@css:foo/bar`,
 * in case they need to be relative to the module root.
 */
export class GitRequestHandler extends HttpHandler {
  private readonly logger = getLoggerFor(this);
  private readonly rootFilePath: string;
  private readonly gitBackenPath: string;

  /**
   * Creates a handler for the provided static resources.
   *  where URL paths ending in a slash are interpreted as entire folders.
   * @param gitBackendPath Path to git-http-backen
   * @param rootFilePath  Rootpath where files are stored
   */
  public constructor(gitBackendPath: string, rootFilePath: string) {
    super();
    this.gitBackenPath = gitBackendPath;
    this.rootFilePath = rootFilePath;
  }

  public async gitRegexFinder({ url }: HttpRequest): Promise<boolean> {
    const exp = /\/*.git\/?/u;
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
        response.on('finish', (): void => {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
          console.log(`finish`);
          resolve();
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
