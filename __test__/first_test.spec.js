const supertest = require('supertest');
const app = require('../server');

describe("testing mongodb interaction", () => {
	it("testing....", () => {
		expect(69).toBe(69);
	});

	it("testing add server", async () => {
		const response = await supertest(app).post('/addserver').send({
			name: 'twitter api',
			slug: 'twitter'
		});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Success!!');
	});

	it("testing add query_history", async () => {
		const response = await supertest(app).post('/addqueryhistory').send({
			name: 'twitter api',
			slug: 'twitter'
		});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Success!!');
	});

	it("testing add user", async () => {
		const response = await supertest(app).post('/adduser').send({
			name: 'twitter api',
			slug: 'twitter'
		});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Success!!');
	});

	it("testing update user", async () => {
		const response = await supertest(app).put('/updateuser?toUpdate=User1').send({
			name: 'twitter api',
			slug: 'twitter'
		});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Updated!!');
	});

	it("testing update server", async () => {
		const response = await supertest(app).put('/updateserver?toUpdate=test1').send({
			name: 'twitter api',
			slug: 'twitter'
		});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Updated!!');
	});



});


describe("testing mysql interaction", () => {

	it("testing get all migrations", async () => {
		const response = await supertest(app).get('/getallmigrations').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(34);
	});

	it("testing get migration", async () => {
		const response = await supertest(app).get('/getmigration?id=7').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(1);
	});

	it("testing get all runs", async () => {
		const response = await supertest(app).get('/getruns').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});

	it("testing get all authorizations", async () => {
		const response = await supertest(app).get('/getallauthorizations').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(1);
	});

	it("testing get authorization", async () => {
		const response = await supertest(app).get('/getauthorization?serverId=1').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(1);
	});

	it("testing get all applications", async () => {
		const response = await supertest(app).get('/getallapplications').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});

	it("testing get all failed jobs", async () => {
		const response = await supertest(app).get('/getallfailedjobs').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});

	it("testing get all interested parties", async () => {
		const response = await supertest(app).get('/getallinterestedparties').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});

	it("testing get all jobs", async () => {
		const response = await supertest(app).get('/getalljobs').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});

	it("testing get all stages", async () => {
		const response = await supertest(app).get('/getallstages').send();

		expect(response.status).toBe(200);
		expect(response.body.length).toBe(0);
	});


});