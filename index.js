"use strict";

const express = require("express");
const logger = require("morgan");
const path = require("path");
const formidable = require("formidable");
const shellescape = require('shell-escape');
const fs = require('fs-extra');
const cp = require('child_process');
const app = express();
app.use(logger("dev"));

app.use(express.static(path.join(__dirname, "public")));
const convertedLocation = path.join(__dirname, "public","converted")

fs.ensureDirSync(convertedLocation);

const ffmpegCommand = 'ffmpeg';
const qt_faststart = 'qt-faststart';


app.post("/upload", (req, res) => {
  new formidable.IncomingForm({
    allowEmptyFiles: false,
    maxFiles: 1,
  }).parse(req, (err, fields, files) => {
    if (err) {
      console.error("Error", err);
      throw err;
    }
    // console.log("Fields", fields);
    // console.log('Files', files)
    for (const file of Object.entries(files)) {
      console.log("file", file[1].toJSON());
    }
    /*

    video_size: '560x304',
    video_bitrate: '700',
    video_framerate: '30',
    encoding_video_deinterlace: 'on',
    encoding_enable_audio: 'on',
    encoding_audio_sampling_rate: '44100',
    encoding_audio_bitrate: '128',
    encoding_audio_channels: 'mono',
    encoding_x264: 'on',
    encoding_ogv: 'on',
    encoding_webm: 'on',
    encoding_stills: 'on',
    submit: 'Upload and convert'

    */
    const {
        video_size,
        video_bitrate,
        video_framerate,
        encoding_video_deinterlace,
        encoding_enable_audio,
        encoding_audio_sampling_rate,
        encoding_audio_bitrate,
        encoding_audio_channels,
        encoding_x264,
        encoding_ogv,
        encoding_webm,
        encoding_stills,
    } = fields;

    let command = '';

    let customParams = ` -b:v ${video_bitrate}k -r ${video_framerate}`
    if(video_size){
      customParams = ` -s ${video_size} ${customParams}`
    }
    if(encoding_video_deinterlace){
        customParams = `${customParams} -deinterlace `
    }

    if(encoding_enable_audio){
        customParams = `${customParams} -ar ${encoding_audio_sampling_rate} -ab ${encoding_audio_bitrate}k -ac ${encoding_audio_channels=='stereo'?2:1}`
    } else {
        customParams = `${customParams} -an `
    }
    customParams = `${customParams} -y`; // Overwrite existing file
    const outputFile = path.join(convertedLocation,files.video_file.newFilename+'_x264.mp4');
    const outputFile_qt = outputFile.slice(0, outputFile.length-4)+'_qt_faststart.mp4';
    if(encoding_x264||true){
        command = `${ffmpegCommand} -i "${files.video_file.filepath}" -vcodec libx264  -vsync 1  -bt 50k `
        if (encoding_enable_audio) {
            command = command + ' -c:a aac ';
        };
        
        command = command + customParams + '  ' + outputFile + '  '
        const output_ffmpeg = cp.execSync(command);
        console.log("========Conversion Output========");
        console.log("Input:",files.video_file.filepath);
        console.log("Output:", outputFile);
        console.log("=================================");
        console.log(output_ffmpeg.toString('utf-8'))
        console.log("===============End===============");

        // run qt-faststart
        // This is a useful tool if you're showing your H.264 MP4 videos on the web.
        // It relocates some data in the video to allow playback to begin before the file is completely downloaded.
        // Usage: qt-faststart input.mp4 output.mp4.
        command = `${qt_faststart} ${outputFile} ${outputFile_qt}`
        const output_qt = cp.execSync(command);
        console.log("========Conversion Output========");
        console.log("Input:",outputFile);
        console.log("Output:", outputFile_qt);
        console.log("=================================");
        console.log(output_qt.toString('utf-8'))
        console.log("===============End===============");


    }

    res.redirect(`/player.html?file=${outputFile_qt.slice(convertedLocation.length)}`)
  });
});

app.listen(3000);
console.log("listening on port 3000");
