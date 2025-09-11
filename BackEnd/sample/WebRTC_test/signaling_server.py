import asyncio
from aiohttp import web
import aiohttp_cors

# offer와 answer를 임시로 저장할 변수
offer_sdp = None
answer_sdp = None

async def handle_offer(request):
    """
    POST: Broadcaster로부터 offer를 받아 저장합니다. 새로운 offer가 오면 기존 것을 덮어씁니다.
    GET: Viewer가 저장된 offer를 가져갑니다.
    """
    global offer_sdp, answer_sdp
    
    if request.method == 'POST':
        data = await request.json()
        # 새로운 offer를 저장하고, 이전 answer가 있었다면 초기화합니다.
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
        # offer가 없는 상태에서 answer가 오면 무시 (또는 에러 처리)
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
            
            # answer를 전달한 후에는 offer와 answer를 모두 초기화하여 다음 연결을 준비합니다.
            offer_sdp = None
            answer_sdp = None
            print("Session complete. Server state reset.")
            
            return web.json_response(response_data)
        else:
            return web.Response(status=404, text="No answer available")

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
app.router.add_route('GET', '/answer', handle_answer) # Broadcaster가 answer를 가져가기 위한 GET 라우트 추가
app.router.add_route('POST', '/answer', handle_answer)

# CORS 설정 적용
for route in list(app.router.routes()):
    cors.add(route)

if __name__ == '__main__':
    print("Signaling server starting on http://localhost:8080")
    web.run_app(app, host='0.0.0.0', port=8080)