"use client";

import React, { useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    AccessibilityHelp,
    Autoformat,
    Autosave,
    BlockQuote,
    Bold,
    Code,
    CodeBlock,
    Essentials,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    GeneralHtmlSupport,
    Heading,
    Highlight,
    HorizontalLine,
    ImageBlock,
    ImageCaption,
    ImageInline,
    ImageInsert,
    ImageInsertViaUrl,
    ImageResize,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,
    ListProperties,
    MediaEmbed,
    Mention,
    PageBreak,
    Paragraph,
    PasteFromOffice,
    RemoveFormat,
    SelectAll,
    SpecialCharacters,
    SpecialCharactersEssentials,
    Strikethrough,
    Style,
    Subscript,
    Superscript,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextTransformation,
    Underline,
    Undo,
    WordCount,
    Alignment,
    TodoList
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { uploadImage } from '@/app/actions/upload-image';

// Custom Upload Adapter for CKEditor
class CloudinaryUploadAdapter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loader: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(loader: any) {
        this.loader = loader;
    }

    upload(): Promise<{ default: string; alt: string }> {
        return this.loader.file.then((file: File) => new Promise((resolve, reject) => {
            const fileName = file.name.split('.').slice(0, -1).join('.') || file.name;
            const formData = new FormData();
            formData.append("file", file);

            uploadImage(formData)
                .then((url) => {
                    resolve({
                        default: url,
                        alt: fileName
                    });
                })
                .catch((error) => {
                    reject(error);
                });
        }));
    }

    abort() { }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MyCustomUploadAdapterPlugin(editor: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return new CloudinaryUploadAdapter(loader);
    };
}

interface EditorProps {
    content: string;
    onChange: (content: string) => void;
    onLengthChange?: (count: number) => void;
}

