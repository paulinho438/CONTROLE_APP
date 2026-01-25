import CrudService from './CrudService';

export default class FornecedorService extends CrudService {
    constructor() {
        super('/fornecedores');
    }
}
