var socket = io();

// voice recognition code
class RecognitionWrapper {
  constructor() {
    this.recognition = new webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.start();
    this.setRecognition(); // sets callback
    this.recognition.onend = event => {
      this.recognition.start();
    }

    socket.on("server-to-client-subtitles", data => {
      if (data.id == socket.id) {
        return;
      }

      document.getElementById("subtitle").innerHTML = data;  // probably need to preprocess or something idk
    });

  }

  setRecognition() {
    this.recognition.onresult = (event) => {  // when we receive new recognition, broadcast it to other sockets
      let subtitle = "";
      for (let result of event.results) {
          subtitle += result[0].transcript;
      }
      console.log(`Sending subtitles: ${subtitle}`);
      socket.emit("client-to-server-subtitles", {
        subtitle: subtitle,
        id: socket.id,
      });
    }
  }
}

const rw = new RecognitionWrapper();

// video streaming code

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
    { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
    { urls: 'turn:64.233.165.127:19305?transport=udp' },
    { urls: 'turn:[2A00:1450:4010:C01::7F]:19305?transport=udp'},
    { urls: 'turn:64.233.165.127:443?transport=tcp' },
    { urls: 'turn:[2A00:1450:4010:C01::7F]:443?transport=tcp'},
  //  { urls: 'stun:stun2.l.google.com:19302' },
   // { urls: 'stun:stun3.l.google.com:19302' },
   // { urls: 'stun:stun4.l.google.com:19302' }
  ]
});

function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit("new-ice-candidate", {
      target: targetSocket,
      candidate: event.candidate,
    });
  }
}

var debugStreams = [];
function handleTrackEvent(event) {
  debugStreams = debugStreams.concat(event.streams);
  console.log("recieved a new stream");
  document.getElementById("remote-video").srcObject = event.streams[0];
}

function handleNegotiationNeededEvent() {
  console.log("creating negotiation");
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
