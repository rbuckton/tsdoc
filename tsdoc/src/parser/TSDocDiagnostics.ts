
export interface IDiagnosticDefinition {
  name: string;
}

export namespace TSDocDiagnostics {
  /**
   * The `@deprecated` block must include a deprecation message, e.g. describing the recommended alternative.
   */
  export const missingDeprecationMessage: IDiagnosticDefinition = {
    name: 'tsdoc-missing-deprecation-message'
  };

  /**
   * A `@remarks` block must not be used because that content is already provided by the `@inheritDoc` tag.
   */
  export const remarksWithInheritdoc: IDiagnosticDefinition = {
    name: 'tsdoc-remarks-with-inheritdoc'
  };

  /**
   * The summary section must not have any content, because that content is provided by the `@inheritDoc` tag.
   */
  export const summaryWithInheritdoc: IDiagnosticDefinition = {
    name: 'tsdoc-summary-with-inheritdoc'
  };

  /**
   * The TSDoc tag "`{0}`" is an inline tag; it must be enclosed in "\{ \}" braces.
   */
  export const inlineTagWithoutBraces: IDiagnosticDefinition = {
    name: 'tsdoc-inline-tag-without-braces'
  };

  /**
   * The TSDoc tag "`{0}`" is not an inline tag; it must not be enclosed in "\{ \}" braces.
   */
  export const blockTagWithBraces: IDiagnosticDefinition = {
    name: 'tsdoc-block-tag-with-braces'
  };

  /**
   * The TSDoc tag "`{0}`" is not supported by this tool.
   */
  export const unsupportedTag: IDiagnosticDefinition = {
    name: 'tsdoc-unsupported-tag'
  };

  /**
   * The TSDoc tag "`{0}`" is not defined in this configuration.
   */
  export const undefinedTag: IDiagnosticDefinition = {
    name: 'tsdoc-undefined-tag'
  };
}
