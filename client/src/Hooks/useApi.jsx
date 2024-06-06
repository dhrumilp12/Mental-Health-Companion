import { useState } from 'react';
import axiosInstance from '../Utils/axiosInstance';

const useApi = (url) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const execute = async (payload) => {
        setLoading(true);
        try {
            const response = await axiosInstance.post(url, payload);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError(err);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    return { execute, data, error, loading };
};

export default useApi;
