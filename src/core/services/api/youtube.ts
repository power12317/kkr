import axios from "axios";
const qs = require("querystring");

import * as ErrorMessages from "../../messages/error";

export class ParseError extends Error {}
class YouTubeService {
    static getVideoIdByUrl(videoUrl: string) {
        let videoId;
        if (!videoUrl) {
            throw new ParseError(ErrorMessages.CANT_PARSE_VIDEO_URL);
        }
        if (videoUrl.includes("youtube.com")) {
            videoId = videoUrl.match(/v=(.+?)(&|$)/im)[1];
        } else if (videoUrl.includes("youtu.be")) {
            videoId = videoUrl.match(/youtu.be\/(.+?)(&|$)/im)[1];
        } else {
            throw new ParseError(ErrorMessages.CANT_PARSE_VIDEO_URL);
        }
        return videoId;
    }
    /**
     * 解析视频信息
     * @param videoUrl
     */
    static async getVideoInfo(videoUrl: string) {
        const videoId = YouTubeService.getVideoIdByUrl(videoUrl);
        const API_URL = `https://youtube.com/watch?v=${videoId}`;
        const videoInfoResponse = await axios.get(API_URL, {
            headers: {
                Referer: "https://www.youtube.com/",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36",
            },
        });
        const playerConfig = JSON.parse(
            videoInfoResponse.data.match(/ytplayer\.config = ({.+?});/)[1]
        );
        const playerResponse = JSON.parse(playerConfig.args.player_response);
        const title = playerResponse?.videoDetails?.title as string;
        if (!playerResponse.streamingData) {
            throw new ParseError(ErrorMessages.NOT_A_LIVE_STREAM);
        }
        const mpdUrl = playerResponse.streamingData.dashManifestUrl as string;
        const isLowLatencyLiveStream = !!playerResponse?.videoDetails
            ?.isLowLatencyLiveStream;
        const latencyClass = playerResponse?.videoDetails
            ?.latencyClass as string;
        const isLiveDvrEnabled = !!playerResponse?.videoDetails
            ?.isLiveDvrEnabled;
        const isPremiumVideo =
            !!playerResponse?.videoDetails?.isLive &&
            !playerResponse?.videoDetails?.isLiveContent;
        let videoplaybackUrl,audioplaybackUrl;
        if(playerResponse.streamingData.adaptiveFormats[0].signatureCipher){
            videoplaybackUrl = await YouTubeService.getPlayvideoback(playerResponse.streamingData.adaptiveFormats[0].signatureCipher);//一般0号最高画质
            audioplaybackUrl = await YouTubeService.getPlayvideoback(playerResponse.streamingData.adaptiveFormats.slice(-1)[0].signatureCipher); //最后一个为音频
        }else{
            videoplaybackUrl = playerResponse.streamingData.adaptiveFormats[0].url;//一般0号最高画质
            audioplaybackUrl = playerResponse.streamingData.adaptiveFormats.slice(-1)[0].url; //最后一个为音频
            // videoplaybackUrl = "";
            // audioplaybackUrl = "";
        }
        return {
            title,
            mpdUrl,
            isLowLatencyLiveStream,
            latencyClass,
            isLiveDvrEnabled,
            isPremiumVideo,
            videoId,
            videoplaybackUrl,
            audioplaybackUrl,
        };
    }

    static async getHeartbeat(videoUrl) {
        const videoId = YouTubeService.getVideoIdByUrl(videoUrl);
        const API_URL = `https://www.youtube.com/youtubei/v1/player/heartbeat?alt=json&key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`;
        const videoInfoResponse = await axios.post(API_URL, {
            videoId: videoId,
            context: {
                client: {
                    clientName: "WEB",
                    clientVersion: "2.20200618.01.01",
                },
            },
            heartbeatRequestParams: {
                heartbeatChecks: ["HEARTBEAT_CHECK_TYPE_LIVE_STREAM_STATUS"],
            },
        });
        return videoInfoResponse.data.playabilityStatus;
    }

    static async getPlayvideoback(signatureCipher){
        const str = qs.parse(signatureCipher);
        const s = str.s;
        const sp = str.sp;
        const url = decodeURIComponent(str.url);
        return `${url}&${sp}=${encodeURIComponent(Signature.rv(s))}`;
    }

    
    

}

class Signature{
    static a: any;
    static rv(str:any){
        this.a = str.split("");
        this.BF(3);
        this.UQ(41);
        this.BF(3);
        this.UQ(3);
        this.BF(3);
        this.LD();
        return this.a.join("")
    }
    static UQ(b) {
        var a=this.a;
        var c = a[0];
        a[0] = a[b % a.length];
        a[b % a.length] = c
        this.a = a;
    }
    static BF(b) {
        this.a.splice(0, b)
    }
    static LD() {
        this.a.reverse()
    }
    
}
export default YouTubeService;
