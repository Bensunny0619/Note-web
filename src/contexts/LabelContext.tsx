import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

type Label = {
    id: number;
    name: string;
    created_at: string;
};

type LabelContextType = {
    labels: Label[];
    loading: boolean;
    fetchLabels: () => Promise<void>;
    createLabel: (name: string) => Promise<void>;
    updateLabel: (id: number, name: string) => Promise<void>;
    deleteLabel: (id: number) => Promise<void>;
};

const LabelContext = createContext<LabelContextType>({
    labels: [],
    loading: false,
    fetchLabels: async () => { },
    createLabel: async () => { },
    updateLabel: async () => { },
    deleteLabel: async () => { },
});

export const LabelProvider = ({ children }: { children: ReactNode }) => {
    const [labels, setLabels] = useState<Label[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLabels = async () => {
        try {
            setLoading(true);
            const response = await api.get('/labels');
            setLabels(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch labels:', error);
        } finally {
            setLoading(false);
        }
    };

    const createLabel = async (name: string) => {
        try {
            const response = await api.post('/labels', { name });
            setLabels([...labels, response.data]);
        } catch (error) {
            console.error('Failed to create label:', error);
            throw error;
        }
    };

    const updateLabel = async (id: number, name: string) => {
        try {
            await api.put(`/labels/${id}`, { name });
            setLabels(labels.map(l => l.id === id ? { ...l, name } : l));
        } catch (error) {
            console.error('Failed to update label:', error);
            throw error;
        }
    };

    const deleteLabel = async (id: number) => {
        try {
            await api.delete(`/labels/${id}`);
            setLabels(labels.filter(l => l.id !== id));
        } catch (error) {
            console.error('Failed to delete label:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchLabels();
    }, []);

    return (
        <LabelContext.Provider value={{ labels, loading, fetchLabels, createLabel, updateLabel, deleteLabel }}>
            {children}
        </LabelContext.Provider>
    );
};

export const useLabels = () => useContext(LabelContext);
