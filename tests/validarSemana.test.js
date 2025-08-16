const request = require('supertest');
const { expect } = require('chai');
require('dotenv').config();

describe('GET /gym/validar-semana/{weekOffSet}', () => {
	let token;

	before(async () => {
		const loginResponse = await request(process.env.BASE_URL)
			.post('/api/auth/login')
			.set('Content-Type', 'application/json')
			.send({
				email: 'maria@example.com',
				password: 'senha123',
			});
		token = loginResponse.body.token;
	});

	it('Deve retornar 201 quando validar que um aluno de nível 1 tem semana bem-sucedida', async () => {
		const weekOffSet = 1;

		const resposta = await request(process.env.BASE_URL)
			.get(`/api/gym/validar-semana/${weekOffSet}`)
			.set('Authorization', `Bearer ${token}`);
		expect(resposta.status).to.equal(201);
		expect(resposta.body.success).to.equal(true);
		expect(resposta.body.message).to.equal('Pontos adicionados.');
	});
});
