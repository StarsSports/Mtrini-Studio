export interface ParsedMessage {
  prose: string;
  hasArtifact: boolean;
  artifactTitle?: string;
  artifactLanguage?: string;
  artifactCode?: string;
}

/**
 * Parses message content to strip and isolate code artifacts.
 * Supports active streams by parsing open tags gracefully.
 */
export function parseMessageArtifacts(content: string): ParsedMessage {
  if (!content) return { prose: '', hasArtifact: false };

  const startTagIndex = content.indexOf('[ARTIFACT');
  if (startTagIndex === -1) {
    return { prose: content, hasArtifact: false };
  }

  const prose = content.substring(0, startTagIndex).trim();
  const tagContent = content.substring(startTagIndex);

  // Match title="name" and language="lang"
  const titleMatch = tagContent.match(/title="([^"]*)"/);
  const langMatch = tagContent.match(/language="([^"]*)"/);
  
  const artifactTitle = titleMatch ? titleMatch[1] : 'script.txt';
  const artifactLanguage = langMatch ? langMatch[1] : 'text';

  // Find where the starting tag ends
  const closingBracketOfStartTag = tagContent.indexOf(']');
  if (closingBracketOfStartTag === -1) {
    // Tag is still being typed out
    return {
      prose,
      hasArtifact: true,
      artifactTitle,
      artifactLanguage,
      artifactCode: 'Compiler handshaking...'
    };
  }

  // Code body starts right after the start tag closing bracket
  const codeStart = closingBracketOfStartTag + 1;
  const endTagIndex = tagContent.indexOf('[/ARTIFACT]');

  if (endTagIndex === -1) {
    // Code block is currently streaming
    const artifactCode = tagContent.substring(codeStart).trim();
    return {
      prose,
      hasArtifact: true,
      artifactTitle,
      artifactLanguage,
      artifactCode
    };
  }

  // Complete closed block
  const artifactCode = tagContent.substring(codeStart, endTagIndex).trim();
  return {
    prose,
    hasArtifact: true,
    artifactTitle,
    artifactLanguage,
    artifactCode
  };
}

/**
 * Utility to generate file downloads on client side
 */
export function downloadFile(filename: string, content: string) {
  const element = document.createElement('a');
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
