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

export { getSyncQueue };

let isOnlineGlobal = true;

export const setGlobalOnlineStatus = (online: boolean) => {
    isOnlineGlobal = online;
    if (online) {
        processSyncQueue();
    }
};

const fileToDataURL = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

// Notes API
export const getNotes = async (searchQuery?: string, labelId?: number, includeArchived?: boolean, includeDeleted?: boolean): Promise<any[]> => {
    if (isOnlineGlobal) {
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (labelId) params.label_id = labelId;
            if (includeArchived) params.include_archived = 'true';
            if (includeDeleted) params.include_deleted = 'true';

            const response = await api.get('/notes', { params });
            const notes = response.data.data || response.data;

            console.log(`🌐 Fetched ${notes.length} notes from server (archived: ${includeArchived}, deleted: ${includeDeleted})`);

            const currentCached = await getCachedNotes();
            const syncQueue = await getSyncQueue();
            const pendingResourceIds = new Set(syncQueue.map(op => op.resourceId));

            const serverNotesMapped: CachedNote[] = notes.map((note: any) => ({
                id: note.id,
                data: note,
                locallyModified: false,
                lastSyncedAt: new Date().toISOString(),
            }));

            // Use a Map for efficient deduplication and merging
            const mergedMap = new Map<string | number, CachedNote>();

            // 1. Start with server notes
            serverNotesMapped.forEach(sn => mergedMap.set(sn.id, sn));

            // 2. Merge local modifications and preserve notes not requested in this fetch
            // (e.g., if we didn't ask for archived notes, don't delete them from cache)
            currentCached.forEach(localNote => {
                const isRequestedInFetch = (includeArchived && localNote.data.is_archived) ||
                    (includeDeleted && localNote.data.is_deleted) ||
                    (!localNote.data.is_archived && !localNote.data.is_deleted);

                let serverMatch = mergedMap.get(localNote.id);
                const isPending = pendingResourceIds.has(localNote.id);

                // Grace period: if synced in last 60s, don't purge even if missing from server
                const syncGracePeriod = 60 * 1000;
                const isRecentlySynced = localNote.lastSyncedAt &&
                    (Date.now() - new Date(localNote.lastSyncedAt).getTime() < syncGracePeriod);

                // If it's locally modified OR we didn't specifically ask for this type of note, 
                // OR it was just synced (grace period), keep it
                if (localNote.locallyModified || isPending || !isRequestedInFetch || isRecentlySynced) {
                    if (!serverMatch) {
                        for (const [, sn] of mergedMap.entries()) {
                            if (sn.data.title === localNote.data.title &&
                                sn.data.content === localNote.data.content) {
                                serverMatch = sn;
                                break;
                            }
                        }
                    }

                    if (serverMatch) {
                        // Enrich server note with local modifications
                        const enrichedData = {
                            ...serverMatch.data,
                            ...localNote.data,
                            updated_at: localNote.data.updated_at || serverMatch.data.updated_at
                        };

                        if (localNote.data.checklist_items?.length > 0) enrichedData.checklist_items = localNote.data.checklist_items;
                        if (localNote.data.drawings?.length > 0) enrichedData.drawings = localNote.data.drawings;
                        if (localNote.data.images?.length > 0) enrichedData.images = localNote.data.images;

                        const localAudio = localNote.data.audio_recordings || localNote.data.audioRecordings || [];
                        if (localAudio.length > 0) enrichedData.audio_recordings = localAudio;

                        if (localNote.data.reminder) enrichedData.reminder = localNote.data.reminder;
                        if (localNote.data.reminder_at) enrichedData.reminder_at = localNote.data.reminder_at;

                        mergedMap.set(serverMatch.id, {
                            ...serverMatch,
                            data: enrichedData,
                            locallyModified: localNote.locallyModified || isPending,
                            lastSyncedAt: serverMatch.lastSyncedAt || localNote.lastSyncedAt
                        });
                    } else {
                        // If it's not on server yet (or missing), but we want to keep it
                        mergedMap.set(localNote.id, localNote);
                    }
                }
            });

            const mergedNotes = Array.from(mergedMap.values());
            mergedNotes.sort((a, b) => {
                if (a.data.is_pinned && !b.data.is_pinned) return -1;
                if (!a.data.is_pinned && b.data.is_pinned) return 1;
                return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime();
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
    return cached.map(c => c.data);
};

// Helper functions to get archived and deleted notes from cache
// These bypass server sync to preserve archived/deleted notes
export const getArchivedNotes = async (): Promise<any[]> => {
    const cached = await getCachedNotes();
    const archivedNotes = cached
        .map(c => c.data)
        .filter(note => note.is_archived && !note.is_deleted);
    console.log('📦 [Cache] Found', archivedNotes.length, 'archived notes in cache');
    return archivedNotes;
};

export const getDeletedNotes = async (): Promise<any[]> => {
    const cached = await getCachedNotes();
    const deletedNotes = cached
        .map(c => c.data)
        .filter(note => note.is_deleted);
    console.log('🗑️ [Cache] Found', deletedNotes.length, 'deleted notes in cache');
    return deletedNotes;
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
        labels: payload.labels || [],
        images: payload.images || [],
        audio_recordings: payload.audio_recordings || (payload.audio_uri ? [{ id: `temp_audio_${Date.now()}`, audio_url: payload.audio_uri }] : []),
        drawings: payload.drawings || (payload.drawing_uri ? [{ id: `temp_drawing_${Date.now()}`, drawing_url: payload.drawing_uri }] : []),
        checklist_items: (payload.checklist_items || []).map((item: any) => ({
            ...item,
            id: item.id || `temp_check_${Date.now()}_${Math.random()}`
        })),
        reminder: payload.reminder_at ? { remind_at: payload.reminder_at } : null,
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
    const { audio_uri, drawing_uri, ...noteData } = payload;

    const cached = await getCachedNoteById(id);
    if (cached) {
        const updatedData = {
            ...cached.data,
            ...noteData,
            // Normalize reminder for immediate UI feedback
            reminder: noteData.reminder_at ? { remind_at: noteData.reminder_at } : noteData.reminder || cached.data.reminder,
            // Only update media in cache if provided
            ...(audio_uri ? { audio_recordings: [{ id: `temp_audio_${Date.now()}`, audio_url: audio_uri }] } : {}),
            ...(drawing_uri ? { drawings: [{ id: `temp_drawing_${Date.now()}`, drawing_url: drawing_uri }] } : {}),
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
        payload: noteData,
    });

    if (audio_uri && audio_uri.startsWith('data:')) {
        await enqueueOperation({
            type: 'CREATE_AUDIO',
            resourceType: 'audio',
            resourceId: id,
            payload: { noteId: id, audioFile: { uri: audio_uri } },
        });
    }

    if (drawing_uri && drawing_uri.startsWith('data:')) {
        await enqueueOperation({
            type: 'CREATE_DRAWING',
            resourceType: 'drawing',
            resourceId: id,
            payload: { noteId: id, drawing_uri },
        });
    }

    processSyncQueue();
    return cached?.data;
};

export const deleteNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (!cached) {
        console.error('❌ [Delete] Failed: Note not found in cache. ID:', id, 'Type:', typeof id);
        return;
    }

    // 1. Mark as deleted locally for immediate UI response
    await updateCachedNote(id, {
        data: { ...cached.data, is_deleted: true },
        locallyModified: true,
    });
    console.log('🗑️ Note soft-deleted locally:', id);
    console.log('📦 Current note state in cache:', cached.data);

    const idStr = id.toString();
    if (idStr.startsWith('offline_')) {
        // If it's an offline note, just purge it from everywhere
        await permanentlyDeleteNote(id);
    } else {
        // Enqueue a DELETE operation for the server
        await enqueueOperation({
            type: 'DELETE',
            resourceType: 'note',
            resourceId: id,
            payload: {},
        });
        processSyncQueue();
    }
};

export const bulkDeleteNotes = async (ids: (string | number)[]): Promise<void> => {
    console.log(`🗑️ Bulk deleting ${ids.length} notes...`);
    for (const id of ids) {
        await deleteNote(id);
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
        console.log('📌 Note pinned locally:', id);
    } else {
        console.warn('⚠️ [Pin] Note not found in cache:', id);
    }

    await enqueueOperation({
        type: 'PIN_NOTE',
        resourceType: 'note',
        resourceId: id,
        payload: {},
    });
    processSyncQueue();
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
    processSyncQueue();
};

export const archiveNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        await updateCachedNote(id, {
            data: { ...cached.data, is_archived: true },
            locallyModified: true,
        });
        console.log('📦 Note archived locally:', id);
    } else {
        console.warn('⚠️ [Archive] Note not found in cache:', id);
    }

    await enqueueOperation({
        type: 'ARCHIVE_NOTE',
        resourceType: 'note',
        resourceId: id,
        payload: {},
    });
    processSyncQueue();
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
    processSyncQueue();
};

