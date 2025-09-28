// ✨ [추가] M2Mqtt 라이브러리를 사용하기 위한 네임스페이스
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;
using Unity.WebRTC;
using UnityEngine;

public class WebRTCStreamer : MonoBehaviour
{
    [Header("MQTT Broker Settings")]
    public string mqttHost = "10.42.0.219";
    public int mqttPort = 1883;
    public string team = "503";
    public string robotId = "r1";

    private string T_ROBOT_OFFER;
    private string T_ROBOT_ICE; // ✨ [참고] 이 토픽은 이제 사용되지 않습니다.
    private string T_TO_ROBOT_ANS;
    private string T_TO_ROBOT_ICE; // ✨ [참고] 이 토픽은 이제 사용되지 않습니다.

    [Header("Video Source")]
    private Camera sourceCamera;
    private MediaStream videoStream;

    private RTCPeerConnection broadcast_pc;
    private List<RTCRtpSender> bpSenders = new List<RTCRtpSender>();
    private bool videoUpdateStarted;

    private MqttClient mqttClient;
    private readonly ConcurrentQueue<System.Action> mainThreadActions = new ConcurrentQueue<System.Action>();

    // ✨ [추가] ICE 수집 완료를 확인하기 위한 플래그
    private bool isIceGatheringComplete = false;

    [System.Serializable] private class SdpMsg { public string type; public string sdp; }
    // ✨ [삭제] ICE 메시지 클래스는 더 이상 필요 없습니다.
    // [System.Serializable] private class IceMsg { ... }
    // [System.Serializable] private class IceCandidatePayload { ... }

    private void Awake()
    {
        sourceCamera = GetComponent<Camera>();
        if (sourceCamera == null)
        {
            Debug.LogError("❌ WebRTCStreamer 스크립트가 할당된 오브젝트에 Camera 컴포넌트가 없습니다!");
        }

        Application.targetFrameRate = 30;
        QualitySettings.vSyncCount = 0;

        T_ROBOT_OFFER = $"home/{team}/robot/{robotId}/webrtc/offer";
        T_ROBOT_ICE = $"home/{team}/robot/{robotId}/webrtc/ice";
        T_TO_ROBOT_ANS = $"home/{team}/robot/{robotId}/webrtc/answer";
        T_TO_ROBOT_ICE = $"home/{team}/robot/{robotId}/webrtc/ice";
    }

    private void Update()
    {
        while (mainThreadActions.TryDequeue(out var action))
        {
            action.Invoke();
        }
    }

    private void OnDestroy()
    {
        if (broadcast_pc != null)
        {
            RemoveTracks();
            broadcast_pc.Close();
            broadcast_pc.Dispose();
            broadcast_pc = null;
        }
        videoStream?.Dispose();

        if (mqttClient != null && mqttClient.IsConnected)
        {
            mqttClient.Disconnect();
            Debug.Log("🔌 MQTT client disconnected.");
        }
    }

