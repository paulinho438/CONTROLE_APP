import CrudService from './CrudService';

export default class EntradaService extends CrudService {
    constructor() {
        super('/entradas');
    }
}

