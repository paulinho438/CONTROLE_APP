import CrudService from './CrudService';

export default class GrupoService extends CrudService {
    constructor() {
        super('/grupos');
    }
}

