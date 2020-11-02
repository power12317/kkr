import { Track } from "../core/mpd_parser";


const fix_dashurl = (playbackUrls: any, tracks:any) => {
    // Format selection
    const max_videochunk = parseInt(tracks.lastvideoChunkUrl.match(/sq\/(\d*)/)[1]);
    const max_audiochunk = parseInt(tracks.lastaudioChunkUrl.match(/sq\/(\d*)/)[1]);
    const fixedVideoTrack = [];
    const fixedAudioTrack = [];
    for(let i =1 ;i<=max_videochunk; i++){
        fixedVideoTrack.push(`${playbackUrls.videoplaybackUrl}&sq=${i}`);
    }
    for(let i =1 ;i<=max_audiochunk; i++){
        fixedAudioTrack.push(`${playbackUrls.audioplaybackUrl}&sq=${i}`);
    }
    return {
        fixedVideoTrack,
        fixedAudioTrack
    }
}

export default fix_dashurl;