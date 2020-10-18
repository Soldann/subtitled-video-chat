var socket = io();

// // voice recognition code
// class RecognitionWrapper {
//   constructor() {
//     this.recognition = new webkitSpeechRecognition();
//     this.recognition.continuous = true;
//     this.recognition.start();
//     this.setRecognition(); // sets callback
//     this.recognition.onend = event => {
//       this.recognition.start();
//     }

//     socket.on("server-to-client-subtitles", data => {
//       if (data.id == socket.id) {
//         return;
//       }

//       document.getElementById("subtitle").innerHTML = data;  // probably need to preprocess or something idk
//     });

//   }

//   setRecognition() {
//     this.recognition.onresult = (event) => {  // when we receive new recognition, broadcast it to other sockets
//       let subtitle = "";
//       for (let result of event.results) {
//           subtitle += result[0].transcript;
//       }
//       console.log(`Sending subtitles: ${subtitle}`);
//       socket.emit("client-to-server-subtitles", {
//         subtitle: subtitle,
//         id: socket.id,
//       });
//     }
//   }
// }

// const rw = new RecognitionWrapper();

// video streaming code

let Peer = require('simple-peer');
var obj = {};
console.log('hi');


navigator.mediaDevices.getUserMedia(
  { video: true, audio: true }).then(
    (stream) => {
      const localVideo = document.getElementById("local-video");
      if (localVideo) {
        localVideo.srcObject = stream;
        localVideo.autoplay = true;
      }

      socket.on("update-user-list", ({ users }) => {
        updateUserList(users);
        console.log(users);
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
          socket.emit("tell-clicked", { from: socket.id, to: socketId })
          targetSocket = socketId;
        });
        return userContainerEl;
      }

      socket.on("now-you-host", data => {
        callUser(data.from);
      })

      function callUser(socketId) {
        console.log('click!');
        
        if (socketId == socket.id) {
          alert("Cannot call self");
          return;
        }
        obj.connect = false;
        obj.peer = new Peer({ initiator: true, stream: stream, tickle: false });
        obj.peer.on('stream', remote_stream => {
          console.log("Got stream!");
          document.getElementById("remote-video").srcObject = remote_stream;
          // document.getElementById("remote-video").play();
        });
        obj.peer.on('signal', data => {
          if (obj.connect) {
            return;
          }
          console.log("Host signal");
          socket.emit('call-user', {
            data: data,
            to: socketId,
          });
        });
      }

      socket.on("call-made", respondUser);

      function respondUser(offer) {
        obj.peer = new Peer({ initiator: false, stream: stream, tickle: false });
        obj.peer.on('stream', remote_stream => {
          document.getElementById("remote-video").srcObject = remote_stream;
          // document.getElementById("remote-video").play();
        });
        obj.peer.on('signal', data => {
          console.log("Follower signal");
          socket.emit('response', {
            data: data,
            id: socket.id,
          });
        });
        obj.peer.signal(offer);
      }

      socket.on("final", data => {
        console.log(data);
        obj.peer.signal(data.data);
        obj.connect = true;
        console.log("finally connected");
      });




    },
    (error) => {
      console.warn(error.message);
    }
  );


socket.on("remove-user", ({ socketId }) => {
  const elToRemove = document.getElementById(socketId);
  console.log("remove user");
  if (elToRemove) {
    elToRemove.remove();
  }
});


// let isAlreadyCalling = false;

// socket.on("answer-made", async data => {
//   await peerConnection.setRemoteDescription(
//     new RTCSessionDescription(data.answer)
//   );
//   console.log("answer made1");
//   if (!isAlreadyCalling) {
//     //callUser(data.socket);
//     isAlreadyCalling = true;
//   }

//   console.log("answer made");

// });

// socket.on("send-ice-candidate", async data => {
//   peerConnection.addIceCandidate(data.candidate);
// });
