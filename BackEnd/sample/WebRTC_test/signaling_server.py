import asyncio
import json
from aiohttp import web
import aiohttp_cors

# offer와 answer를 임시로 저장할 변수
offer_sdp = None
answer_sdp = None

async def handle_offer(request):
    """Broadcaster로부터 offer를 받아 저장하고, answer를 기다렸다가 반환"""
    global offer_sdp, answer_sdp
    
    if request.method == 'POST':
        data = await request.json()
        offer_sdp = data
        print("Received offer from broadcaster.")
        
        # Viewer로부터 answer가 올 때까지 대기
        while answer_sdp is None:
            await asyncio.sleep(1)
            
        print("Sending answer to broadcaster.")
        response_data = answer_sdp
        answer_sdp = None # answer를 전달 후 초기화
        return web.json_response(response_data)
        
    elif request.method == 'GET':
        if offer_sdp:
            print("Sending offer to viewer.")
            return web.json_response(offer_sdp)
        else:
            return web.Response(status=404, text="No offer available")

async def handle_answer(request):
    """Viewer로부터 answer를 받아 저장"""
    global answer_sdp
    data = await request.json()
    answer_sdp = data
    print("Received answer from viewer.")
    return web.Response(text="Answer received")

app = web.Application()
cors = aiohttp_cors.setup(app, defaults={
    "*": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*",
    )
})

# 라우트 설정
app.router.add_route('GET', '/offer', handle_offer)
app.router.add_route('POST', '/offer', handle_offer)
app.router.add_post('/answer', handle_answer)

# CORS 설정 적용
for route in list(app.router.routes()):
    cors.add(route)

if __name__ == '__main__':
    print("Signaling server starting on http://localhost:8080")
    web.run_app(app, host='0.0.0.0', port=8080)