import CrudService from './CrudService';

const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class UserService extends CrudService {
	constructor() {
		super(`${apiPath}/users`);
	}
}
