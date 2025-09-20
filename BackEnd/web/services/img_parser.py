import mimetypes
from typing import Optional

# 각 이미지 형식의 매직 넘버 (바이트 시퀀스)
# 파일의 '지문'과 같은 역할을 합니다.
MAGIC_NUMBERS = {
    # PNG: b'\x89PNG\r\n\x1a\n'
    b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a': "image/png",
    # JPEG: b'\xff\xd8\xff'
    b'\xff\xd8\xff': "image/jpeg",
    # GIF: b'GIF87a' or b'GIF89a'
    b'\x47\x49\x46\x38\x37\x61': "image/gif",
    b'\x47\x49\x46\x38\x39\x61': "image/gif",
    # WebP: RIFF .... WEBP
    b'\x52\x49\x46\x46': "image/webp", # RIFF 매직 넘버, 추가 확인 필요
    # AVIF: .... ftypavif
    b'\x66\x74\x79\x70\x61\x76\x69\x66': "image/avif", # ftypavif, 추가 확인 필요
}

def get_image_mimetype(data: bytes) -> Optional[str]:
    """
    파일의 바이트 데이터 앞부분을 분석하여 웹 이미지의 MIME 타입을 반환합니다.
    인식하지 못하는 형식이면 None을 반환합니다.

    Args:
        data (bytes): 파일의 시작 부분 데이터 (최소 12바이트 이상 권장)

    Returns:
        Optional[str]: 'image/jpeg', 'image/png' 등 MIME 타입 문자열 또는 None
    """
    if not data:
        return None

    # 1. 고정된 매직 넘버 확인 (PNG, JPEG, GIF)
    for magic, mimetype in MAGIC_NUMBERS.items():
        if data.startswith(magic):
            # WebP는 'RIFF'로 시작하고 8번째 바이트부터 'WEBP'가 와야 함
            if mimetype == "image/webp":
                if len(data) >= 12 and data[8:12] == b'WEBP':
                    return "image/webp"
                continue # RIFF로 시작하지만 WEBP가 아니면 다른 RIFF 형식일 수 있음

            # AVIF는 4번째 바이트부터 'ftyp'이 오고 8번째부터 'avif'가 와야 함
            if mimetype == "image/avif":
                if len(data) >= 12 and data[4:8] == b'ftyp' and data[8:12] == b'avif':
                    return "image/avif"
                continue

            return mimetype

    # 2. SVG 확인 (텍스트 기반 XML 형식)
    # SVG는 바이너리 매직 넘버가 없으므로 텍스트로 디코딩하여 확인합니다.
    try:
        # 공백, 줄바꿈 등을 무시하고 '<svg' 문자열이 있는지 확인
        text_data = data.decode('utf-8').strip().lower()
        if text_data.startswith('<svg') or text_data.startswith('<?xml') and '<svg' in text_data:
            return "image/svg+xml"
    except UnicodeDecodeError:
        # 텍스트 파일이 아니면 디코딩 에러 발생
        pass

    return None