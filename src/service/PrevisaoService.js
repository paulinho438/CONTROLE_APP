import CrudService from './CrudService';

export default class PrevisaoService extends CrudService {
    constructor() {
        super('/previsoes');
    }
}

