const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const ExcelJS = require('exceljs');

// Replace 'YOUR_BOT_TOKEN_HERE' with your actual bot token
const BOT_TOKEN = '6696843234:AAHg9TNJ9V0QS4hziyPIbFSLzx9zGM2xpuY';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Function to read authorized user IDs from the text file
function readAuthorizedUserIDs() {
  try {
    const data = fs.readFileSync('authorized_ids.txt', 'utf8');
    return data.trim().split('\n').map((id) => Number(id.trim()));
  } catch (error) {
    console.error('Error reading authorized IDs from file:', error.message);
    return [];
  }
}

const AUTHORIZED_USER_IDS = readAuthorizedUserIDs();

function loginRequiredMiddleware(callback) {
  return (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (AUTHORIZED_USER_IDS.includes(userId)) {
      callback(msg);
    } else {
      bot.sendMessage(chatId, 'Authentication required. Please join @alphagodvip ');
    }
  };
}

function start(msg) {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Hello! I am your course link bot. Send me the name of a course, and I'll find the links for you!");
}

function findMovieLinks(msg) {
  const chatId = msg.chat.id;
  const movieName = msg.text.trim().toLowerCase();

  console.log('Received movie name:', movieName);

  // Load movie data from the Excel file
  const workbook = new ExcelJS.Workbook();
  workbook.xlsx.readFile('movie_data.xlsx')
    .then(() => {
      console.log('Excel file loaded successfully');

      const sheet = workbook.getWorksheet(1);
      let movieFound = false;

      sheet.eachRow((row, rowNumber) => {
        const nameCell = row.getCell(1);
        const linkCell = row.getCell(2);

        const name = nameCell.text.trim(); // Adding debug log
        const link = linkCell.text.trim(); // Adding debug log
        console.log(`Row ${rowNumber}: name=${name}, link=${link}`);

        if (name && name.toLowerCase() === movieName) {
          console.log('Movie found:', name, link);
          bot.sendMessage(chatId, `Here's the link for '${name}': ${link}`);
          movieFound = true;
          return false; // Stop iterating rows once the movie is found
        }
      });

      if (!movieFound) {
        console.log('Movie not found:', movieName);
        bot.sendMessage(chatId, "course not found. Please try again with a different name.");
      }
    })
    .catch((error) => {
      console.error('Error occurred while fetching data:', error.message);
      bot.sendMessage(chatId, "Error occurred while fetching data. Please try again later.");
    });
}

bot.onText(/\/start/, loginRequiredMiddleware(start));
bot.onText(/\/login/, loginRequiredMiddleware((msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (AUTHORIZED_USER_IDS.includes(userId)) {
    bot.sendMessage(chatId, "Authentication successful! You can now access the bot's features.");
  } else {
    bot.sendMessage(chatId, "You are not authorized to use this bot.");
  }
}));

bot.on('message', loginRequiredMiddleware(findMovieLinks));
