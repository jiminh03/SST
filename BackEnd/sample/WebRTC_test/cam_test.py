import cv2

# 0번 카메라 (보통 내장 웹캠)에 연결
cap = cv2.VideoCapture(0)

# 카메라가 정상적으로 열렸는지 확인
if not cap.isOpened():
    print("오류: 카메라를 열 수 없습니다.")
    exit()

print("카메라를 성공적으로 열었습니다. 'q' 키를 누르면 종료됩니다.")

# 무한 루프를 돌면서 프레임을 계속 읽어옴
while True:
    # 카메라에서 현재 프레임(이미지)을 읽어옴
    # ret: 성공 여부 (True/False), frame: 읽어온 이미지 데이터
    ret, frame = cap.read()

    # 프레임을 제대로 읽지 못했다면 루프 종료
    if not ret:
        print("오류: 프레임을 읽을 수 없습니다.")
        break

    # 'Camera Test'라는 이름의 창에 현재 프레임을 보여줌
    cv2.imshow('Camera Test', frame)

    # 1ms 동안 키 입력을 기다림. 'q'가 입력되면 루프 종료
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 사용이 끝난 카메라와 모든 창을 정리
cap.release()
cv2.destroyAllWindows()

print("프로그램을 종료합니다.")