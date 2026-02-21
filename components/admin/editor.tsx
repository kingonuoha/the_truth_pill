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
import { toast } from 'sonner';

// Custom Upload Adapter for CKEditor
class CloudinaryUploadAdapter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loader: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(loader: any) {
        this.loader = loader;
    }

    upload(): Promise<{ default: string }> {
        return this.loader.file.then((file: File) => new Promise((resolve, reject) => {
            // Article body image limit: 20MB
            const MAX_SIZE = 20 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                const error = "Body image exceeds 20MB limit.";
                toast.error(error);
                return reject(error);
            }

            const formData = new FormData();
            formData.append("file", file);

            uploadImage(formData)
                .then((url) => {
                    resolve({
                        default: url
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
        <div className="prose-editor space-y-2">
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
                        const textData = dataTransfer.getData('text/plain');

                        const isMarkdown = /^#\s|^\*|\*\*.+\*\*|^-\s|^>.+\n|^\[.+\]\(.+\)/m.test(textData);
                        const hasHtml = dataTransfer.getData('text/html');

                        if (isMarkdown && !hasHtml) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const html = DOMPurify.sanitize(marked.parse(textData) as any);
                            data.content = editor.data.processor.toView(html);
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
