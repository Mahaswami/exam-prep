/**
 * Ensures block math ($$...$$) is on its own line for proper rendering.
 * ReactMarkdown/remark-math requires block math to be separated by newlines.
 */
export const normalizeBlockMath = (content: string): string => {
    if (!content || typeof content !== 'string') return content ?? '';
    
    // Add newline before $$ if not at start of string or after newline
    // Add newline after $$ block end if not at end or before newline
    let result = content;
    
    // Match $$...$$ blocks and ensure they have newlines around them
    result = result.replace(/(^|[^\n])\$\$/g, '$1\n$$');
    result = result.replace(/\$\$([^\n]|$)/g, (match, after) => {
        // Only add newline after closing $$ (not opening)
        // We need to detect if this is a closing $$
        return '$$' + (after === '' ? '' : '\n' + after);
    });
    
    // Better approach: explicitly find $$...$$  blocks and wrap with newlines
    result = content.replace(/\$\$([^$]+)\$\$/g, (match, inner) => {
        return `\n$$${inner}$$\n`;
    });
    
    // Clean up multiple consecutive newlines
    result = result.replace(/\n{3,}/g, '\n\n');
    
    // Trim leading/trailing whitespace from lines but preserve structure
    return result.trim();
};

/**
 * Auto-wraps bare LaTeX commands (like \frac{a}{b}) with $ delimiters.
 * Handles nested braces correctly.
 */
export const wrapBareLatexCommands = (content: any): string => {
    if (!content || typeof content !== 'string') return content ?? '';
    
    const trimmed = content.trim();
    // Skip if already fully wrapped
    if (/^\$\$[\s\S]+\$\$$/.test(trimmed) || /^\$[^$]+\$$/.test(trimmed)) {
        return content;
    }
    
    const extractBraced = (str: string, start: number): [string, number] => {
        if (str[start] !== '{') return ['', start];
        let depth = 0, i = start;
        for (; i < str.length; i++) {
            if (str[i] === '{') depth++;
            else if (str[i] === '}') depth--;
            if (depth === 0) return [str.slice(start, i + 1), i + 1];
        }
        return [str.slice(start), i];
    };

    let result = '', i = 0;
    while (i < content.length) {
        // Skip already-wrapped math
        if (content[i] === '$') {
            if (content[i + 1] === '$') {
                // Block math $$...$$
                const end = content.indexOf('$$', i + 2);
                if (end !== -1) {
                    result += content.slice(i, end + 2);
                    i = end + 2;
                    continue;
                }
            } else {
                // Inline math $...$
                const end = content.indexOf('$', i + 1);
                if (end !== -1) {
                    result += content.slice(i, end + 1);
                    i = end + 1;
                    continue;
                }
            }
        }
        
        // Detect bare LaTeX commands
        if (content[i] === '\\' && /[a-zA-Z]/.test(content[i + 1] || '')) {
            const cmdMatch = content.slice(i).match(/^\\[a-zA-Z]+/);
            if (cmdMatch) {
                let cmd = cmdMatch[0], pos = i + cmd.length;
                
                // Collect all brace groups following the command
                while (content[pos] === '{') {
                    const [braced, newPos] = extractBraced(content, pos);
                    cmd += braced;
                    pos = newPos;
                }
                
                // Also handle subscripts/superscripts following
                while (content[pos] === '_' || content[pos] === '^') {
                    cmd += content[pos++];
                    if (content[pos] === '{') {
                        const [braced, newPos] = extractBraced(content, pos);
                        cmd += braced;
                        pos = newPos;
                    } else if (content[pos]) {
                        cmd += content[pos++];
                    }
                }
                
                result += `$${cmd}$`;
                i = pos;
                continue;
            }
        }
        result += content[i++];
    }
    return result;
};

interface ContentBlock {
    type: 'text' | 'svg' | 'html';
    content?: string;
    data?: string;
    id?: string;
    alt?: string;
}

/**
 * Fix LaTeX in ContentBlock arrays or strings
 */
const fixContentBlockLatex = (value: ContentBlock[] | string): ContentBlock[] | string => {
    // If it's already an array, process each text block
    if (Array.isArray(value)) {
        return value.map(block => {
            if (block.type === 'text' && block.content) {
                return {
                    ...block,
                    content: normalizeBlockMath(wrapBareLatexCommands(block.content))
                };
            }
            return block;
        });
    }
    
    // If it's a string, try to parse as JSON array
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                const fixed = fixContentBlockLatex(parsed);
                return JSON.stringify(fixed);
            }
        } catch {
            // Plain string, apply fixes directly
            return normalizeBlockMath(wrapBareLatexCommands(value));
        }
    }
    
    return value;
};

/**
 * Apply LaTeX auto-fix to all text fields in a generated question.
 * Handles both ContentBlock[] and plain string formats.
 */
export const autoFixGeneratedLatex = <T extends Record<string, any>>(generated: T): T => {
    const fixed = { ...generated };
    
    if (fixed.question_stream) {
        fixed.question_stream = fixContentBlockLatex(fixed.question_stream);
    }
    
    if (fixed.answer_stream) {
        fixed.answer_stream = fixContentBlockLatex(fixed.answer_stream);
    }
    
    if (typeof fixed.hint === 'string') {
        fixed.hint = normalizeBlockMath(wrapBareLatexCommands(fixed.hint));
    }
    
    if (typeof fixed.final_answer === 'string') {
        fixed.final_answer = wrapBareLatexCommands(fixed.final_answer);
    }
    
    if (fixed.options && typeof fixed.options === 'object') {
        fixed.options = { ...fixed.options };
        for (const key of Object.keys(fixed.options)) {
            if (typeof fixed.options[key] === 'string') {
                fixed.options[key] = wrapBareLatexCommands(fixed.options[key]);
            }
        }
    }
    
    return fixed;
};
