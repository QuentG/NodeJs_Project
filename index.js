#!/usr/bin/env node

/* -----------------------------
            MODULES
 -----------------------------   */

const program = require('commander')
const inquirer = require('inquirer')
const axios = require('axios')
const manageDB = require('./manageDB')
const file = require('./file')

/* -----------------------------
            VARIABLES
 -----------------------------   */

const theme_url = 'https://opentdb.com/api.php?amount=10&category='
const game_type_url = '&difficulty=medium&type=boolean' // Difficulty + True/False
const db = manageDB.db()
let get_theme = {}
let get_quest = {}
let allQuestions = [] // Array
let reponse = []
let score = 0

/* -----------------------------
            COMMANDES
 -----------------------------   */

program
  .version('1.0.0')
  .option('-t, --theme', 'Show themes')
  .option('-m, --music', 'Quizz music')
  .option('-h, --history', 'Quizz History' )
  .option('-j, --videos', 'Quizz Video Games')
  .option('-u, --adduser <name>', 'Add user in Database + Connection')
  .option('-s, --showusers', 'Show all users')
  // On parse
  program.parse(process.argv)

/* -----------------------------
            FONCTIONS
 -----------------------------   */

// Recupération des 3 thèmes préciser avec leur id
function getThirdTheme(){
    for(let t = 0; t < get_theme.trivia_categories.length; t++){
      const obj = get_theme.trivia_categories[t]
      // ID des 3 thèmes choisis
      if(obj.id == 12 || obj.id == 15 || obj.id == 23 ){
          console.log("Theme :", obj.name)
      }
    }
}

// Recuperation des thèmes 
function getTheme() {
  axios.get('https://opentdb.com/api_category.php').then((response) => {
      get_theme = response.data
      //Recup les thèmes choisis
      getThirdTheme()
  }).catch((err) => {
      console.log('Error :', err)
  })
}

// Recupération des questions en fonction de l'id de la catégorie + callback
function questions(callback, id_category) {
  axios.get(theme_url+id_category+game_type_url).then((response) => {
    get_quest = response.data.results
    setTimeout(() => {
      callback(get_quest)
    },600)
  }).catch((err) => {
      console.log('Error :', err)
  })
}


// Fonction qui va check si la réponse est vrai ou non
function checkReponses() {
  for(let t = 0; t < get_quest.length; t++){
    let question = t + 1
    //On défini le type des questions
    allQuestions[t] =  {
      type: 'list',
      name: `${question}`,
      message: `${get_quest[t].question}`,
      choices: ['True', 'False'],
  }
    if(get_quest[t].incorect_answer == 'True'){
        reponse[t] = 'False'
    }
    else if(get_quest[t].correct_answer == 'True'){
        reponse[t] = 'True'
    }
    else {
      console.log('Waiting ...')
    }
  }
}

function startGame(get_quest) {
  checkReponses()
  //On laisse le choix à l'utilisateur true/false
  inquirer.prompt(allQuestions).then((answer) => {
      for (let t = 0; t < 10; t++){
        console.log('Results :')
        question = t + 1
        if (answer[get_quest] == reponse[t]){
          score++
          console.log('Nice !! Good job !\n')
        }else {
          console.log('Wrooooong answer !\n')
        }
      }
      console.log(score+'/10')
      file.writeInFile('Score - '+score+'/10'+'\n')
  })
} 

/* -----------------------------
            PROGRAMME
 -----------------------------   */

if (program.theme) {
  getTheme()
}
else if(program.music) {
  questions(startGame, 12)
}
else if(program.history) {
  questions(startGame, 23)
}
else if(program.videos) {
  questions(startGame, 15)
}
else if(program.adduser){
  name = program.adduser
  manageDB.checkUserInDB(name, db)
  .then(() => {
    console.log('Welcome',name)
  })
  .catch(() => {
    manageDB.addUser(name, db)
  })
}
else if(program.showusers){
  manageDB.showUsers(db)
}
else {
    program.help()
}