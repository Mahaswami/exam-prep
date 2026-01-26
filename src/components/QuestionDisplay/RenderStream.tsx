import * as React from "react";
import { Box, Stack } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ContentBlock } from "./types";
import { wrapBareLatexCommands, normalizeBlockMath } from "../../utils/latexUtils";

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
                        {normalizeBlockMath((block.content || "").replace(/\n/g, "  \n"))}
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

// Re-export for backwards compatibility
export const wrapMathFracWithDollar = wrapBareLatexCommands;