import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useFormStore = create(
    persist(
        (set, get) => ({
            forms: {},
            setFormData: (key, data) => set((state) => ({
                forms: { ...state.forms, [key]: data }
            })),
            clearFormData: (key) => set((state) => {
                const newForms = { ...state.forms };
                delete newForms[key];
                return { forms: newForms };
            }),
            getFormData: (key, initialData) => {
                const state = get();
                return state.forms[key] || initialData;
            }
        }),
        {
            name: 'form-persistence',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
