import CrudService from './CrudService';

export default class MaterialService extends CrudService {
    constructor() {
        super('/materiais');
    }
}

