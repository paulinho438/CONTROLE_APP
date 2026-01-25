import axios from 'axios';

export default class CrudService {
	constructor(domain) {
		this.domain = domain;
	}

	getAll = async () => {
		return await axios.get(`${this.domain}`);
	};

	get = async (id) => {
		return await axios.get(`${this.domain}/${id}`);
	};

	save = async (data) => {
		if (data.id === undefined || data.id === null) {
			// Remove id do payload se for null ou undefined
			const { id, ...payload } = data;
			return await this.insert(payload);
		}
		return await this.update(data, data.id);
	};

	insert = async (data) => {
		return await axios.post(`${this.domain}`, data);
	};

	update = async (data, id) => {
		return await axios.put(`${this.domain}/${id}`, data);
	};

	delete = async (id) => {
		return await axios.delete(`${this.domain}/${id}`);
	};
}
