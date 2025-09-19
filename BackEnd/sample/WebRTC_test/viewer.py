import asyncio
import json
import cv2
import numpy as np
from aiohttp import ClientSession
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCConfiguration
import threading
import queue

# 스레드 간 프레임 공유를 위한 큐
frame_queue = queue.Queue()
# 프로그램을 종료하기 위한 플래그
stop_event = threading.Event()

def opencv_display_thread():
    """OpenCV 창을 표시하고 프레임을 업데이트하는 스레드 함수"""
    while not stop_event.is_set():
        try:
            # 큐에서 프레임을 가져옴 (최대 1초 대기)
            frame = frame_queue.get(timeout=1)
            if frame is None: # 종료 신호
                break
            
            img = frame.to_ndarray(format="bgr24")
            cv2.imshow("Viewer", img)
            
            # 'q'를 누르면 종료 플래그 설정
            if cv2.waitKey(1) & 0xFF == ord('q'):
                stop_event.set()
                break
        except queue.Empty:
            # 큐가 비어있으면 계속 진행
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
            username="SST_ROOT",
            credential="0olB5NVMTkCpWUnw" # Your actual password
        )
    ]
)

    pc = RTCPeerConnection(configuration=config)

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print(f"✅ Connection state is -> {pc.connectionState}")
        if pc.connectionState == "failed":
            print("❌ Connection failed. Closing.")
            stop_event.set()
            await pc.close()

    @pc.on("track")
    def on_track(track):
        print(f"Track {track.kind} received")
        if track.kind == "video":
            asyncio.ensure_future(display_track(track))
    
    async def display_track(track):
        """수신된 비디오 프레임을 큐에 넣고 로그를 출력하는 역할"""
        print("Video track display loop started.")
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
            except Exception as e:
                # 오류 발생 시 루프를 중단하기 전에 stop_event를 설정합니다.
                if not stop_event.is_set():
                    print(f"Error receiving frame: {e}")
                    stop_event.set()
                break # 오류 발생 시 루프 즉시 종료
        print("Stopping video track reception.")

    # OpenCV GUI 스레드 시작
    thread = threading.Thread(target=opencv_display_thread)
    thread.start()

    # 시그널링 서버와 통신
    async with ClientSession() as session:
        print("Requesting offer from signaling server...")
        try:
            offer_data = None
            while not offer_data and not stop_event.is_set():
                async with session.get('https://j13a503.p.ssafy.io:8080/offer') as response:
                    if response.status == 200:
                        offer_data = await response.json()
                        print("Received offer.")
                    else:
                        print(f"No offer available yet (status: {response.status}). Retrying in 5 seconds...")
                        await asyncio.sleep(5)

            if not offer_data:
                if not stop_event.is_set(): stop_event.set()
                return

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
            
            answer_data = {
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type
            }
            
            print("Sending answer to signaling server...")
            async with session.post('https://j13a503.p.ssafy.io:8080/answer', json=answer_data) as response:
                if response.status != 200:
                    print(f"Failed to send answer. Status: {response.status}")
                    if not stop_event.is_set(): stop_event.set()
                    return

        except Exception as e:
            if not stop_event.is_set():
                print(f"Signaling failed: {e}")
                stop_event.set()
            return

    print("Watching stream... Press 'q' on the video window to quit.")
    
    await asyncio.get_event_loop().run_in_executor(None, stop_event.wait)

    print("Closing connection.")
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