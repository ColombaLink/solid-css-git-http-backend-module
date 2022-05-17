/**
 * Supports the behaviour described in https://www.w3.org/DesignIssues/HTTPFilenameMapping.html
 * Determines content-type based on the file extension.
 * In case an identifier does not end on an extension matching its content-type,
 * the corresponding file will be appended with the correct extension, preceded by $.
 */
import type { ResourceIdentifier, ResourceLink } from '@solid/community-server';
import { APPLICATION_OCTET_STREAM, ExtensionBasedMapper } from '@solid/community-server';

export class RegexBasedExtensionMapper extends ExtensionBasedMapper {
  private readonly regex: RegExp;
  private readonly contentTypeOfRegex: string;

  public constructor(
    base: string,
    rootFilepath: string,
    regex: string,
    contentTypeOfRegex: string,
    customTypes?: Record<string, string>,
  ) {
    super(base, rootFilepath, customTypes);
    this.regex = new RegExp(regex, 'u');
    this.contentTypeOfRegex = contentTypeOfRegex;
  }

  protected async mapUrlToDocumentPath(identifier: ResourceIdentifier, filePath: string, contentType?: string):
  Promise<ResourceLink> {
    const resourceLink = await super.mapUrlToDocumentPath(identifier, filePath, contentType);
    // Existing file
    if (resourceLink.contentType === APPLICATION_OCTET_STREAM) {
      // Find a matching file
      const match = this.regex.exec(filePath);
      // eslint-disable-next-line no-console
      if (match && match[0]) {
        resourceLink.contentType = this.contentTypeOfRegex;
      }
    }
    return resourceLink;
  }
}