export const restoreNote = async (id: string | number): Promise<void> => {
    const cached = await getCachedNoteById(id);
    if (cached) {
        await updateCachedNote(id, {
            data: { ...cached.data, is_deleted: false, is_archived: false },
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
    processSyncQueue();
};

// Image operations
export const uploadImage = async (noteId: string | number, imageFile: File): Promise<void> => {
    let finalFile = imageFile;

    // Attempt compression for performance
    try {
        if (imageFile.type.startsWith('image/') && imageFile.size > 500 * 1024) {
            console.log(`🖼️ Compressing image: ${(imageFile.size / 1024).toFixed(1)}KB...`);
            finalFile = await compressImage(imageFile);
            console.log(`✅ Compressed to: ${(finalFile.size / 1024).toFixed(1)}KB`);
        }
    } catch (e) {
        console.warn('⚠️ Compression failed, uploading original:', e);
    }

    const cached = await getCachedNoteById(noteId);
    if (cached) {
        try {
            const base64Data = await fileToDataURL(finalFile);
            const newImage = {
                id: `temp_${Date.now()}`,
                image_url: base64Data,
                created_at: new Date().toISOString()
            };
            const updatedImages = [...(cached.data.images || []), newImage];
            await updateCachedNote(noteId, {
                data: { ...cached.data, images: updatedImages },
                locallyModified: true
            });
        } catch (err) {
            console.error('Failed to convert image to base64 for cache:', err);
        }
    }

    await enqueueOperation({
        type: 'UPLOAD_IMAGE',
        resourceType: 'image',
        resourceId: noteId,
        payload: { noteId, imageFile: finalFile },
    });

    processSyncQueue();
};

// Label operations
export const attachLabel = async (noteId: string | number, labelId: number): Promise<void> => {
    await enqueueOperation({
        type: 'ATTACH_LABEL',
        resourceType: 'label',
        resourceId: noteId,
        payload: { noteId, labelId },
    });
    processSyncQueue();
};

export const detachLabel = async (noteId: string | number, labelId: number): Promise<void> => {
    await enqueueOperation({
        type: 'DETACH_LABEL',
        resourceType: 'label',
        resourceId: noteId,
        payload: { noteId, labelId },
    });
    processSyncQueue();
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
    processSyncQueue();
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
    processSyncQueue();
};

export const deleteChecklistItem = async (itemId: number | string): Promise<void> => {
    await enqueueOperation({
        type: 'DELETE_CHECKLIST',
        resourceType: 'checklist',
        resourceId: itemId,
        payload: { itemId },
    });
    processSyncQueue();
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

// Sync Processor
let isSyncing = false;

export const processSyncQueue = async () => {
    if (!isOnlineGlobal || isSyncing) return;

    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    isSyncing = true;
    console.log(`🚀 [Sync] Batch processing ${queue.length} operations concurrently...`);

    const currentQueue = [...queue];
    const completedIds = new Set<number>();

    // 1. Group operations by resource to maintain internal order per resource
    const groups: { [key: string]: typeof currentQueue } = {};
    currentQueue.forEach(op => {
        const key = op.resourceId?.toString() || 'global';
        if (!groups[key]) groups[key] = [];
        groups[key].push(op);
    });

    // 2. Process each group in parallel, but operations WITHIN a group sequentially.
    await Promise.all(Object.values(groups).map(async (groupOps) => {
        for (const op of groupOps) {
            // Skip if this operation was already updated/marked by another stream (ID propagation)
            // or if it depends on a previous operation in this group that failed.
            try {
                let success = false;
                console.log(`📡 [Sync] Stream processing ${op.type} for ${op.resourceId}`);

                // Helper to update note cache safely without losing metadata if the response is partial
                const safeUpdateNoteCache = async (noteId: string | number, serverResponse: any) => {
                    if (!serverResponse) return;

                    // If it's a full note (has content or checklist_items or drawings), update it fully
                    if (serverResponse.id && (serverResponse.checklist_items || serverResponse.checklistItems || serverResponse.drawings || serverResponse.images)) {
                        await updateCachedNote(noteId, { data: serverResponse });
                    } else {
                        // It's a partial response (just the attachment object)
                        // Fetch the full note to ensure cache integrity
                        try {
                            const fullNoteRes = await api.get(`/notes/${noteId}`);
                            const fullNote = fullNoteRes.data.data || fullNoteRes.data;
                            if (fullNote) await updateCachedNote(noteId, { data: fullNote });
                        } catch (err) {
                            console.warn(`⚠️ [Sync] Failed to re-fetch full note ${noteId} after partial response:`, err);
                        }
                    }
                };

                switch (op.type) {
                    case 'CREATE': {
                        const createRes = await api.post('/notes', {
                            ...op.payload,
                            client_id: op.resourceId
                        });
                        const serverNote = createRes.data.data || createRes.data;
                        const oldId = op.resourceId;
                        const newId = serverNote.id;

                        console.log(`🆔 [Sync] Note created! Mapped ${oldId} -> ${newId}`);

                        // Backend ignores checklist_items on note create, so we must send them separately
                        if (op.payload.checklist_items && op.payload.checklist_items.length > 0) {
                            console.log(`📋 [Sync] Syncing ${op.payload.checklist_items.length} checklist items for new note ${newId}`);
                            for (const item of op.payload.checklist_items) {
                                try {
                                    await api.post(`/notes/${newId}/checklist`, item);
                                } catch (e) {
                                    console.warn(`⚠️ [Sync] Failed to sync checklist item for note ${newId}:`, e);
                                }
                            }
                            // Re-fetch full note to get all server-side IDs for checklist items
                            const updatedNoteRes = await api.get(`/notes/${newId}`);
                            const updatedNote = updatedNoteRes.data.data || updatedNoteRes.data;
                            await addCachedNote({ id: newId, data: updatedNote, locallyModified: false });
                        } else {
                            await addCachedNote({ id: newId, data: serverNote, locallyModified: false });
                        }

                        await removeCachedNote(oldId);

                        // Sync reminder if present (Backend ignores reminder_at on note create)
                        if (op.payload.reminder_at) {
                            try {
                                await api.post(`/notes/${newId}/reminder`, { remind_at: op.payload.reminder_at });
                                // Re-fetch to get full reminder object
                                const refreshed = await api.get(`/notes/${newId}`);
                                await addCachedNote({ id: newId, data: refreshed.data.data || refreshed.data, locallyModified: false });
                            } catch (e) {
                                console.warn(`⚠️ [Sync] Failed to sync reminder for new note ${newId}:`, e);
                            }
                        }

                        // Propagate ID change to ALL other operations in the queue immediately
                        currentQueue.forEach(otherOp => {
                            if (otherOp.resourceId === oldId) otherOp.resourceId = newId;
                            if (otherOp.payload?.noteId === oldId) otherOp.payload.noteId = newId;
                        });
                        success = true;
                        break;
                    }

                    case 'UPDATE': {
                        await api.put(`/notes/${op.resourceId}`, op.payload);
                        console.log(`📥 [Sync] Note ${op.resourceId} updated successfully.`);

                        // Sync reminder if it was part of the update
                        if (op.payload.reminder_at) {
                            try {
                                await api.post(`/notes/${op.resourceId}/reminder`, { remind_at: op.payload.reminder_at });
                            } catch (e) {
                                console.warn(`⚠️ [Sync] Failed to sync reminder update for note ${op.resourceId}:`, e);
                            }
                        }

                        // Re-fetch to ensure cache is 100% in sync with server relations
                        const refreshed = await api.get(`/notes/${op.resourceId}`);
                        await updateCachedNote(op.resourceId, { data: refreshed.data.data || refreshed.data, locallyModified: false });

                        success = true;
                        break;
                    }

                    case 'DELETE':
                        await api.delete(`/notes/${op.resourceId}`);
                        success = true;
                        break;

                    case 'PIN_NOTE':
                        console.log(`📤 [Sync] Pinning note ${op.resourceId}...`);
                        await api.put(`/notes/${op.resourceId}/pin`);
                        console.log(`📥 [Sync] Note ${op.resourceId} pinned successfully.`);
                        success = true;
                        break;

                    case 'UNPIN_NOTE':
                        console.log(`📤 [Sync] Unpinning note ${op.resourceId}...`);
                        await api.put(`/notes/${op.resourceId}/unpin`);
                        console.log(`📥 [Sync] Note ${op.resourceId} unpinned successfully.`);
                        success = true;
                        break;

                    case 'ARCHIVE_NOTE':
                        console.log(`📤 [Sync] Archiving note ${op.resourceId}...`);
                        await api.put(`/notes/${op.resourceId}/archive`);
                        console.log(`📥 [Sync] Note ${op.resourceId} archived successfully.`);
                        success = true;
                        break;

                    case 'UNARCHIVE_NOTE':
                        console.log(`📤 [Sync] Unarchiving note ${op.resourceId}...`);
                        await api.put(`/notes/${op.resourceId}/unarchive`);
                        console.log(`📥 [Sync] Note ${op.resourceId} unarchived successfully.`);
                        success = true;
                        break;

                    case 'UPLOAD_IMAGE': {
                        const formData = new FormData();
                        formData.append('image', op.payload.imageFile);
                        const res = await api.post(`/notes/${op.resourceId}/images`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        await safeUpdateNoteCache(op.resourceId, res.data.data || res.data);
                        success = true;
                        break;
                    }

                    case 'CREATE_AUDIO': {
                        const audioUri = op.payload.audioFile.uri;
                        const audioBlob = await fetch(audioUri).then(r => r.blob());
                        const audioFormData = new FormData();
                        audioFormData.append('audio', audioBlob, 'recording.wav');
                        const res = await api.post(`/notes/${op.resourceId}/audio`, audioFormData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        await safeUpdateNoteCache(op.resourceId, res.data.data || res.data);
                        success = true;
                        break;
                    }

                    case 'CREATE_DRAWING': {
                        const drawingUri = op.payload.drawing_uri;
                        const drawingBlob = await fetch(drawingUri).then(r => r.blob());
                        const drawingFormData = new FormData();
                        drawingFormData.append('drawing', drawingBlob, 'drawing.png');
                        const res = await api.post(`/notes/${op.resourceId}/drawings`, drawingFormData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        await safeUpdateNoteCache(op.resourceId, res.data.data || res.data);
                        success = true;
                        break;
                    }

                    case 'CREATE_REMINDER': {
                        const res = await api.post(`/notes/${op.payload.noteId}/reminder`, {
                            remind_at: op.payload.remind_at
                        });
                        const serverNote = res.data.data || res.data;
                        // If it returns a note, update. Some backends return just the reminder.
                        if (serverNote && serverNote.id) {
                            await updateCachedNote(op.payload.noteId, { data: serverNote });
                        }
                        success = true;
                        break;
                    }

                    case 'DELETE_REMINDER': {
                        await api.delete(`/reminders/${op.resourceId}`);
                        success = true;
                        break;
                    }

                    case 'RESTORE_NOTE':
                        console.log(`📤 [Sync] Restoring note ${op.resourceId}...`);
                        await api.post(`/notes/${op.resourceId}/restore`);
                        console.log(`📥 [Sync] Note ${op.resourceId} restored successfully.`);

                        // Re-fetch to ensure cache is 100% in sync with server status
                        try {
                            const refreshed = await api.get(`/notes/${op.resourceId}`);
                            const serverNote = refreshed.data.data || refreshed.data;
                            if (serverNote) await updateCachedNote(op.resourceId, { data: serverNote });
                        } catch (e: any) {
                            console.warn(`⚠️ [Sync] Restore successful but failed to refresh note ${op.resourceId}:`, e.message);
                        }

                        success = true;
                        break;

                    case 'ATTACH_LABEL':
                        await api.post(`/notes/${op.payload.noteId}/labels`, { label_id: op.payload.labelId });
                        success = true;
                        break;

                    case 'DETACH_LABEL':
                        await api.delete(`/notes/${op.payload.noteId}/labels/${op.payload.labelId}`);
                        success = true;
                        break;

                    case 'CREATE_CHECKLIST': {
                        await api.post(`/notes/${op.payload.noteId}/checklist`, {
                            text: op.payload.text,
                            is_checked: op.payload.is_checked
                        });
                        // Backend likely returns the new checklist item.
                        // However, we want the full updated note to keep IDs sync'd.
                        // Since we know the backend NoteController methods return full notes now
                        // (from my previous changes that stayed), we can try to find the note.
                        const serverNoteRes = await api.get(`/notes/${op.payload.noteId}`);
                        const serverNote = serverNoteRes.data.data || serverNoteRes.data;
                        if (serverNote) await updateCachedNote(op.payload.noteId, { data: serverNote });
                        success = true;
                        break;
                    }

                    case 'UPDATE_CHECKLIST':
                        await api.put(`/checklist/${op.resourceId}`, {
                            ...op.payload,
                            is_checked: op.payload.is_checked || op.payload.is_completed
                        });
                        success = true;
                        break;

                    case 'DELETE_CHECKLIST':
                        await api.delete(`/checklist/${op.resourceId}`);
                        success = true;
                        break;

                    default:
                        console.warn(`⚠️ [Sync] Unknown operation type: ${op.type}`);
                        success = true;
                }

                if (success) completedIds.add(op.id!);
            } catch (err: any) {
                const status = err.response?.status;
                const isPermanentError = [404, 405, 409, 410, 422].includes(status);

                if (isPermanentError) {
                    console.warn(`⚠️ [Sync] Permanent rejection for ${op.type} (${status}). Clearing operation.`);
                    completedIds.add(op.id!); // Mark as done to remove from queue
                } else {
                    console.error(`❌ [Sync] Retryable failure for ${op.type}:`, err.message);
                    break; // Stop THIS stream on network/5xx errors, but others keep going
                }
            }
        }
    }));

    if (completedIds.size > 0) {
        const finalQueue = currentQueue.filter(op => !completedIds.has(op.id!));

        // Final Cache Polish: mark notes as synced if no pending ops
        for (const op of currentQueue) {
            if (completedIds.has(op.id!) && op.resourceType === 'note') {
                const hasMore = finalQueue.some(o => o.resourceId === op.resourceId);
                if (!hasMore) {
                    await updateCachedNote(op.resourceId, {
                        locallyModified: false,
                        lastSyncedAt: new Date().toISOString()
                    });
                }
            }
        }

        await setSyncQueue(finalQueue);
        console.log(`✅ [Sync] Finished! Completed ${completedIds.size} operations. ${finalQueue.length} remaining.`);
    }

    isSyncing = false;
};

// Auto-sync interval
setInterval(() => {
    if (isOnlineGlobal) processSyncQueue();
}, 5000);
