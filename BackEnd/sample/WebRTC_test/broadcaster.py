import asyncio
import json
import cv2
import numpy as np
from aiohttp import ClientSession
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
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
    pc = RTCPeerConnection()
    
    # 카메라 비디오 트랙 추가
    video_track = CameraStreamTrack()
    pc.addTrack(video_track)

    # Offer 생성 및 Local description으로 설정
    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    offer_data = {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    }

    # 시그널링 서버에 offer 전송 및 answer 수신
    async with ClientSession() as session:
        print("Sending offer to signaling server...")
        async with session.post('http://localhost:8080/offer', json=offer_data) as response:
            if response.status == 200:
                answer_data = await response.json()
                print("Received answer from signaling server.")
                answer = RTCSessionDescription(sdp=answer_data["sdp"], type=answer_data["type"])
                await pc.setRemoteDescription(answer)
            else:
                print(f"Error: {response.status}")
                return

    print("Streaming video... Press Ctrl+C to stop.")
    try:
        # 연결이 끊어지지 않도록 대기
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