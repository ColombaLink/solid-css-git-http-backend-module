import escapeStringRegexp from 'escape-string-regexp';
import type { HttpHandlerInput, HttpRequest } from '@solid/community-server';
import {
  HttpHandler,
  getLoggerFor,
  NotImplementedHttpError,
  BaseFileIdentifierMapper,
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

  /**
     * Creates a handler for the provided static resources.
     * @param assets - A mapping from URL paths to paths,
     *  where URL paths ending in a slash are interpreted as entire folders.
     * @param options - Cache expiration time in seconds.
     */
  public constructor() {
    super();
  }

  /**
     * Creates a regular expression that matches the URL paths.
     */
  private createPathMatcher(assets: Record<string, string>): RegExp {
    // Sort longest paths first to ensure the longest match has priority
    const paths = Object.keys(assets).sort((pathA, pathB): number => pathB.length - pathA.length);

    // Collect regular expressions for files and folders separately
    const files = ['.^'];
    const folders = ['.^'];
    for (const path of paths) {
      (path.endsWith('/') ? folders : files).push(escapeStringRegexp(path));
    }

    // Either match an exact document or a file within a folder (stripping the query string)
    return new RegExp(`^(?:(${files.join('|')})|(${folders.join('|')})([^?]+))(?:\\?.*)?$`, 'u');
  }

  public async gitRegexFinder({ url }: HttpRequest): Promise<boolean> {
    const exp = /\/*.git\/$/u;
    const match = exp.exec(url ?? '');
    if (!match) {
      return false;
    }
    return true;
  }

  public async canHandle({ request }: HttpHandlerInput): Promise<void> {
    if (request.method !== 'GET' && request.method !== 'POST' && request.method !== 'PROPFIND') {
      throw new NotImplementedHttpError('Only GET and HEAD requests are supported');
    }

  }

  public async handle({ request, response }: HttpHandlerInput): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
    console.log(`GitRequestHandler handle GET ${request.url}`);
    const config = defaultConfig('/usr/lib/git-core/git-http-backend', '/home/parfab00/Repositories/node-git-http-backend/dev');
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
    // eslint-disable-next-line @typescript-eslint/no-base-to-string, no-console
  }
}
