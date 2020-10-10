 navigator.getUserMedia(
   { video: true, audio: true },
   (stream) => {
     const localVideo = document.getElementById("local-video");
     if (localVideo) {
       localVideo.srcObject = stream;
     }
   },
   (error) => {
     console.warn(error.message);
   }
 );

var socket = io();

socket.on("update-user-list", ({ users }) => {
  updateUserList(users);
  console.log("hello workd");
});

socket.on("remove-user", ({ socketId }) => {
  const elToRemove = document.getElementById(socketId);
  console.log("remove user");
  if (elToRemove) {
    elToRemove.remove();
  }
});

function updateUserList(socketIds) {
  const activeUserContainer = document.getElementById("active-user-container");

  socketIds.forEach((socketId) => {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser) {
      const userContainerEl = createUserItemContainer(socketId);
      activeUserContainer.appendChild(userContainerEl);
    }
  });
}

function createUserItemContainer(socketId) {
  const userContainerEl = document.createElement("div");

  const usernameEl = document.createElement("p");

  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", socketId);
  usernameEl.setAttribute("class", "username");
  usernameEl.innerHTML = `Socket: ${socketId}`;

  userContainerEl.appendChild(usernameEl);

  userContainerEl.addEventListener("click", () => {
    //unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    const talkingWithInfo = document.getElementById("talking-with-info");
    talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
    callUser(socketId);
  });
  return userContainerEl;
}

const { RTCPeerConnection, RTCSessionDescription } = window;
var peerConnection = new RTCPeerConnection({
  iceServers: [     // Information about ICE servers - Use your own!
    { urls: 'stun:stun.l.google.com:19302' },
   // { urls: 'stun:stun1.l.google.com:19302' },
  //  { urls: 'stun:stun2.l.google.com:19302' },
   // { urls: 'stun:stun3.l.google.com:19302' },
   // { urls: 'stun:stun4.l.google.com:19302' }
  ]
});

function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit("new-ice-candidate", {
      target: targetUsername,
      candidate: event.candidate,
    });
  }
}

function handleTrackEvent(event) {
  document.getElementById("remote-video").srcObject = event.streams[0];
}

peerConnection.onicecandidate = handleICECandidateEvent;
peerConnection.ontrack = handleTrackEvent;
//peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;

async function callUser(socketId) {
  //RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

  socket.emit("call-user", {
    offer: peerConnection.localDescription,
    to: socketId,
  });
}

socket.on("call-made", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );

  localVideo.getTracks().forEach(track => myPeerConnection.addTrack(track, localStream));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit("make-answer", {
    answer: peerConnection.localDescription,
    to: data.socket,
  });
});

let isAlreadyCalling = false;

socket.on("answer-made", async data => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
  console.log("answer made1");
  if (!isAlreadyCalling) {
    //callUser(data.socket);
    isAlreadyCalling = true;
  }

  console.log("answer made");

});
