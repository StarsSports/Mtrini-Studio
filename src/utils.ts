export interface ParsedMessage {
  prose: string;
  hasArtifact: boolean;
  artifactTitle?: string;
  artifactLanguage?: string;
  artifactCode?: string;
}

/**
 * Parses message content to strip and isolate code artifacts.
 * Supports both custom [ARTIFACT ...] tags and typical markdown triple-backtick code blocks.
 * If a code block is identified, we separate the text (prose) from the code,
 * so that we show a sleek, clickable box instead of generating the whole code in-line.
 */
export function parseMessageArtifacts(content: string): ParsedMessage {
  if (!content) return { prose: '', hasArtifact: false };

  // 1. Try custom [ARTIFACT ...] format first
  const startTagIndex = content.indexOf('[ARTIFACT');
  if (startTagIndex !== -1) {
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
      return {
        prose,
        hasArtifact: true,
        artifactTitle,
        artifactLanguage,
        artifactCode: 'Compiler handshaking...'
      };
    }

    const codeStart = closingBracketOfStartTag + 1;
    const endTagIndex = tagContent.indexOf('[/ARTIFACT]');

    if (endTagIndex === -1) {
      const artifactCode = tagContent.substring(codeStart).trim();
      return {
        prose,
        hasArtifact: true,
        artifactTitle,
        artifactLanguage,
        artifactCode
      };
    }

    const artifactCode = tagContent.substring(codeStart, endTagIndex).trim();
    return {
      prose,
      hasArtifact: true,
      artifactTitle,
      artifactLanguage,
      artifactCode
    };
  }

  // 2. Fall back to standard markdown style code block detection (```lang ... ```)
  const markdownBlockRegex = /```(\w*)\n([\s\S]*?)(?:```|$)/;
  const match = content.match(markdownBlockRegex);
  if (match) {
    const matchedLanguage = match[1] || 'html';
    const matchedCode = match[2] || '';
    
    // Split prose and code
    const mathIdx = content.indexOf('```');
    const prose = content.substring(0, mathIdx).trim();
    
    // Infer a meaningful title
    let artifactTitle = 'script.' + (matchedLanguage === 'javascript' ? 'js' : matchedLanguage === 'typescript' ? 'ts' : matchedLanguage === 'python' ? 'py' : matchedLanguage || 'txt');
    if (matchedCode.includes('<!DOCTYPE html>') || matchedCode.includes('<html') || matchedCode.includes('<body>')) {
      artifactTitle = 'index.html';
    }

    return {
      prose,
      hasArtifact: true,
      artifactTitle,
      artifactLanguage: matchedLanguage,
      artifactCode: matchedCode
    };
  }

  return { prose: content, hasArtifact: false };
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


