import axios from 'axios';
import router from '../router';
import store from '@/store';

const baseURL = import.meta.env.VITE_APP_BASE_URL;

axios.defaults.baseURL = baseURL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

axios.interceptors.request.use(
  (config) => {
    // ✅ Blindagem total (evita null/undefined)
    config = config || {};
    config.headers = config.headers || {};

    // Token
    const token = localStorage.getItem('app.emp.token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Se for FormData, remover Content-Type para o browser setar boundary
    if (config.data instanceof FormData) {
      // headers pode ser objeto simples, então remove direto
      if (config.headers && typeof config.headers === 'object') {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }

      // ✅ Esses sub-objetos podem NÃO existir (aqui era seu crash)
      if (config.headers?.common) {
        delete config.headers.common['Content-Type'];
        delete config.headers.common['content-type'];
      }
      if (config.headers?.post) {
        delete config.headers.post['Content-Type'];
        delete config.headers.post['content-type'];
      }
      if (config.headers?.put) {
        delete config.headers.put['Content-Type'];
        delete config.headers.put['content-type'];
      }
      if (config.headers?.patch) {
        delete config.headers.patch['Content-Type'];
        delete config.headers.patch['content-type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      if (router?.currentRoute?.value?.name !== 'login') {
        if (localStorage.getItem('app.emp.token')) {
          localStorage.removeItem('app.emp.token');
          router.push({ name: 'login' });
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
