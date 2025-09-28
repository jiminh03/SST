import asyncio
import json
import cv2
from aiohttp import ClientSession

from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, RTCIceServer, RTCConfiguration
from av import VideoFrame

# ▼▼▼ [수정 1] 시그널링 서버 주소를 http로 변경 ▼▼▼
#SIGNALING_SERVER_URL = "http://j13a503.p.ssafy.io:8080"
SIGNALING_SERVER_URL = "http://localhost:8080"

class CameraStreamTrack(VideoStreamTrack):
    """OpenCV를 사용하여 카메라 영상을 스트리밍하는 비디오 트랙"""
    def __init__(self):
        super().__init__()
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            raise Exception("Could not open video camera")

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        ret, frame = self.cap.read()
        if not ret:
            return None

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        video_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame

async def run_broadcaster():
    config = RTCConfiguration(
        iceServers=[
            RTCIceServer(urls=["stun:stun.l.google.com:19302"])
        ]
    )
    pc = RTCPeerConnection(configuration=config)
    
    ice_candidates_queue = asyncio.Queue()

    @pc.on("icecandidate")
    def on_icecandidate(candidate):
        if candidate:
            print("Generated ICE Candidate:", candidate)
            ice_candidates_queue.put_nowait(candidate)

    video_track = CameraStreamTrack()
    pc.addTrack(video_track)

    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    offer_data = {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    }
    
    # ▼▼▼ [수정 2] SSL 컨텍스트 및 TCPConnector 관련 코드 전체 삭제 ▼▼▼
    # HTTP 통신에는 SSL 관련 설정이 필요 없으므로 해당 부분을 모두 제거합니다.
    async with ClientSession() as session:
    # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        print("Sending offer to signaling server...")
        try:
            async with session.post(f'{SIGNALING_SERVER_URL}/offer', json=offer_data) as response:
                if response.status != 200:
                    print(f"Failed to send offer, status: {response.status}")
                    await pc.close()
                    return
                print("Offer sent successfully.")
        except Exception as e:
            print(f"Error sending offer: {e}")
            await pc.close()
            return
        
        async def send_ice_candidates():
            """큐에 있는 자신의 ICE 후보를 서버로 전송"""
            while True:
                candidate = await ice_candidates_queue.get()
                try:
                    # `candidate.to_dict()`를 사용하여 JSON 직렬화가 가능한 딕셔너리로 변환
                    cand_dict = candidate.to_dict()
                    async with session.post(f'{SIGNALING_SERVER_URL}/ice?peer=broadcaster', json=cand_dict) as resp:
                        if resp.status != 200:
                            print(f"Failed to send ICE candidate, status: {resp.status}")
                except Exception as e:
                    print(f"Error sending ICE candidate: {e}")
                ice_candidates_queue.task_done()

        async def receive_ice_candidates():
            """서버로부터 상대방(Viewer)의 ICE 후보를 받아 등록"""
            while pc.iceConnectionState not in ["connected", "completed", "failed", "closed"]:
                try:
                    async with session.get(f'{SIGNALING_SERVER_URL}/ice?peer=broadcaster') as resp:
                        if resp.status == 200:
                            candidates_data = await resp.json()
                            for cand_data in candidates_data:
                                print("Received remote ICE candidate:", cand_data)
                                # 서버에서 받은 JSON 데이터를 RTCIceCandidate 객체로 변환
                                await pc.addIceCandidate(RTCIceCandidate(**cand_data))
                except Exception as e:
                    print(f"Error receiving ICE candidates: {e}")
                await asyncio.sleep(2)

        send_task = asyncio.create_task(send_ice_candidates())
        receive_task = asyncio.create_task(receive_ice_candidates())

        print("Waiting for answer...")
        answer_data = None
        while True:
            try:
                async with session.get(f'{SIGNALING_SERVER_URL}/answer') as response:
                    if response.status == 200:
                        answer_data = await response.json()
                        print("Received answer.")
                        break
                    await asyncio.sleep(1)
            except Exception as e:
                print(f"Error polling for answer: {e}")
                await asyncio.sleep(5)

        if answer_data:
            answer = RTCSessionDescription(sdp=answer_data["sdp"], type=answer_data["type"])
            await pc.setRemoteDescription(answer)
            print("Remote description set. Streaming video... Press Ctrl+C to stop.")
        else:
            print("Could not get an answer. Closing.")
            await pc.close()
            send_task.cancel()
            receive_task.cancel()
            return

        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            pass
        finally:
            print("Closing connection.")
            await pc.close()
            send_task.cancel()
            receive_task.cancel()

if __name__ == "__main__":
    try:
        asyncio.run(run_broadcaster())
    except KeyboardInterrupt:
        pass