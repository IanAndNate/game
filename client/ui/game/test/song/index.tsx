import React from "react";
import { useGame } from "../../../../controllers/game";
import { GameStatus } from "../../../../controllers/game/types";
import { Canvas, useFrame } from "@react-three/fiber";
import styled from "@emotion/styled";
import * as THREE from "three";

const Container = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
`;

interface NoteProps {
    duration: number;
    time: number;
    column: number;
}

const DURATION_FACTOR = 10;
const CAMERA_DISTANCE = 5;
const CAMERA_Y_OFFSET = -60;
const CAMERA_LOOK_Z_OFFSET = -50;

const GradientMaterial = ({
    color1,
    color2,
}: {
    color1: string;
    color2: string;
}) => {
    return (
        <shaderMaterial
            uniforms={{
                color1: {
                    value: new THREE.Color(color1),
                },
                color2: {
                    value: new THREE.Color(color2),
                },
            }}
            vertexShader={`
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }
            `}
            fragmentShader={`
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
                }
            `}
            //   wireframe={true}
        />
    );
};

const Note = ({ duration, column, time }: NoteProps) => {
    const factor = 10;
    const offset = time * factor;
    return (
        <mesh position={[column * 1.2, offset, 0]}>
            <planeGeometry args={[1, duration * DURATION_FACTOR]} />
            {/* <meshBasicMaterial color={"#4b95a3"} /> */}
            <GradientMaterial color1="#4b95a3" color2="#ffffff" />
        </mesh>
    );
};

const Guide = ({ column, duration }: { column: number; duration: number }) => {
    // not sure why this isn't pure white
    return (
        <mesh position={[column * 1.2, 0, -0.01]}>
            <planeGeometry args={[1, duration * DURATION_FACTOR]} />
            <meshBasicMaterial color="white" />
        </mesh>
    );
};

const Viz = () => {
    const [{ piece }] = useGame();
    const { startTime, song, notes } = piece;
    const middle: number = ((notes.length - 1) * 1.2) / 2;
    useFrame(({ camera }) => {
        const now = Date.now();
        const place = (now - startTime) / (1000 / DURATION_FACTOR);
        // console.log(place);
        camera.position.set(middle, place + CAMERA_Y_OFFSET, CAMERA_DISTANCE);
        camera.lookAt(middle, place, CAMERA_LOOK_Z_OFFSET);
    });

    // TODO guide should be full duration of song
    return (
        <>
            {song.map((note, idx) => (
                <Note
                    key={idx}
                    column={notes.findIndex((n) => n.key === note.key)}
                    duration={note.duration}
                    time={note.time}
                />
            ))}
            {notes.map((_, idx) => (
                <Guide key={idx} column={idx} duration={100} />
            ))}
        </>
    );
};

export const Song = () => {
    const [{ status }] = useGame();
    if (status !== GameStatus.Running) {
        return null;
    }
    return (
        <Container>
            <Canvas
                // gl={{ pixelRatio: window.devicePixelRatio }}
                // orthographic={true}
                camera={{ far: 100 }}
                // onCreated={({ camera }) => {
                //   camera.lookAt(middle, 0, 0);
                // }}
            >
                <Viz />
            </Canvas>
        </Container>
    );
};
