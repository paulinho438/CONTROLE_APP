import CrudService from './CrudService';

export default class NotaFiscalService extends CrudService {
    constructor() {
        super('/notas-fiscais');
    }
}

