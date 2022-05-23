import inquirer from "inquirer"
import axios from "axios"
import chalk from "chalk"
import * as cheerio from "cheerio"
import ora from "ora"
import { exit } from "process"

const { red, green, italic, bold, bgGreen } = chalk;

const getHtmlElements = async (search) => {
    search = search.replace(/ /g, "+");
    const spinner = ora("Searching...").start();


    const listOfGames = [];

    try {
        const response = await axios.get(`https://www.allkeyshop.com/blog/catalogue/search-${search}/`);
        const html = response.data;

        // cherrio search
        const $ = cheerio.load(html);
        const count = $(".search-results-row-link").length;
        spinner.succeed(bold(`I have found ${green(count)} games`));

        $(".search-results-row-link").each((i, el) => {
            listOfGames.push({
                name: $(el).children(".search-results-row-game").children("h2").text(),
                price: $(el).children(".search-results-row-price").text().replace(/\n/g, "").replace(/\s\s+/g, ""),
                link: $(el).attr("href")
            });
        });


        return listOfGames;

    }
    catch (error) {
        spinner.fail("Something went wrong");
        console.log(red(error));
        exit(1);
    }

}


/**
 * 
 * @param {{name: string, price: string, link: string}[]} listOfGames 
 * @param {string} selectedGame 
 * @returns {{name: string, price: string, link: string}} the selected game from the list
 */
const findGameInList = (listOfGames, selectedGame) => {
    return listOfGames.find(game => `${game.name} - ${game.price}` === selectedGame);
}

/**
 * 
 * @param {{name: string, price: string, link: string}} games 
 * @returns {Promise<string>} the selected game from the list
 */
const listGames = async (games) => {
    const answers = await inquirer.prompt([
        {
            type: "list",
            name: "game",
            message: "Which game do you want to buy?",
            choices: games.map(game => `${game.name} - ${game.price}`),
        }
    ]);

    return answers.game;
}


const welcomeTitle = () => {
    console.log(green(`
     _    _                   _ _ 
    / \\  | | _____        ___ | (_)
        / _ \\ | | / / __ | _____ / __ | | |
        / ___ \\|   <\\__ \\_____| (__| | |
        / _ /   \\_\\_ |\\_\\___ /      \\___ | _ | _ |
        ${italic("by macro21KGB")}
            `))
}

const sleep = (ms = 1000) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

welcomeTitle();

await sleep(500);

const response = await inquirer.prompt([
    {
        type: "input",
        name: "search",
        message: "What do you want to search for?",
        validate: function (value) {
            if (!value.length) {
                return "Please enter a name";
            }
            return true;
        },
    }
]);

const search = response.search;

const games = await getHtmlElements(search);


const selectedGame = await listGames(games);

const gameState = findGameInList(games, selectedGame);

console.log(bold(selectedGame));
console.log(bgGreen(gameState.link));