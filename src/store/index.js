import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';

const store = createStore({
	state() {
		return {
			isAutenticated: false,
			usuario: null,
			permissions: []
		};
	},
	mutations: {
		setAuthenticated(state, value) {
			state.isAutenticated = Boolean(value);
		},
		setUsuario(state, usuario){
			state.usuario = usuario;
		},
		setPermissions(state, newPermissions){
			state.permissions = newPermissions;
		}
		
	},
	actions: {
		// Adicione uma ação que executa a função e retorna true ou false
		hasPermissions(context, payload) {
			return context.state.permissions.includes(payload)
		},
	},
	getters: {
		isAutenticated(state) {
			return state.isAutenticated;
		},
		permissions(state) {
			return state.permissions;
		},
		usuario(state) {
			return state.usuario;
		}
	},
  	plugins: [createPersistedState()],
});

export default store;
