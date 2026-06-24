'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Paperclip, X, FileText } from 'lucide-react';
import { formatBytes } from '../lib/training-mocks';
import type { Attachment } from '../lib/training-types';

interface AttachmentListProps {
    attachments: Attachment[];
    onAdd: (attachment: Omit<Attachment, 'id'>) => void;
    onRemove: (id: string) => void;
}

export function AttachmentList({ attachments, onAdd, onRemove }: AttachmentListProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        for (const file of Array.from(files)) {
            // ponytail: simulate upload with object url; backend would upload here
            onAdd({
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                url: URL.createObjectURL(file),
            });
        }
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                <Label htmlFor="attachment-input">Adjuntos</Label>
                <input
                    id="attachment-input"
                    ref={inputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="outline"
                    className="w-fit border-border"
                    onClick={() => inputRef.current?.click()}
                >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Adjuntar archivo
                </Button>
            </div>

            {attachments.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {attachments.map((attachment) => (
                        <li
                            key={attachment.id}
                            className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="truncate text-sm font-medium">{attachment.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatBytes(attachment.size)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => onRemove(attachment.id)}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Eliminar adjunto</span>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
