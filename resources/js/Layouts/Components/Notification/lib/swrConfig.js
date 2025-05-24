import axios from 'axios';

// Enhanced fetcher function with proper error handling
export const fetcher = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        // Handle authentication errors
        if (error.response?.status === 401) {
            // You might want to trigger a re-login or refresh token
            window.location.href = '/login';
        }

        // Handle other errors gracefully
        console.error('API Error:', error.response?.data || error.message);
        throw error;
    }
};

// Enhanced SWR configuration that works with your theme
export const swrConfig = {
    fetcher,
    refreshInterval: 60000, // Check every minute
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error, key) => {
        console.error('SWR Error for', key, ':', error);

        // Optional: Show error notification using notistack
        if (window.enqueueSnackbar) {
            window.enqueueSnackbar('Failed to load notifications', {
                variant: 'error',
                autoHideDuration: 3000
            });
        }
    },
    onSuccess: (data, key) => {
        // Optional: Log successful requests in development
        if (process.env.NODE_ENV === 'development') {
            console.log('SWR Success for', key, ':', data);
        }
    }
};
