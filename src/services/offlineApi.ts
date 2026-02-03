import api from './api';
import {
    getCachedNotes,
    setCachedNotes,
    addCachedNote,
    updateCachedNote,
    removeCachedNote,
    getCachedNoteById,
    CachedNote,
    enqueueOperation,
    getSyncQueue,
    setSyncQueue,
    generateUUID,
} from './storage';

let isOnlineGlobal = true;

export const setGlobalOnlineStatus = (online: boolean) => {
    isOnlineGlobal = online;
};

// Notes API
export const getNotes = async (searchQuery?: string, labelId?: number): Promise<any[]> => {
    if (isOnlineGlobal) {
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (labelId) params.label_id = labelId;

            const response = await api.get('/notes', { params });
            const notes = response.data.data || response.data;

            console.log(`🌐 Fetched ${notes.length} notes from server`);

            const currentCached = await getCachedNotes();
            const localOnlyNotes = currentCached.filter(n => n.locallyModified);

            const serverNotesMapped: CachedNote[] = notes.map((note: any) => ({
                id: note.id,
                data: note,
                locallyModified: false,
                lastSyncedAt: new Date().toISOString(),
            }));

            const mergedNotes = [...serverNotesMapped];

            localOnlyNotes.forEach(localNote => {
                const index = mergedNotes.findIndex(n => n.id === localNote.id);
                if (index !== -1) {
                    mergedNotes[index] = localNote;
                } else {
                    mergedNotes.unshift(localNote);
                }
            });

            await setCachedNotes(mergedNotes);
            return mergedNotes.map(n => n.data);
        } catch (error) {
            console.warn('Failed to fetch notes from server, falling back to cache:', error);
            return getCachedNotesData();
        }
    } else {
        console.log('📴 Offline: Loading notes from cache');
        return getCachedNotesData();
    }
};

const getCachedNotesData = async (): Promise<any[]> => {
    const cached = await getCachedNotes();
    console.log(`💾 Retrieved ${cached.length} notes from cache`);
    return cached.map(c => c.data);
};

export const getNote = async (id: string | number): Promise<any | null> => {
    try {
        if (isOnlineGlobal) {
            const response = await api.get(`/notes/${id}`);
            await addCachedNote({
                id: response.data.id,
                data: response.data,
                locallyModified: false,
            });
            return response.data;
        } else {
            const cached = await getCachedNoteById(id);
            return cached ? cached.data : null;
        }
    } catch (error) {
        console.warn('Failed to fetch note from server, falling back to cache:', error);
        const cached = await getCachedNoteById(id);
        return cached ? cached.data : null;
    }
};

export const createNote = async (payload: any): Promise<any> => {
    const tempId = `offline_${generateUUID()}`;
    const localNote = {
        id: tempId,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_pinned: false,
        is_archived: false,
        checklist_items: payload.checklist_items || [],
        labels: payload.labels || [],
        images: payload.images || [],
        audio_recordings: payload.audio_recordings || [],
        drawings: payload.drawings || [],
        reminder: null,
    };

    const { audio_uri, drawing_uri, ...noteData } = payload;

    await addCachedNote({
        id: tempId,
        data: localNote,
        locallyModified: true,
    });

    console.log('📝 Note created locally:', tempId);

    await enqueueOperation({
        type: 'CREATE',
        resourceType: 'note',
        resourceId: tempId,
        payload: noteData,
    });

    if (audio_uri) {
        await enqueueOperation({
            type: 'CREATE_AUDIO',
            resourceType: 'audio',
            resourceId: tempId,
            payload: { noteId: tempId, audioFile: { uri: audio_uri } },
        });
    }

    if (drawing_uri) {
        await enqueueOperation({
            type: 'CREATE_DRAWING',
            resourceType: 'drawing',
            resourceId: tempId,
            payload: { noteId: tempId, drawing_uri },
        });
    }

    return localNote;
};

export const updateNote = async (id: string | number, payload: any): Promise<any> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        const updatedData = {
            ...cached.data,
            ...payload,
            updated_at: new Date().toISOString(),
        };

        await updateCachedNote(id, {
            data: updatedData,
            locallyModified: true,
        });

        console.log('✏️ Note updated locally:', id);
    }

    await enqueueOperation({
        type: 'UPDATE',
        resourceType: 'note',
        resourceId: id,
        payload,
    });

    return cached?.data;
};

export const deleteNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        await updateCachedNote(id, {
            data: { ...cached.data, is_deleted: true },
            locallyModified: true,
        });
        console.log('🗑️ Note soft-deleted locally:', id);
    }
};

export const permanentlyDeleteNote = async (id: string | number): Promise<void> => {
    await removeCachedNote(id);
    console.log('💣 Note deleted permanently from cache:', id);

    const idStr = id.toString();
    if (idStr.startsWith('offline_')) {
        const queue = await getSyncQueue();
        const filteredQueue = queue.filter(op => {
            const isTargetNote = op.resourceId === id;
            const isRelatedAttachment = op.payload && op.payload.noteId === id;
            return !isTargetNote && !isRelatedAttachment;
        });

        if (queue.length !== filteredQueue.length) {
            await setSyncQueue(filteredQueue);
            console.log('🧹 Removed pending operations for offline note:', id);
        }
        return;
    }

    await enqueueOperation({
        type: 'DELETE',
        resourceType: 'note',
        resourceId: id,
        payload: {},
    });
};

