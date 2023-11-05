/*
This program is designe to use the Telegram Bot To control a server,
the idea is to be able to do common stuff like uploading files and request info from the server location,
WIP upload and manage all kind of files.
*/
const fs = require('fs');
const https = require('https');
const axios = require('axios');
const TeleBot = require('telebot');

//Telegram bot Token and plugins, from nodemon.json
const bot = new TeleBot({ 
    token: process.env.TELEGRAM_BOT_TOKEN,
    usePlugins: ['askUser', 'commandButton']
});
//Variable to control the authenticity of the bots owner, from nodemon.json
const BOSS = process.env.BOSS;

const replyMarkup = bot.inlineKeyboard([
    [ bot.inlineButton('yeah', {callback: 'yes'}) ],
    [ bot.inlineButton('noup', {callback: 'no'}) ]
]);

//A boolean return funtion validating the authenticity of the owner
function isBoss(msg) {
    return msg.from.username == BOSS
}

//Returns the servers IP
async function ipifyMyIP() {
    return await axios.get('https://api.ipify.org/?format=json')
    .then((response)  => { console.log("The IP:", response.data.ip); return response.data.ip })
    .catch((error) => { console.log("Error: ", error) })
}

//Returns the servers Time and Date
function getServerTime() {
    const newDate = new Date();
    const formatedDate = newDate.getDate() + '/' + (newDate.getMonth() + 1)+ '/' + newDate.getFullYear() + ' - ' + newDate.getHours() + ':' + newDate.getMinutes() + ':' + newDate.getSeconds();
    console.log("Server Date Time: ", formatedDate)
    return formatedDate
}

//Check the feasibility of the necessary folder, if it does not exist create it
function checkIfDirectory(dirname) {if(!fs.existsSync(dirname)){fs.mkdir(dirname)}}

//Manages the file on the bot side
async function uploadFile(msg) {
    const botFile = await bot.getFile(msg.document.file_id);
    downloadFileToServer(msg.document.file_name, botFile.fileLink);
    msg.reply.text("File Uploaded")
}

//Uploads a file to the server
function downloadFileToServer(fileName, fileURL) {
    https.get(fileURL,(res) => { 
        checkIfDirectory('download')
        const filePath = fs.createWriteStream('download/' + fileName); 
        res.pipe(filePath); 
        filePath.on('finish',() => { 
            filePath.close(); 
            console.log('Download Completed');  
        }) 
    })
}

//Asks the user if it wants to replace the file if it already exixst
async function askUserOnFileUpload(msg){
    return await bot.sendMessage(msg.from.id, 'File already up, wanna step on it?', {replyMarkup});
}


//Bot listerners
bot.on(['/whatip', '/getip'],
    async (msg) => { msg.reply.text(isBoss(msg) ? await ipifyMyIP() : "You can't tell me what to do");
});

bot.on(['/whatday', '/getdate', '/whattime', '/gettime'], 
    async (msg) => { msg.reply.text(isBoss(msg) ? await getServerTime() : "You can't tell me what to do");
});

bot.on(['/getcv','/getcurriculum', '/getcurriculumvitae'],
    async (msg) => { 
    if(isBoss(msg)) {
        if(fs.existsSync('download/Curriculum.pdf')){
            msg.reply.text("Here It Goes");
            const document = await fs.createReadStream('download/Curriculum.pdf')
            bot.sendDocument(msg.chat.id, document)
        } else {
            msg.reply.text("No Curriculum");    
        }
    } else {
        msg.reply.text("You can't tell me what to do");
    }
});

bot.on('document',
    async (msg) => { 
    if(isBoss(msg)) {
        if(fs.existsSync('download/' + msg.document.file_name)){
            askUserOnFileUpload(msg)
            .then(bot.on('callbackQuery', (resp) => { resp.data == 'yes' ? uploadFile(msg) : msg.reply.text('File Ignored'); }) )
            .catch((error) => { console.log("Error: ", error) })
        } else {
            uploadFile(msg)
        }
    } else {
        msg.reply.text("You can't tell me what to do")
    }
});

bot.start();