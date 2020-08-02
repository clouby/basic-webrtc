const socket = io('/');
const peer = new Peer(undefined, {
	host: '/',
	port: '3001'
});

const videoGrid = document.getElementById('video-grid');
const myScreen = document.createElement('video');

myScreen.muted = false;

peers = {};

function addVideoStream(video, stream) {
	video.srcObject = stream;
	video.addEventListener('loadedmetadata', () => {
		video.play();
	});

	videoGrid.appendChild(video);
}

function connectToNewUser(userId, stream) {
	const call = peer.call(userId, stream);
	const nextVideo = document.createElement('video');
	call.on('stream', (stream) => {
		addVideoStream(nextVideo, stream);
	});

	call.on('close', () => {
		nextVideo.remove();
	});

	peers[userId] = call;
}

navigator.mediaDevices
	.getUserMedia({
		video: true,
		audio: false
	})
	.then((stream) => {
		addVideoStream(myScreen, stream);

		peer.on('call', (call) => {
			call.answer(stream);
			const nextVideo = document.createElement('video');
			call.on('stream', (stream) => {
				addVideoStream(nextVideo, stream);
			});
		});

		socket.on('user-connected', (userId) => {
			connectToNewUser(userId, stream);
		});
	});

peer.on('open', (id) => {
	socket.emit('join-room', ROOM_ID, id);
});

socket.on('user-disconnected', (userId) => {
	console.log('User disconnected: ' + userId);
	if (peers[userId]) peers[userId].close();
});
