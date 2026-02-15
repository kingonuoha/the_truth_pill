import { marked } from 'marked';
import dompurify from 'dompurify';
import dynamic from 'next/dynamic';
import { uploadImage } from '@/app/actions/upload-image';

// Custom Upload Adapter for CKEditor
class CloudinaryUploadAdapter {
    loader: { file: Promise<File> };
    constructor(loader: { file: Promise<File> }) {
        this.loader = loader;
    }

    upload(): Promise<{ default: string }> {
        return this.loader.file.then((file: File) => new Promise((resolve, reject) => {
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function MyCustomUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return new CloudinaryUploadAdapter(loader);
    };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Dynamic import for CKEditor to avoid SSR issues
const CKEditorWrapper = dynamic(
    () => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor),
    { ssr: false }
);

// Use a safer way to import the classic build
/* eslint-disable @typescript-eslint/no-require-imports */
const ClassicEditor = typeof window !== 'undefined' ? require('@ckeditor/ckeditor5-build-classic') : null;
/* eslint-enable @typescript-eslint/no-require-imports */

interface EditorProps {
    content: string;
    onChange: (content: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
    if (!ClassicEditor) return <div className="h-[400px] bg-zinc-50 animate-pulse rounded-2xl" />;

    return (
        <div className="prose-editor">
            <CKEditorWrapper
                editor={ClassicEditor}
                data={content}
                config={{
                    extraPlugins: [MyCustomUploadAdapterPlugin],
                    toolbar: [
                        'heading',
                        '|',
                        'bold',
                        'italic',
                        'link',
                        'bulletedList',
                        'numberedList',
                        '|',
                        'outdent',
                        'indent',
                        '|',
                        'imageUpload',
                        'blockQuote',
                        'insertTable',
                        'mediaEmbed',
                        'undo',
                        'redo'
                    ],
                    // Removed extra plugins that aren't in classic build to avoid errors
                    image: {
                        toolbar: [
                            'imageStyle:inline',
                            'imageStyle:block',
                            'imageStyle:side',
                            '|',
                            'toggleImageCaption',
                            'imageTextAlternative'
                        ]
                    }
                }}
                /* eslint-disable @typescript-eslint/no-explicit-any */
                onReady={(editor: any) => {
                    // Handle markdown paste
                    editor.editing.view.document.on('clipboardInput', (evt: any, data: any) => {
                        const dataTransfer = data.dataTransfer;
                        const textData = dataTransfer.getData('text/plain');

                        // Simple heuristic to detect markdown: presence of headers, bold, or lists
                        const isMarkdown = /^#\s|^\*|\*\*.+\*\*|^-\s|^>.+\n|^\[.+\]\(.+\)/m.test(textData);
                        const hasHtml = dataTransfer.getData('text/html');

                        if (isMarkdown && !hasHtml) {
                            // Convert markdown to HTML
                            const html = dompurify.sanitize(marked.parse(textData) as string);
                            // Set the HTML to the clipboard data
                            data.content = editor.data.processor.toView(html);
                        }
                    });
                }}
                /* eslint-enable @typescript-eslint/no-explicit-any */
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                onChange={(_event: any, editor: any) => {
                    const data = editor.getData();
                    onChange(data);
                }}
            />
            <style jsx global>{`
                .prose-editor .ck-content {
                    min-height: 400px !important;
                    border-bottom-left-radius: 1.5rem !important;
                    border-bottom-right-radius: 1.5rem !important;
                    font-family: ui-serif, Georgia, serif;
                    font-size: 1.125rem;
                    line-height: 1.8;
                    padding: 3rem !important;
                    border-color: #f4f4f5 !important;
                    background: white !important;
                    color: #27272a;
                }
                .prose-editor .ck-toolbar {
                    border-top-left-radius: 1.5rem !important;
                    border-top-right-radius: 1.5rem !important;
                    background: #fafafa !important;
                    padding: 0.5rem 1rem !important;
                    border-color: #f4f4f5 !important;
                    border-top: 1px solid #f4f4f5 !important;
                    border-left: 1px solid #f4f4f5 !important;
                    border-right: 1px solid #f4f4f5 !important;
                }
                .prose-editor .ck.ck-editor__main>.ck-editor__editable:not(.ck-focused) {
                    border-color: #f4f4f5 !important;
                }
                .prose-editor .ck-editor__main > .ck-editor__editable.ck-focused {
                    border-color: #0ea5e966 !important;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.05) !important;
                }
                .prose-editor .ck.ck-toolbar {
                    border-bottom: 1px solid #f4f4f5 !important;
                }
                .prose-editor .ck-content h1, 
                .prose-editor .ck-content h2, 
                .prose-editor .ck-content h3 {
                    font-family: ui-serif, Georgia, serif;
                    font-weight: 900;
                    color: #09090b;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                }
                .prose-editor .ck-content blockquote {
                    border-left: 4px solid #a855f7;
                    background: #faf5ff;
                    padding: 1.5rem;
                    border-radius: 0.5rem;
                    font-style: italic;
                    color: #6b21a8;
                }
                .prose-editor .ck-content img {
                    border-radius: 1.5rem;
                    border: 1px solid #f4f4f5;
                    margin: 2rem 0;
                }
            `}</style>
        </div>
    );
}
