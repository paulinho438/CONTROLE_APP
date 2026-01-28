import CrudService from './CrudService';
import axios from 'axios';

export default class SaidaService extends CrudService {
    constructor() {
        super('/saidas');
    }

    getRomaneio = async (numeroRomaneio) => {
        return await axios.get(`${this.domain}/romaneio`, { 
            params: { numero_romaneio: numeroRomaneio } 
        });
    }
}

