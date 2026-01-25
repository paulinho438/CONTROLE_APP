import axios from 'axios';

export default class AuthService {
	login = async (data) => {
		return await axios.post('/auth/login', data);
	};

	logout = async () => {
		return await axios.post('/auth/logout');
	};

	validate = async () => {
		return await axios.post('/auth/validate');
	};
}
