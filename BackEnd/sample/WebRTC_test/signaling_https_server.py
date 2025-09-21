import asyncio
import ssl
from aiohttp import web
import aiohttp_cors

# 세션 정보를 저장할 변수들
offer_sdp = None
answer_sdp = None
broadcaster_candidates = []
viewer_candidates = []

# 기존 handle_offer, handle_answer 함수는 그대로 둡니다...

async def handle_offer(request):
    """
    POST: Broadcaster로부터 offer를 받아 저장합니다.
    GET: Viewer가 저장된 offer를 가져갑니다.
    """
    global offer_sdp, answer_sdp, broadcaster_candidates, viewer_candidates
    
    if request.method == 'POST':
        data = await request.json()
        offer_sdp = data
        # 새로운 Offer가 오면 이전 세션 정보를 모두 초기화
        answer_sdp = None 
        broadcaster_candidates = []
        viewer_candidates = []
        print("Received and updated offer. Server state reset.")
        return web.Response(text="Offer received")
        
    elif request.method == 'GET':
        if offer_sdp:
            print("Sending offer to viewer.")
            return web.json_response(offer_sdp)
        else:
            return web.Response(status=404, text="No offer available")

async def handle_answer(request):
    """
    POST: Viewer로부터 answer를 받아 저장합니다.
    GET: Broadcaster가 저장된 answer를 가져갑니다.
    """
    global answer_sdp
    
    if request.method == 'POST':
        if not offer_sdp:
            print("Warning: Answer received but no offer exists.")
            return web.Response(status=400, text="Cannot accept answer without an offer")
            
        data = await request.json()
        answer_sdp = data
        print("Received answer from viewer.")
        return web.Response(text="Answer received")

    elif request.method == 'GET':
        if answer_sdp:
            print("Sending answer to broadcaster.")
            return web.json_response(answer_sdp)
        else:
            return web.Response(status=404, text="No answer available")


# ▼▼▼▼▼ ICE 후보 교환을 위한 핸들러 추가 ▼▼▼▼▼
async def handle_ice_candidate(request):
    """
    POST: Broadcaster 또는 Viewer로부터 ICE 후보를 받아 저장합니다.
    GET: 상대방이 저장된 ICE 후보를 가져갑니다.
    """
    peer_type = request.query.get('peer')
    if not peer_type:
        return web.Response(status=400, text="Peer type query parameter is required")

    if request.method == 'POST':
        data = await request.json()
        if peer_type == 'broadcaster':
            broadcaster_candidates.append(data)
            print(f"Received ICE candidate from broadcaster.")
        elif peer_type == 'viewer':
            viewer_candidates.append(data)
            print(f"Received ICE candidate from viewer.")
        return web.Response(text="ICE candidate received")

    elif request.method == 'GET':
        candidates = []
        if peer_type == 'broadcaster':
            # Broadcaster는 Viewer의 후보를 가져감
            candidates = viewer_candidates.copy()
            viewer_candidates.clear()
        elif peer_type == 'viewer':
            # Viewer는 Broadcaster의 후보를 가져감
            candidates = broadcaster_candidates.copy()
            broadcaster_candidates.clear()
        
        print(f"Sending {len(candidates)} candidates to {peer_type}.")
        return web.json_response(candidates)
# ▲▲▲▲▲ ICE 후보 교환을 위한 핸들러 추가 ▲▲▲▲▲

if __name__ == '__main__':
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    
    cert_path = '/app/certs/fullchain.pem'
    key_path = '/app/certs/privkey.pem'
    ssl_context.load_cert_chain(certfile=cert_path, keyfile=key_path)

    app = web.Application()
    
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
            )
    })

    app.router.add_route('*', '/offer', handle_offer)
    app.router.add_route('*', '/answer', handle_answer)
    # ▼▼▼▼▼ ICE 후보 교환을 위한 라우트 추가 ▼▼▼▼▼
    app.router.add_route('*', '/ice', handle_ice_candidate)
    # ▲▲▲▲▲ ICE 후보 교환을 위한 라우트 추가 ▲▲▲▲▲
    
    print("Signaling server starting on https://0.0.0.0:8080")
    web.run_app(app, host='0.0.0.0', port=8080, ssl_context=ssl_context)