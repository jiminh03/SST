import asyncio
import json
import cv2
import queue
import threading
from aiohttp import ClientSession
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCConfiguration, RTCIceCandidate
from av import VideoFrame

# 시그널링 서버 주소
#SIGNALING_SERVER_URL = "http://j13a503.p.ssafy.io:8080"
SIGNALING_SERVER_URL = "http://localhost:8080"

# 스레드 간 프레임 공유를 위한 큐
frame_queue = queue.Queue()
# 프로그램을 종료하기 위한 플래그
stop_event = threading.Event()

def opencv_display_thread():
    """OpenCV 창을 표시하고 프레임을 업데이트하는 스레드 함수"""
    while not stop_event.is_set():
        try:
            frame = frame_queue.get(timeout=1)
            if frame is None:
                break
            
            img = frame.to_ndarray(format="bgr24")
            cv2.imshow("Viewer", img)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                stop_event.set()
                break
        except queue.Empty:
            continue
    
    print("Closing OpenCV window.")
    cv2.destroyAllWindows()

async def run_viewer():
    config = RTCConfiguration(
    iceServers=[
        # A public STUN server for quick NAT traversal checks
        RTCIceServer(urls=["stun:stun.l.google.com:19302"]),

        # ✨ Your CoTURN server information ✨
        RTCIceServer(
            urls=[
                # Secure TURNS is tried first for better firewall traversal
                "turns:j13a503.p.ssafy.io:5349?transport=tcp",
                # Standard TURN over UDP is the fallback
                "turn:j13a503.p.ssafy.io:3478?transport=udp"
            ],
            username="SST_TURN",
            credential="usGqSEnD6Spu8TxC51bUx9j13SCjPSTk" # Your actual password
        )
    ]
)

    pc = RTCPeerConnection(configuration=config)
    
    # ▼▼▼ [수정 1] ICE 후보를 저장할 큐와 이벤트 핸들러 설정 ▼▼▼
    ice_candidates_queue = asyncio.Queue()

    @pc.on("icecandidate")
    def on_icecandidate(candidate):
        if candidate:
            print("Generated ICE Candidate:", candidate)
            ice_candidates_queue.put_nowait(candidate)
    # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print(f"✅ Connection state is -> {pc.connectionState}")
        if pc.connectionState == "failed":
            print("❌ Connection failed.")
            if not stop_event.is_set():
                stop_event.set()

    @pc.on("track")
    def on_track(track):
        print(f"Track {track.kind} received")
        if track.kind == "video":
            asyncio.ensure_future(display_track(track))
    
    async def display_track(track):
        """수신된 비디오 프레임을 큐에 넣는 역할"""
        while not stop_event.is_set():
            try:
                frame = await track.recv()
                
                # ==========================================================
                # ❗수정된 부분: len() 대신 .buffer_size를 사용합니다.
                # ==========================================================
                frame_size = frame.planes[0].buffer_size
                # print(
                #     f"📦 Frame received: pts={frame.pts}, "
                #     f"resolution={frame.width}x{frame.height}, "
                #     f"size={frame_size} bytes"
                # )

                frame_queue.put(frame)
            except Exception:
                # 트랙이 종료되면 루프를 빠져나옴
                break
        print("Stopping video track reception.")

    # OpenCV GUI 스레드 시작
    thread = threading.Thread(target=opencv_display_thread)
    thread.start()

    # 시그널링 서버와 통신
    async with ClientSession() as session:
        # ▼▼▼ [수정 2] ICE 후보를 교환하는 비동기 작업 정의 및 실행 ▼▼▼
        async def send_ice_candidates():
            """큐에 있는 자신의 ICE 후보(viewer)를 서버로 전송"""
            while not stop_event.is_set():
                candidate = await ice_candidates_queue.get()
                try:
                    cand_dict = candidate.to_dict()
                    async with session.post(f'{SIGNALING_SERVER_URL}/ice?peer=viewer', json=cand_dict) as resp:
                        if resp.status != 200:
                            print(f"Failed to send ICE candidate, status: {resp.status}")
                except Exception as e:
                    if not stop_event.is_set(): print(f"Error sending ICE candidate: {e}")
                ice_candidates_queue.task_done()

        async def receive_ice_candidates():
            """서버로부터 상대방(broadcaster)의 ICE 후보를 받아 등록"""
            while not stop_event.is_set() and pc.iceConnectionState not in ["connected", "completed", "failed", "closed"]:
                try:
                    async with session.get(f'{SIGNALING_SERVER_URL}/ice?peer=viewer') as resp:
                        if resp.status == 200:
                            candidates_data = await resp.json()
                            for cand_data in candidates_data:
                                print("Received remote ICE candidate:", cand_data)
                                await pc.addIceCandidate(RTCIceCandidate(**cand_data))
                except Exception as e:
                    if not stop_event.is_set(): print(f"Error receiving ICE candidates: {e}")
                await asyncio.sleep(2)

        send_task = asyncio.create_task(send_ice_candidates())
        receive_task = asyncio.create_task(receive_ice_candidates())
        # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        try:
            print("Requesting offer from signaling server...")
            offer_data = None
            while not offer_data and not stop_event.is_set():
                async with session.get('https://j13a503.p.ssafy.io:8080/offer') as response:
                    if response.status == 200:
                        offer_data = await response.json()
                        print("Received offer.")
                    else:
                        await asyncio.sleep(2)
            
            if not offer_data: return

            offer = RTCSessionDescription(sdp=offer_data["sdp"], type=offer_data["type"])

            # [추가된 부분 시작]
            print("\n----------------------------------------")
            print("📥 수신한 Offer SDP:")
            print(offer.sdp)
            print("----------------------------------------\n")
            # [추가된 부분 끝]

            await pc.setRemoteDescription(offer)
            
            answer = await pc.createAnswer()

            # [추가된 부분 시작]
            print("\n----------------------------------------")
            print("📤 생성한 Answer SDP:")
            print(answer.sdp)
            print("----------------------------------------\n")
            # [추가된 부분 끝]
            
            await pc.setLocalDescription(answer)
            
            answer_data = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
            
            print("Sending answer to signaling server...")
            async with session.post('https://j13a503.p.ssafy.io:8080/answer', json=answer_data) as response:
                if response.status != 200:
                    print(f"Failed to send answer. Status: {response.status}")
                    return

        except Exception as e:
            if not stop_event.is_set():
                print(f"Signaling failed: {e}")
            return
        finally:
            # 시그널링이 실패하면 ICE 교환 작업도 중단
            if not offer_data or response.status != 200:
                if not stop_event.is_set(): stop_event.set()

    print("Watching stream... Press 'q' on the video window to quit.")
    
    # stop_event가 설정될 때까지 대기
    await asyncio.get_event_loop().run_in_executor(None, stop_event.wait)

    print("Closing connection...")
    # ▼▼▼ [수정 3] 종료 시 비동기 작업들 정리 ▼▼▼
    send_task.cancel()
    receive_task.cancel()
    await pc.close()
    
    frame_queue.put(None)
    thread.join()
            
if __name__ == "__main__":
    try:
        asyncio.run(run_viewer())
    except KeyboardInterrupt:
        print("Interrupted by user.")
    finally:
        if not stop_event.is_set():
            stop_event.set()