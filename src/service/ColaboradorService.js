import CrudService from './CrudService';

export default class ColaboradorService extends CrudService {
    constructor() {
        super('/colaboradores');
    }
}

