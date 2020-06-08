import axios from "axios";
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
        return {
            title,
            mpdUrl,
            isLowLatencyLiveStream,
            latencyClass,
            isLiveDvrEnabled,
            isPremiumVideo,
        };
    }

    static async getHeartbeat(videoUrl) {
        const videoId = YouTubeService.getVideoIdByUrl(videoUrl);
        const API_URL = `https://www.youtube.com/heartbeat?video_id=${videoId}`;
        const videoInfoResponse = await axios.get(API_URL);
        return videoInfoResponse.data;
    }
}

export default YouTubeService;