    private IEnumerator Start()
    {
        SetupAndConnectMqtt();

        var config = new RTCConfiguration
        {
            iceServers = new[]
            {
                new RTCIceServer { urls = new[] { "stun:stun.l.google.com:19302" } },
            }
        };
        broadcast_pc = new RTCPeerConnection(ref config);

        // ✨ [수정] OnIceCandidate 콜백은 이제 아무것도 하지 않습니다. (또는 디버그 로그만 남깁니다)
        broadcast_pc.OnIceCandidate = candidate =>
        {
            // ICE Candidate를 바로 보내지 않습니다.
            Debug.Log($"ICE Candidate Found: {candidate.Candidate}");
        };

        broadcast_pc.OnIceConnectionChange = state => OnIceConnectionChange(broadcast_pc, state);
        
        // ✨ [추가] ICE 수집 상태 변경을 감지하는 핸들러 등록
        broadcast_pc.OnIceGatheringStateChange = state =>
        {
            if (state == RTCIceGatheringState.Complete)
            {
                isIceGatheringComplete = true;
            }
        };

        videoStream = sourceCamera.CaptureStream(1280, 720);
        foreach (var track in videoStream.GetTracks())
        {
            bpSenders.Add(broadcast_pc.AddTrack(track, videoStream));
        }

        if (!videoUpdateStarted)
        {
            StartCoroutine(WebRTC.Update());
            videoUpdateStarted = true;
        }

        var offerOp = broadcast_pc.CreateOffer();
        yield return offerOp;

        if (offerOp.IsError)
        {
            Debug.LogError($"Failed to create offer: {offerOp.Error}");
            yield break;
        }

        var offerDesc = offerOp.Desc;
        var setLocalOp = broadcast_pc.SetLocalDescription(ref offerDesc);
        yield return setLocalOp;

        if (setLocalOp.IsError)
        {
            Debug.LogError($"Failed to set local description: {setLocalOp.Error}");
            yield break;
        }

        Debug.Log("Local description set. Waiting for ICE gathering to complete...");
        
        // ✨ [추가] ICE 수집이 완료될 때까지 대기
        yield return new WaitUntil(() => isIceGatheringComplete);
        
        Debug.Log("ICE gathering complete. Sending offer with all candidates.");
        // ✨ [추가] 전송할 Offer SDP를 콘솔에 출력합니다.
        Debug.Log($"--- SENDING OFFER ---\n{broadcast_pc.LocalDescription.sdp}");

        // ✨ [수정] 수집 완료 후, 모든 ICE Candidate가 포함된 LocalDescription의 SDP를 전송
        var msg = new SdpMsg { type = "offer", sdp = broadcast_pc.LocalDescription.sdp };
        var json = JsonUtility.ToJson(msg);
        mqttClient.Publish(T_ROBOT_OFFER, Encoding.UTF8.GetBytes(json), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
        Debug.Log($"Offer sent to MQTT topic: {T_ROBOT_OFFER}");
    }
    
    private void OnIceConnectionChange(RTCPeerConnection pc, RTCIceConnectionState state)
    {
        mainThreadActions.Enqueue(() => Debug.Log($"ICE Connection State: {state}"));
        if (state == RTCIceConnectionState.Failed)
        {
            mainThreadActions.Enqueue(() =>
            {
                Debug.LogError("ICE Connection Failed. Restarting ICE...");
                pc.RestartIce();
            });
        }
    }
    
    private void SetupAndConnectMqtt()
    {
        mqttClient = new MqttClient(mqttHost, mqttPort, false, null, null, MqttSslProtocols.None);
        mqttClient.MqttMsgPublishReceived += OnMqttMessageReceived;
        
        string clientId = $"unity-robot-{System.Guid.NewGuid()}";
        mqttClient.Connect(clientId);

        if (mqttClient.IsConnected)
        {
            Debug.Log($"✅ MQTT client connected to {mqttHost}:{mqttPort}");
            // ✨ [수정] Answer 토픽만 구독하도록 변경
            mqttClient.Subscribe(new string[] { T_TO_ROBOT_ANS },
                                 new byte[] { MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE });
            Debug.Log($"Subscribed to topic: {T_TO_ROBOT_ANS}");
        }
        else
        {
            Debug.LogError("❌ Failed to connect to MQTT broker.");
        }
    }
    
    private void OnMqttMessageReceived(object sender, MqttMsgPublishEventArgs e)
    {
        string topic = e.Topic;
        string message = Encoding.UTF8.GetString(e.Message);
        
        if (topic == T_TO_ROBOT_ANS)
        {
            Debug.Log($"Received Answer from topic: {topic}");
            var answerMsg = JsonUtility.FromJson<SdpMsg>(message);

            // ✨ [수정] SDP 유효성 검사 강화
            if (answerMsg != null && answerMsg.type == "answer" && !string.IsNullOrEmpty(answerMsg.sdp))
            {
                // ✨ [추가] 수신한 Answer SDP를 콘솔에 출력합니다.
                Debug.Log($"--- RECEIVED ANSWER ---\n{answerMsg.sdp}");
                mainThreadActions.Enqueue(() => StartCoroutine(SetRemote(answerMsg)));
            }
            else
            {
                Debug.LogError($"❌ Received invalid answer message: {message}");
            }
        }
        // ✨ [삭제] ICE Candidate 수신 처리 로직 전체 삭제
    }

    // ✨ [삭제] 로컬 ICE Candidate를 발행하는 함수는 더 이상 필요 없습니다.
    // private void PublishIceCandidate(RTCIceCandidate candidate) { ... }

    private IEnumerator SetRemote(SdpMsg answer)
    {
        var remoteDesc = new RTCSessionDescription { type = RTCSdpType.Answer, sdp = answer.sdp };
        var op = broadcast_pc.SetRemoteDescription(ref remoteDesc);
        yield return op;

        if (op.IsError)
        {
            Debug.LogError($"Failed to set remote description: {op.Error}");
        }
        else
        {
            Debug.Log("✅ Remote answer set. Streaming should start.");
        }
    }

    private void RemoveTracks()
    {
        foreach (var sender in bpSenders)
        {
            broadcast_pc.RemoveTrack(sender);
        }
        bpSenders.Clear();
    }
}