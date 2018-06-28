var mqtt = require('mqtt')

console.log('asdfasdfdsa')
const fs = require('fs-extra');
var md5 = require('md5');

// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Creates a client
const ttsClient = new textToSpeech.TextToSpeechClient();

const player = require('play-sound')(opts = {})

const configuration = {
  "home/baby/": {file: 'mp3/baby-is-crying.mp3', loop: true, onValue: 'on', offValue: 'off'},
  "home/streetdoor/": {file: 'mp3/alert.mp3', loop: false, onValue: 'UNLOCK', offValue: 'LOCK'},
}


var client = mqtt.connect('http://pi:1883/');

client.on('connect', function () {
  client.subscribe('#');
});


var count = 0;

const playlist = {};


// on client topic matching the door and message UNLOCK, activate the servo.
client.on('message', function (topic, message) {


  // if the topic is known, add or delete from playlist
  if (configuration[topic] !== undefined) {
    var topicConf = configuration[topic]

    if (playlist[md5(topic)] === undefined && message.toString() === topicConf.onValue) {
      console.log('add loop')
      playTopic(topicConf)
      playlist[md5(topic)] = loop(topic)
    }
    else if (message.toString() === configuration[topic].offValue) {
      clearTimeout(playlist[md5(topic)])
      delete playlist[md5(topic)]
    }
  }
  else if (topic === 'home/speaker/') {
    getFile(message.toString()).then(function (filepath){
      console.log(filepath + ' after getting file')
      player.play(filepath, function (err) {
        console.log(err)
      })
    })
  }
});

var loop = function(topic) {
  var topicConf = configuration[topic]
  return setTimeout(function () {
    playTopic(topicConf)
    playlist[md5(topic)] = loop(topic)
  }, 30000);


}

var playAlert = function() {
  player.play('mp3/alert.mp3', function (err) {
    console.log(err)
  })
}

var playTopic = function(conf) {

  playAlert()

  var alertTimeout = 2000
  setTimeout(function () {
    player.play(conf.file, function (err) {
      console.log(err)
    })
  }, alertTimeout)

}

var getFile = function(text) {
  return new Promise(function(resolve, reject){

    var filepath = filePathFromText(text)
    console.log(filepath)
    fs.pathExists(filepath).then(function (file){

      if (!file) {
        console.log('filepath ' + filepath)
        // Construct the request
        const request = {
          input: {text: text},
          // Select the language and SSML Voice Gender (optional)
          voice: {languageCode: 'en-US', ssmlGender: 'FEMALE'},
          // Select the type of audio encoding
          audioConfig: {audioEncoding: 'MP3'},
        };


        ttsClient.synthesizeSpeech(request, (err, response) => {

          if (err) {
            console.error('ERROR:', err);
            return;
          }


          fs.writeFileSync(filepath, response.audioContent, 'binary', function(err){
          console.log('Audio content written to file: ' + filepath);
          resolve(filepath)
          if (err) {
            reject(err)
          }
        })
      })


      }
      else {
        resolve(filepath)
      }



    }).catch(function (err){
      console.log('file does not exist' + err)
    })
  });


}

var filePathFromText = function(text) {
  var filename = text.replace(/\ /g , "-")
  return 'mp3/' + filename + '.mp3'
}
