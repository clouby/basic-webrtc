const app = require('fastify')({ logger: true });
const path = require('path');

const { v4: generateId } = require('uuid');

// Include middlewares
app.register(require('middie'));

// Include Socket.IO
app.register(require('@guivic/fastify-socket.io'));

// Include template engine
app.register(require('point-of-view'), {
	engine: {
		ejs: require('ejs')
	},
	root: path.join(__dirname, 'view')
});

// Include static path
app.register(require('fastify-static'), {
	root: path.join(__dirname, 'public'),
	list: true
});

app.get('/room', (_request, reply) => {
	return reply.redirect(`/room/${generateId()}`);
});

app.get('/room/:roomId', (request, reply) => {
	const { roomId } = request.params;
	return reply.view('/app.ejs', { roomId });
});

app.ready((_error) => {
	app.io.on('connection', (socket) => {
		socket.on('join-room', (roomId, userId) => {
			socket.join(roomId);
			socket.to(roomId).broadcast.emit('user-connected', userId);

			socket.on('disconnect', () => {
				socket.to(roomId).broadcast.emit('user-disconnected', userId);
			});
		});
	});
});

const start = async () => {
	try {
		await app.listen(3000, '0.0.0.0');
		app.log.info(`Server listening on ${app.server.address().port}`);
	} catch (error) {
		app.log.error(error);
		process.exit(1);
	}
};

start();
