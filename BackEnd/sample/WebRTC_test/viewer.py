import asyncio
import json
import cv2
import numpy as np
from aiohttp import ClientSession
from aiortc import RTCPeerConnection, RTCSessionDescription

async def run_viewer():
    pc = RTCPeerConnection()

    @pc.on("track")
    def on_track(track):
        print(f"Track {track.kind} received")
        if track.kind == "video":
            asyncio.ensure_future(display_track(track))
    
    async def display_track(track):
        """수신된 비디오 트랙을 OpenCV 창에 표시"""
        while True:
            try:
                frame = await track.recv()
                # VideoFrame을 OpenCV가 사용할 수 있는 numpy 배열로 변환
                img = frame.to_ndarray(format="bgr24")
                cv2.imshow("Viewer", img)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            except Exception as e:
                print(f"Error receiving frame: {e}")
                break
        cv2.destroyAllWindows()

    # 시그널링 서버로부터 offer 수신
    async with ClientSession() as session:
        print("Requesting offer from signaling server...")
        async with session.get('http://localhost:8080/offer') as response:
            if response.status == 200:
                offer_data = await response.json()
                print("Received offer.")
                offer = RTCSessionDescription(sdp=offer_data["sdp"], type=offer_data["type"])
                await pc.setRemoteDescription(offer)
                
                # Answer 생성 및 Local description으로 설정
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                
                answer_data = {
                    "sdp": pc.localDescription.sdp,
                    "type": pc.localDescription.type
                }
                
                # 시그널링 서버에 answer 전송
                print("Sending answer to signaling server...")
                await session.post('http://localhost:8080/answer', json=answer_data)
            else:
                print(f"Error: No offer available. Status: {response.status}")
                return

    print("Watching stream... Press 'q' on the video window to quit.")
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        print("Closing connection.")
        await pc.close()

if __name__ == "__main__":
    try:
        asyncio.run(run_viewer())
    except KeyboardInterrupt:
        pass