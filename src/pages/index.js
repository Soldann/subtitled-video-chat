 navigator.mediaDevices.getUserMedia(
   { video: true, audio: true }).then(
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

var targetSocket = null;
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
    targetSocket = socketId;
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
/*
  // When receiving a candidate over the socket, turn it back into a real
  // RTCIceCandidate and add it to the peerConnection.
function (candidate) {
    // Update caption text
    captionText.text("Found other user... connecting");
    rtcCandidate = new RTCIceCandidate(candidate.candidate);
    logIt(
      `onCandidate <<< Received remote ICE candidate (${rtcCandidate.address} - ${rtcCandidate.relatedAddress})`
    );
    peerConnection.addIceCandidate(rtcCandidate);
  },
*/
function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit("new-ice-candidate", {
      target: targetSocket,
      candidate: event.candidate,
    });
  }
}

var debugStreams = null;
function handleTrackEvent(event) {
  debugStreams = event.streams;
  console.log("recieved a new stream");
  document.getElementById("remote-video").srcObject = event.streams[0];
}

function handleNegotiationNeededEvent() {
  console.log("creating negotiation")
  peerConnection.createOffer().then(function(offer) {
    return peerConnection.setLocalDescription(offer);
  })
  .then(function() {
    socket.emit("call-user", {
      offer: peerConnection.localDescription,
      to: targetSocket,
    });
  })
  .catch();
}

peerConnection.onicecandidate = handleICECandidateEvent;
peerConnection.ontrack = handleTrackEvent;
peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;

async function callUser(socketId) {
  //RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  
  /*
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer)); */

  var localStream = document.getElementById("local-video").srcObject;
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
}

socket.on("call-made", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );

  var localStream = document.getElementById("local-video").srcObject;  // stream.getVideoTracks()[0];
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

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

socket.on("send-ice-candidate", async data => {
  peerConnection.addIceCandidate(data.candidate);
});
