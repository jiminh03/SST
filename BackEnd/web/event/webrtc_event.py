#socket.io에서 핸들링할 이벤트 목록
from web.main import sio
from web.services.database import db,red


# --- 3. WebRTC 시그널링 이벤트 핸들러 ---

@sio.on('client:register_offer')
async def on_register_offer(sid, data):
    """(로봇 -> 서버) 로봇이 Offer를 등록하는 이벤트"""
    robot_id = await red.get(f"sid:{sid}")
    if not robot_id: return

    print(f"📹 [Offer 수신] 로봇({robot_id})으로부터 Offer 수신")
    
    # 이 로봇(어르신)을 담당하는 FE의 sid를 찾습니다.
    fe_sid = await find_fe_sid_for_senior(robot_id)
    if fe_sid:
        # FE에게 'server:new_offer' 이벤트를 보냅니다.
        await sio.emit('server:new_offer', data, to=fe_sid)
        print(f"🚀 [Offer 전달] FE({fe_sid})에게 Offer 전달 완료")

@sio.on('client:send_answer')
async def on_send_answer(sid, data):
    """(FE -> 서버) FE가 Answer를 제출하는 이벤트"""
    fe_id = await redis_client.get(f"sid:{sid}")
    if not fe_id: return

    robot_id = data.get('robot_id')
    print(f"📝 [Answer 수신] FE({fe_id})로부터 로봇({robot_id})을 위한 Answer 수신")

    # Answer를 전달할 로봇의 sid를 찾습니다.
    robot_sid = await redis_client.get(f"user:{robot_id}:sid")
    if robot_sid:
        # 로봇에게 'server:new_answer' 이벤트를 보냅니다.
        await sio.emit('server:new_answer', data, to=robot_sid)
        print(f"🚀 [Answer 전달] 로봇({robot_sid})에게 Answer 전달 완료")

@sio.on('client:send_ice_candidate')
async def on_send_ice_candidate(sid, data):
    """(로봇/FE -> 서버) ICE Candidate를 중계하는 이벤트"""
    sender_id = await redis_client.get(f"sid:{sid}")
    if not sender_id: return

    target_id = data.get('target_id') # 메시지에 상대방 ID를 포함해야 함
    print(f"🌐 [ICE 수신] {sender_id} -> {target_id} ICE Candidate 수신")
    
    # Candidate를 전달할 상대방의 sid를 찾습니다.
    target_sid = await redis_client.get(f"user:{target_id}:sid")
    if target_sid:
        # 상대방에게 'server:new_ice_candidate' 이벤트를 보냅니다.
        await sio.emit('server:new_ice_candidate', data, to=target_sid)