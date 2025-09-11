import asyncio
import json
import cv2
import numpy as np
from aiohttp import ClientSession

from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, RTCIceServer, RTCConfiguration
from av import VideoFrame

class CameraStreamTrack(VideoStreamTrack):
    """OpenCV를 사용하여 카메라 영상을 스트리밍하는 비디오 트랙"""
    def __init__(self):
        super().__init__()
        self.cap = cv2.VideoCapture(0) # 0번 카메라 (기본 웹캠)
        if not self.cap.isOpened():
            raise Exception("Could not open video camera")

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        ret, frame = self.cap.read()
        if not ret:
            # 비디오가 끝나면 빈 프레임을 보내 종료 신호를 알릴 수 있음
            return None

        # OpenCV 프레임(BGR)을 VideoFrame(RGB)으로 변환
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        video_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame

async def run_broadcaster():
    # ICE servers configuration
    config = RTCConfiguration(
        iceServers=[
            RTCIceServer(urls=["stun:stun.l.google.com:19302"])
        ]
    )

    # Create RTCPeerConnection object with the configuration
    pc = RTCPeerConnection(configuration=config)
    
    # Add camera video track
    video_track = CameraStreamTrack()
    pc.addTrack(video_track)

    # Create offer and set as local description
    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    offer_data = {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    }

    # --- Start of Corrected Signaling Logic ---
    async with ClientSession() as session:
        # Step 1: Send the offer to the signaling server
        print("Sending offer to signaling server...")
        try:
            async with session.post('http://j13a503.p.ssafy.io:8080/offer', json=offer_data) as response:
                if response.status != 200:
                    print(f"Failed to send offer, status code: {response.status}")
                    await pc.close()
                    return
                print("Offer sent successfully.")
        except Exception as e:
            print(f"Error sending offer: {e}")
            await pc.close()
            return

        # Step 2: Poll the server for the answer
        print("Waiting for answer...")
        answer_data = None
        while True:
            try:
                async with session.get('http://j13a503.p.ssafy.io:8080/answer') as response:
                    if response.status == 200:
                        answer_data = await response.json()
                        print("Received answer from signaling server.")
                        break  # Exit the loop once the answer is received
                    elif response.status == 404:
                        # 404 is expected until the viewer sends the answer
                        await asyncio.sleep(1)
                    else:
                        print(f"Error polling for answer, status: {response.status}")
                        await asyncio.sleep(2)
            except Exception as e:
                print(f"Error while polling for answer: {e}")
                await asyncio.sleep(5) # Wait longer if there's a connection issue

    # --- End of Corrected Signaling Logic ---

    # Set the remote description with the received answer
    if answer_data:
        answer = RTCSessionDescription(sdp=answer_data["sdp"], type=answer_data["type"])
        await pc.setRemoteDescription(answer)
        print("Remote description set. Streaming video... Press Ctrl+C to stop.")
    else:
        print("Could not get an answer. Closing.")
        await pc.close()
        return

    try:
        # Keep the script running to stream video
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        print("Closing connection.")
        await pc.close()

if __name__ == "__main__":
    try:
        asyncio.run(run_broadcaster())
    except KeyboardInterrupt:
        pass