// Pin/Archive operations
export const pinNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        await updateCachedNote(id, {
            data: { ...cached.data, is_pinned: true },
            locallyModified: true,
        });
    }

    await enqueueOperation({
        type: 'PIN_NOTE',
        resourceType: 'note',
        resourceId: id,
        payload: {},
    });
};

export const unpinNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        await updateCachedNote(id, {
            data: { ...cached.data, is_pinned: false },
            locallyModified: true,
        });
    }

    await enqueueOperation({
        type: 'UNPIN_NOTE',
        resourceType: 'note',
        resourceId: id,
        payload: {},
    });
};

export const archiveNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        await updateCachedNote(id, {
            data: { ...cached.data, is_archived: true },
            locallyModified: true,
        });
    }

    await enqueueOperation({
        type: 'ARCHIVE_NOTE',
        resourceType: 'note',
        resourceId: id,
        payload: {},
    });
};

export const unarchiveNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        await updateCachedNote(id, {
            data: { ...cached.data, is_archived: false },
            locallyModified: true,
        });
    }

    await enqueueOperation({
        type: 'UNARCHIVE_NOTE',
        resourceType: 'note',
        resourceId: id,
        payload: {},
    });
};

export const restoreNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        await updateCachedNote(id, {
            data: { ...cached.data, is_deleted: false },
            locallyModified: true,
        });
        console.log('♻️ Note restored locally:', id);
    }

    await enqueueOperation({
        type: 'RESTORE_NOTE',
        resourceType: 'note',
        resourceId: id,
        payload: {},
    });
};

// Image operations
export const uploadImage = async (noteId: string | number, imageFile: File): Promise<void> => {
    const cached = await getCachedNoteById(noteId);
    if (cached) {
        const imageUrl = URL.createObjectURL(imageFile);
        const newImage = {
            id: `temp_${Date.now()}`,
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };
        const updatedImages = [...(cached.data.images || []), newImage];
        await updateCachedNote(noteId, {
            data: { ...cached.data, images: updatedImages },
            locallyModified: true
        });
    }

    await enqueueOperation({
        type: 'UPLOAD_IMAGE',
        resourceType: 'image',
        resourceId: noteId,
        payload: { noteId, imageFile },
    });
};

// Label operations
export const attachLabel = async (noteId: string | number, labelId: number): Promise<void> => {
    await enqueueOperation({
        type: 'ATTACH_LABEL',
        resourceType: 'label',
        resourceId: noteId,
        payload: { noteId, labelId },
    });
};

export const detachLabel = async (noteId: string | number, labelId: number): Promise<void> => {
    await enqueueOperation({
        type: 'DETACH_LABEL',
        resourceType: 'label',
        resourceId: noteId,
        payload: { noteId, labelId },
    });
};

// Checklist operations
export const createChecklistItem = async (
    noteId: string | number,
    payload: { text: string; is_completed: boolean }
): Promise<void> => {
    const resourceId = `temp_checklist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await enqueueOperation({
        type: 'CREATE_CHECKLIST',
        resourceType: 'checklist',
        resourceId: resourceId,
        payload: { noteId, ...payload },
    });
};

export const updateChecklistItem = async (
    itemId: number | string,
    payload: { text: string; is_completed: boolean }
): Promise<void> => {
    await enqueueOperation({
        type: 'UPDATE_CHECKLIST',
        resourceType: 'checklist',
        resourceId: itemId,
        payload: payload,
    });
};

export const deleteChecklistItem = async (itemId: number | string): Promise<void> => {
    await enqueueOperation({
        type: 'DELETE_CHECKLIST',
        resourceType: 'checklist',
        resourceId: itemId,
        payload: { itemId },
    });
};

// Reminder operations
export const createReminder = async (noteId: string | number, remind_at: string): Promise<void> => {
    const cached = await getCachedNoteById(noteId);
    if (cached) {
        await updateCachedNote(noteId, {
            data: { ...cached.data, reminder: { remind_at } },
            locallyModified: true,
        });
    }

    await enqueueOperation({
        type: 'CREATE_REMINDER',
        resourceType: 'reminder',
        resourceId: noteId,
        payload: { noteId, remind_at },
    });
};

export const deleteReminder = async (noteId: string | number, reminderId: number): Promise<void> => {
    const cached = await getCachedNoteById(noteId);
    if (cached) {
        await updateCachedNote(noteId, {
            data: { ...cached.data, reminder: null },
            locallyModified: true,
        });
    }

    await enqueueOperation({
        type: 'DELETE_REMINDER',
        resourceType: 'reminder',
        resourceId: reminderId,
        payload: { reminderId },
    });
};
