import axios from 'axios';

export default class DashboardService {
    resumoGeral = async () => {
        return await axios.get('/dashboard/resumo-geral');
    };

    resumoEstoque = async (params = {}) => {
        return await axios.get('/dashboard/resumo-estoque', { params });
    };
}
