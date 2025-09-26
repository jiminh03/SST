import boto3
from pathlib import Path

# S3 설정
S3_BUCKET = "sst-model"
S3_KEY = "models/sst/weights_sim.pkl"
LOCAL_MODEL_PATH = "./model/sim_data/weights_sim.pkl"

def upload_model_to_s3():
    s3 = boto3.client('s3')
    try:
        if not Path(LOCAL_MODEL_PATH).exists():
            print(f"로컬 모델 파일이 없습니다: {LOCAL_MODEL_PATH}")
            return False
            
        s3.upload_file(LOCAL_MODEL_PATH, S3_BUCKET, S3_KEY)
        print(f"모델 업로드 성공!")
        print(f"로컬: {LOCAL_MODEL_PATH}")
        print(f"S3: s3://{S3_BUCKET}/{S3_KEY}")
        
        local_size = Path(LOCAL_MODEL_PATH).stat().st_size
        print(f"파일 크기: {local_size:,} bytes")
        return True
        
    except Exception as e:
        print(f"업로드 실패: {e}")
        return False

print("새 모델을 S3에 업로드 중...")
success = upload_model_to_s3()
if success:
    print("업로드 완료!")
else:
    print("업로드 실패.")
