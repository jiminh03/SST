using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Unity.WebRTC;
using UnityEngine;
using UnityEngine.Networking;

// ✨ 1. [추가] 인증서 검증을 건너뛰는 헬퍼 클래스
public class BypassCertificateHandler : CertificateHandler
{
    protected override bool ValidateCertificate(byte[] certificateData)
    {
        // 모든 인증서를 유효한 것으로 간주합니다.
        return true;
    }
}


public class WebRTCStreamer : MonoBehaviour
{
    [Header("Signaling")]
    // ✨ HTTPS 주소로 변경하는 것을 잊지 마세요! (예: https://j13a503.p.ssafy.io:8443/offer)
    public string offerUrl = "https://j13a503.p.ssafy.io:8443/offer";
    public string answerUrl = "https://j13a503.p.ssafy.io:8443/answer";

    [Header("Video Source")]
    private Camera sourceCamera;
    private MediaStream videoStream;

    private RTCPeerConnection broadcast_pc;
    private List<RTCRtpSender> bpSenders = new List<RTCRtpSender>();
    private bool iceComplete;
    private bool videoUpdateStarted;

    [System.Serializable]
    private class SdpMsg { public string sdp; public string type; }

    //================================================================================
    // Unity Lifecycle Methods
    //================================================================================

    private void Awake()
    {
        sourceCamera = GetComponent<Camera>();
        if (sourceCamera == null)
        {
            Debug.LogError("❌ WebRTCStreamer 스크립트가 할당된 오브젝트에 Camera 컴포넌트가 없습니다!");
        }

        Application.targetFrameRate = 30;
        QualitySettings.vSyncCount = 0;
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
    }

    private IEnumerator Start()
    {
        var config = new RTCConfiguration
        {
            iceServers = new[]
            {
                new RTCIceServer { urls = new[] { "stun:stun.l.google.com:19302" } },
                new RTCIceServer
                {
                    urls = new[] {
                        "turns:j13a503.p.ssafy.io:5349?transport=tcp",
                        "turn:j13a503.p.ssafy.io:3478?transport=udp"
                    },
                    username = "SST_TURN",
                    credential = "usGqSEnD6Spu8TxC51bUx9j13SCjPSTk"
                }
            }
        };
        broadcast_pc = new RTCPeerConnection(ref config);

        broadcast_pc.OnIceCandidate = candidate => Debug.Log($"ICE Candidate Found: {candidate.Candidate}");
        broadcast_pc.OnIceConnectionChange = state => OnIceConnectionChange(broadcast_pc, state);
        broadcast_pc.OnIceGatheringStateChange = state =>
        {
            Debug.Log($"ICE Gathering State: {state}");
            if (state == RTCIceGatheringState.Complete)
            {
                iceComplete = true;
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

        Debug.Log("Local description set successfully.");
        Debug.Log("Waiting for ICE gathering to complete...");
        yield return new WaitUntil(() => iceComplete);
        Debug.Log("ICE gathering complete.");

        var msg = new SdpMsg { sdp = broadcast_pc.LocalDescription.sdp, type = "offer" };
        var json = JsonUtility.ToJson(msg);

        Debug.Log($"Sending offer to server at {offerUrl}");
        using (var req = new UnityWebRequest(offerUrl, "POST"))
        {
            // ✨ 2. [추가] 생성된 요청에 인증서 핸들러를 할당합니다.
            req.certificateHandler = new BypassCertificateHandler();

            req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json; charset=utf-8");
            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"❌ /offer HTTP Error: {req.error}");
                yield break;
            }

            string body = req.downloadHandler.text;
            if (TryParseSdp(body, out var answerNow))
            {
                yield return SetRemote(answerNow);
            }
            else
            {
                Debug.Log("⏳ Offer accepted. Polling for answer...");
                yield return StartCoroutine(PollAnswerThenSetRemote());
            }
        }
    }

    //================================================================================
    // WebRTC Event Handlers
    //================================================================================

    private void OnIceConnectionChange(RTCPeerConnection pc, RTCIceConnectionState state)
    {
        Debug.Log($"ICE Connection State: {state}");
        if (state == RTCIceConnectionState.Failed)
        {
            Debug.LogError("ICE Connection Failed. Restarting ICE...");
            pc.RestartIce();
        }
    }

    //================================================================================
    // Signaling & Helper Methods
    //================================================================================

    private IEnumerator PollAnswerThenSetRemote(float intervalSec = 1f, float timeoutSec = 60f)
    {
        float elapsed = 0f;
        while (elapsed < timeoutSec)
        {
            using (var req = UnityWebRequest.Get(answerUrl))
            {
                // ✨ 3. [추가] GET 요청에도 인증서 핸들러를 할당합니다.
                req.certificateHandler = new BypassCertificateHandler();

                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success && req.responseCode == 200)
                {
                    if (TryParseSdp(req.downloadHandler.text, out var answer))
                    {
                        yield return SetRemote(answer);
                        yield break;
                    }
                }
            }
            yield return new WaitForSeconds(intervalSec);
            elapsed += intervalSec;
        }
        Debug.LogError("❌ Timed out waiting for /answer");
    }

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
            Debug.Log("✅ Remote answer set. Streaming started.");
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

    private static bool TryParseSdp(string body, out SdpMsg res)
    {
        res = null;
        try
        {
            res = JsonUtility.FromJson<SdpMsg>(body);
            return res != null && !string.IsNullOrEmpty(res.sdp);
        }
        catch { return false; }
    }
}