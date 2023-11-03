const fs = require('fs');
const https = require('https');
const axios = require('axios');
const TeleBot = require('telebot');

const bot = new TeleBot({ 
    token: process.env.TELEGRAM_BOT_TOKEN,
    usePlugins: ['askUser', 'commandButton']
});

const replyMarkup = bot.inlineKeyboard([
    [ bot.inlineButton('yeah', {callback: 'yes'}) ],
    [ bot.inlineButton('noup', {callback: 'no'}) ]
]);

const BOSS = process.env.BOSS;

function isBoss(msg) {
    return msg.from.username == BOSS
}

async function ipifyMyIP() {
    return await axios.get('https://api.ipify.org/?format=json')
    .then((response)  => { console.log("The IP:", response.data.ip); return response.data.ip })
    .catch((error) => { console.log("Error: ", error) })
}

function getServerTime() {
    const newDate = new Date();
    const formatedDate = newDate.getDate() + '/' + (newDate.getMonth() + 1)+ '/' + newDate.getFullYear() + ' - ' + newDate.getHours() + ':' + newDate.getMinutes() + ':' + newDate.getSeconds();
    console.log("Server Date Time: ", formatedDate)
    return formatedDate
}

function checkIfDirectory(dirname) {if(!fs.existsSync(dirname)){fs.mkdir(dirname)}}

async function uploadFile(msg) {
    const botFile = await bot.getFile(msg.document.file_id);
    downloadFiletoServer(msg.document.file_name, botFile.fileLink);
    msg.reply.text("File Uploaded")
}

function downloadFiletoServer(fileName, fileURL) {
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

async function askUserOnFileUpload(msg){
    return await bot.sendMessage(msg.from.id, 'File already up, wanna step on it?', {replyMarkup});
}

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