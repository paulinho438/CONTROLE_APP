import CrudService from './CrudService';

export default class PatioService extends CrudService {
    constructor() {
        super('/patios');
    }
}

