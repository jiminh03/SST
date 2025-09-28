# ~/sst_dev_and_dep/docker/signaling/signaling_server.py

import asyncio
import ssl
from aiohttp import web
import aiohttp_cors

# offer와 answer를 임시로 저장할 변수
offer_sdp = None
answer_sdp = None
broadcaster_candidates = []
viewer_candidates = []

async def handle_offer(request):
    """
    POST: Broadcaster로부터 offer를 받아 저장합니다.
    GET: Viewer가 저장된 offer를 가져갑니다.
    """
    global offer_sdp, answer_sdp
    
    if request.method == 'POST':
        data = await request.json()
        offer_sdp = data
        answer_sdp = None 
        print("Received and updated offer. Previous answer cleared.")
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
    global offer_sdp, answer_sdp
    
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
            response_data = answer_sdp
            
            offer_sdp = None
            answer_sdp = None
            print("Session complete. Server state reset.")
            
            return web.json_response(response_data)
        else:
            return web.Response(status=404, text="No answer available")

if __name__ == '__main__':
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    
    cert_path = '/app/certs/fullchain.pem'
    key_path = '/app/certs/privkey.pem'
    ssl_context.load_cert_chain(certfile=cert_path, keyfile=key_path)

    app = web.Application()
    
    # ================================================================
    # ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    # [최종 수정] defaults 옵션으로 CORS를 한번만 설정하고, 수동 추가 코드는 모두 삭제합니다.
    
    # defaults 옵션을 사용해 앞으로 추가될 모든 라우트에 CORS를 자동으로 적용하도록 설정
    cors = aiohttp_cors.setup(app, defaults={
      # ngrok 주소는 계속 바뀌므로, 개발 중에는 모든 출처('*')를 허용합니다.
      "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })

    # 라우트를 등록하면 CORS는 위 defaults 설정에 따라 자동으로 적용됩니다.
    app.router.add_route('*', '/offer', handle_offer)
    app.router.add_route('*', '/answer', handle_answer)

    # 수동으로 CORS를 추가하는 코드는 충돌을 일으키므로 완전히 삭제합니다.
    # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    # ================================================================
    
    # 포트를 8080으로 다시 변경
    print("Signaling server starting on https://0.0.0.0:8080")
    web.run_app(app, host='0.0.0.0', port=8080, ssl_context=ssl_context)
