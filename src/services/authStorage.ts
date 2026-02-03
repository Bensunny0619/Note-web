// Web-compatible auth storage using localStorage
const authStorage = {
    async getItem(key: string): Promise<string | null> {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    async setItem(key: string, value: string): Promise<void> {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    },

    async deleteItem(key: string): Promise<void> {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error deleting from localStorage:', error);
        }
    },
};

export default authStorage;
