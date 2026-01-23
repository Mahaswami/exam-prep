import * as React from "react";
import { Box, Stack } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ContentBlock } from "./types";

type RenderStreamProps = {
    stream: ContentBlock[] | string;
};

const isHtml = (str: string): boolean => /<[a-z][\s\S]*>/i.test(str);

const parseStream = (stream: ContentBlock[] | string): ContentBlock[] => {
    if (typeof stream === "string") {
        try {
            return JSON.parse(stream);
        } catch {
            return [{ type: isHtml(stream) ? "html" : "text", content: stream }];
        }
    }
    return stream;
};

export const RenderStream: React.FC<RenderStreamProps> = ({ stream }) => {
    const blocks = parseStream(stream);
    
    return (
        <Stack spacing={0.75}>
            {blocks.map((block, idx) => {
                if (block.type === "svg" && block.data) {
                    return (
                        <Box
                            key={block.id || idx}
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                p: 0.5,
                                backgroundColor: "background.paper",
                                borderRadius: 1,
                            }}
                            dangerouslySetInnerHTML={{ __html: block.data }}
                        />
                    );
                }

                if (block.type === "html" && block.content) {
                    return (
                        <Box
                            key={idx}
                            dangerouslySetInnerHTML={{ __html: block.content }}
                        />
                    );
                }

                return (
                    <ReactMarkdown
                        key={idx}
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                    >
                        {block.content || ""}
                    </ReactMarkdown>
                );
            })}
        </Stack>
    );
};

type RenderMathProps = {
    content: string;
    block?: boolean;
    preventDollarWrap?: boolean;
};

export const RenderMath: React.FC<RenderMathProps> = ({ content, block = true, preventDollarWrap = false }) => {
    const wrapped = block ? `$$${content}$$` : `$${content}$`;
    return (
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {preventDollarWrap ? content : wrapped}
        </ReactMarkdown>
    );
};


export const wrapMathFracWithDollar = (content: any): string => {
    if (!content || typeof content !== 'string') return content ?? '';
    
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
        if (content[i] === '$') {
            const end = content.indexOf('$', i + 1);
            if (end !== -1) { result += content.slice(i, end + 1); i = end + 1; continue; }
        }
        if (content[i] === '\\' && /[a-zA-Z]/.test(content[i + 1] || '')) {
            const cmdMatch = content.slice(i).match(/^\\[a-zA-Z]+/);
            if (cmdMatch) {
                let cmd = cmdMatch[0], pos = i + cmd.length;
                while (content[pos] === '{') {
                    const [braced, newPos] = extractBraced(content, pos);
                    cmd += braced; pos = newPos;
                }
                result += `$${cmd}$`; i = pos; continue;
            }
        }
        result += content[i++];
    }
    return result;
}