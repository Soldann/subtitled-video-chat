import React, { useEffect, useRef, useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams
} from "react-router-dom";

const JoinCall = () => { 
  const callId = useParams();
  console.log(callId)
    const videoRef = useRef();
    const audioRef = useRef();
    useEffect(() => {
      import('peerjs').then((module) => {
        const Peer = module.default;
        const peer = new Peer({
          host: 'polar-escarpment-94286.herokuapp.com',
          port: 80,
        });
        peer.on('open', (id) => {
          console.log('my peer id:', id);

          navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video: true,
            })
              .then((stream) => {
                videoRef.current.srcObject = stream;
              console.log('calling', callId);
              peer.call(callId, stream);
            });
  
          console.log('connecting to', callId);
          const conn = peer.connect(callId);
          conn.on('open', () => {
            console.log('connection opened');
            conn.on('data', (data) => {

            });
          });
        });
      });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <pre className="overflow-hidden"></pre>
          <video
            autoPlay
            className="absolute rounded"
            ref={videoRef}
            style={{
              bottom: 16,
              right: 16,
              width: 320,
            }}
          ></video>
          <video autoPlay className="h-0" ref={audioRef}></video>
        </div>
      );
};
export default JoinCall;