export default function Editor({ content, onChange, onLengthChange }: EditorProps) {
    const onLengthChangeRef = useRef(onLengthChange);

    useEffect(() => {
        onLengthChangeRef.current = onLengthChange;
    }, [onLengthChange]);

    const editorConfig = {
        plugins: [
            AccessibilityHelp, Autoformat, Autosave, BlockQuote, Bold, Code, CodeBlock, Essentials,
            FindAndReplace, FontBackgroundColor, FontColor, FontFamily, FontSize, GeneralHtmlSupport,
            Heading, Highlight, HorizontalLine, ImageBlock, ImageCaption, ImageInline, ImageInsert,
            ImageInsertViaUrl, ImageResize, ImageStyle, ImageTextAlternative, ImageToolbar, ImageUpload,
            Indent, IndentBlock, Italic, Link, LinkImage, List, ListProperties, MediaEmbed, Mention,
            PageBreak, Paragraph, PasteFromOffice, RemoveFormat, SelectAll, SpecialCharacters,
            SpecialCharactersEssentials, Strikethrough, Style, Subscript, Superscript, Table,
            TableCaption, TableCellProperties, TableColumnResize, TableProperties, TableToolbar,
            TextTransformation, Underline, Undo, WordCount,
            Alignment, TodoList,
            MyCustomUploadAdapterPlugin
        ],
        toolbar: {
            items: [
                'undo', 'redo',
                '|', 'heading',
                '|', 'style',
                '|', 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor',
                '|', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'code', 'removeFormat',
                '|', 'specialCharacters', 'horizontalLine', 'pageBreak',
                '|', 'link', 'insertImage', 'mediaEmbed', 'insertTable', 'blockQuote', 'codeBlock',
                '|', 'alignment',
                '|', 'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent'
            ],
            shouldNotGroupWhenFull: true
        },
        image: {
            toolbar: [
                'toggleImageCaption', 'imageTextAlternative', '|',
                'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|',
                'resizeImage'
            ]
        },
        table: {
            contentToolbar: [
                'tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'
            ]
        },
        heading: {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
                { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
            ]
        },
        placeholder: 'Start writing your truth...',
        licenseKey: 'GPL',
        wordCount: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onUpdate: (stats: any) => {
                if (onLengthChangeRef.current) onLengthChangeRef.current(stats.characters);
            }
        }
    };

    return (
        <div className="prose-editor space-y-2 relative" data-lenis-prevent>
            <style jsx global>{`
                .prose-editor .ck-editor__editable {
                    min-height: 500px;
                    max-height: 65vh;
                    overflow-y: auto !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 2.5rem !important;
                }
                .prose-editor .ck-editor__main {
                    background: transparent !important;
                    border: 1px solid rgba(0, 0, 0, 0.05) !important;
                    border-top: none !important;
                    border-bottom-left-radius: 1.5rem !important;
                    border-bottom-right-radius: 1.5rem !important;
                    overflow: hidden;
                }
                .dark .prose-editor .ck-editor__main {
                    border-color: rgba(255, 255, 255, 0.05) !important;
                }
                .prose-editor .ck-toolbar {
                    backdrop-filter: blur(12px);
                    background: rgba(255, 255, 255, 0.8) !important;
                    border: 1px solid rgba(0, 0, 0, 0.05) !important;
                    border-top-left-radius: 1.5rem !important;
                    border-top-right-radius: 1.5rem !important;
                    padding: 0.5rem !important;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .dark .prose-editor .ck-toolbar {
                    background: rgba(24, 24, 27, 0.8) !important;
                    border-color: rgba(255, 255, 255, 0.05) !important;
                }
                
                /* Problematic Content Highlighting - Red Border Box & Blinking */
                .ck-content h1:nth-of-type(n+2),
                .ck-content h2:nth-of-type(n+10) {
                    border: 2px dashed #ef4444 !important;
                    background: rgba(239, 68, 68, 0.05) !important;
                    padding: 1.5rem !important;
                    margin: 2rem -1.5rem !important;
                    border-radius: 12px;
                    position: relative;
                    animation: error-blink 2s infinite ease-in-out;
                    cursor: help;
                }
                
                .ck-content h1:nth-of-type(n+2)::after {
                    content: "⚠️ Multiple H1s Found - Only one H1 is allowed for SEO. This extra title might confuse search engines.";
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    margin-bottom: 8px;
                    background: #ef4444;
                    color: white;
                    font-size: 10px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-family: inherit;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    z-index: 100;
                    white-space: normal;
                    width: 280px;
                    box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.4);
                    pointer-events: none;
                    opacity: 0;
                    transform: translateY(5px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .ck-content h1:nth-of-type(n+2):hover::after {
                    opacity: 1;
                    transform: translateY(0);
                }

                .ck-content h2:nth-of-type(n+10)::after {
                    content: "⚠️ Too Many Subheadings - Having more than 9 sub-headings can make the article hard to read. Consider breaking this into multiple articles or merging sections.";
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    margin-bottom: 8px;
                    background: #f59e0b;
                    color: white;
                    font-size: 10px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-family: inherit;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    z-index: 100;
                    white-space: normal;
                    width: 280px;
                    box-shadow: 0 10px 20px -5px rgba(245, 158, 11, 0.4);
                    pointer-events: none;
                    opacity: 0;
                    transform: translateY(5px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .ck-content h2:nth-of-type(n+10):hover::after {
                    opacity: 1;
                    transform: translateY(0);
                }

                .ck-content img:not([alt]), 
                .ck-content img[alt=""],
                .ck-content img[alt="article-image"] {
                    outline: 4px dashed #ef4444 !important;
                    outline-offset: 4px;
                    filter: saturate(0.2) contrast(0.8) grayscale(0.5);
                    animation: error-blink 2s infinite ease-in-out;
                    border-radius: 8px;
                    cursor: help;
                }
                
                .ck-content figure.image:has(img:not([alt])),
                .ck-content figure.image:has(img[alt=""]),
                .ck-content figure.image:has(img[alt="article-image"]) {
                    position: relative;
                }

                .ck-content figure.image:has(img:not([alt]))::after,
                .ck-content figure.image:has(img[alt=""])::after,
                .ck-content figure.image:has(img[alt="article-image"])::after {
                    content: "⚠️ Missing Alt Text - Please add a description for this image to help visually impaired readers and improve SEO.";
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%) translateY(5px);
                    background: #ef4444;
                    color: white;
                    font-size: 10px;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 900;
                    text-transform: uppercase;
                    z-index: 100;
                    white-space: normal;
                    width: 240px;
                    text-align: center;
                    box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.4);
                    pointer-events: none;
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .ck-content figure.image:hover::after {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }

                @keyframes error-blink {
                    0% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 0px rgba(239, 68, 68, 0); }
                    50% { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
                    100% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 0px rgba(239, 68, 68, 0); }
                }

                /* Custom Scrollbar for Editor */
                .prose-editor .ck-editor__editable::-webkit-scrollbar {
                    width: 6px;
                }
                .prose-editor .ck-editor__editable::-webkit-scrollbar-track {
                    background: transparent;
                }
                .prose-editor .ck-editor__editable::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .dark .prose-editor .ck-editor__editable::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
            <CKEditor
                editor={ClassicEditor}
                data={content}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                config={editorConfig as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onReady={(editor: any) => {
                    // Handle markdown paste
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    editor.editing.view.document.on('clipboardInput', (evt: any, data: any) => {
                        const dataTransfer = data.dataTransfer;
                        const htmlData = dataTransfer.getData('text/html');
                        const textData = dataTransfer.getData('text/plain');

                        const isMarkdown = /^#\s|^\*|\*\*.+\*\*|^-\s|^>.+\n|^\[.+\]\(.+\)/m.test(textData);

                        if (htmlData) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(htmlData, 'text/html');
                            let modified = false;

                            // 1. Demote H1 to H2 to prevent multiple H1 issues
                            // We only do this if it's NOT the very first block of the paste? 
                            // Actually user said they want to detect and format properly.
                            // Demoting is proactive.
                            doc.querySelectorAll('h1').forEach(h => {
                                const h2 = doc.createElement('h2');
                                h2.innerHTML = h.innerHTML;
                                h.parentNode?.replaceChild(h2, h);
                                modified = true;
                            });

                            // 2. Ensure images have alt text if missing (use filename from src)
                            doc.querySelectorAll('img').forEach(img => {
                                if (!img.getAttribute('alt')) {
                                    const src = img.getAttribute('src') || '';
                                    const fileName = src.split('/').pop()?.split('.')[0] || 'article-image';
                                    img.setAttribute('alt', fileName.replace(/[-_]/g, ' '));
                                    modified = true;
                                }
                            });

                            if (modified) {
                                data.content = editor.data.processor.toView(doc.body.innerHTML);
                            }
                        } else if (isMarkdown && textData) {
                            const html = DOMPurify.sanitize(marked.parse(textData) as string);
                            // Process markdown-generated H1s to H2s
                            const tempDoc = new DOMParser().parseFromString(html as string, 'text/html');
                            tempDoc.querySelectorAll('h1').forEach(h => {
                                const h2 = tempDoc.createElement('h2');
                                h2.innerHTML = h.innerHTML;
                                h.parentNode?.replaceChild(h2, h);
                            });
                            data.content = editor.data.processor.toView(tempDoc.body.innerHTML);
                        }
                    });

                    // Update parent with length on load
                    const wordCountPlugin = editor.plugins.get('WordCount');
                    if (onLengthChangeRef.current) onLengthChangeRef.current(wordCountPlugin.characters);
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(_event: any, editor: any) => {
                    const data = editor.getData();
                    onChange(data);
                }}
            />

        </div>
    );
}
