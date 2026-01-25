import CrudService from './CrudService';

export default class SaidaService extends CrudService {
    constructor() {
        super('/saidas');
    }
}

