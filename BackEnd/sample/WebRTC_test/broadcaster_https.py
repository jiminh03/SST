import asyncio
import json
import cv2
import ssl
from aiohttp import ClientSession, TCPConnector

from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack, RTCIceServer, RTCConfiguration
from av import VideoFrame

# 시그널링 서버 주소
SIGNALING_SERVER_URL = "https://j13a503.p.ssafy.io:8080" # HTTPS와 포트 확인

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
    
    # ▼▼▼▼▼ [수정 1] ICE 후보를 저장할 큐와 이벤트 핸들러 설정 ▼▼▼▼▼
    ice_candidates_queue = asyncio.Queue()

    @pc.on("icecandidate")
    def on_icecandidate(candidate):
        if candidate:
            print("Generated ICE Candidate:", candidate)
            # 생성된 후보를 큐에 넣어 비동기적으로 전송
            ice_candidates_queue.put_nowait(candidate)
    # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    video_track = CameraStreamTrack()
    pc.addTrack(video_track)

    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    offer_data = {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    }
    
    # 서버의 SSL 인증서 검증을 비활성화하는 SSL 컨텍스트 생성
    # (주의: 실제 프로덕션에서는 보안상 권장되지 않습니다)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connector = TCPConnector(ssl=ssl_context)

    async with ClientSession(connector=connector) as session:
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
        
        # ▼▼▼▼▼ [수정 2] ICE 후보를 지속적으로 보내고 받는 비동기 작업 실행 ▼▼▼▼▼
        async def send_ice_candidates():
            """큐에 있는 자신의 ICE 후보를 서버로 전송"""
            while True:
                candidate = await ice_candidates_queue.get()
                try:
                    async with session.post(f'{SIGNALING_SERVER_URL}/ice?peer=broadcaster', json=json.loads(candidate.sdp)) as resp:
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
                            candidates = await resp.json()
                            for cand_data in candidates:
                                print("Received remote ICE candidate:", cand_data)
                                candidate = RTCSessionDescription(sdp=cand_data['sdp'], type=cand_data['type']) # aiortc에 맞게 수정
                                await pc.addIceCandidate(candidate)
                except Exception as e:
                    print(f"Error receiving ICE candidates: {e}")
                await asyncio.sleep(2) # 2초 간격으로 폴링

        # 비동기 작업들을 백그라운드에서 실행
        send_task = asyncio.create_task(send_ice_candidates())
        receive_task = asyncio.create_task(receive_ice_candidates())
        # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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