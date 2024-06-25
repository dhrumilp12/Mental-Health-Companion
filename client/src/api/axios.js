import axios from 'axios';

const apiServerAxios = axios.create({
    baseURL: import.meta.env.VITE_AXIOS_BASE_URL,
});

export default apiServerAxios;